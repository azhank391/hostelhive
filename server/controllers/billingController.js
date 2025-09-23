const stripeService = require('../services/stripeService');
const {Hostel,User} = require('../models');

exports.createCheckoutSession = async (req,res) => {
    try {
        const {priceId,planId,isTrial} = req.body;
        const hostelId = req.user.hostelId;

        if (req.user.role !== 'owner') {
            return res.status(403).send("Forbidden: Only owner users can create checkout sessions");
        }

        const hostel = await Hostel.findByPk(hostelId);
        if (!hostel) {
            return res.status(404).send("Hostel not found");
        }
        // Prevent re-subscribing to the same plan while active
        if (hostel.subscription_status === 'active' && hostel.plan_id === planId) {
            return res.status(400).json({
                message: 'You are already subscribed to this plan',
                code: 'already_subscribed',
            });
        }
        //create customer if not exists
        let customerId = hostel.stripe_customer_id;
        if (!customerId) {
            const customer = await stripeService.createCustomer(req.user.email,
                `${hostel.name} - ${req.user.name}`,
                {hostelId,ownerId:req.user.id}
            );
            customerId = customer.id;
            await hostel.update({stripe_customer_id:customerId})
        }
        //create session
        // Do NOT persist plan selection yet; DB updates only via Checkout success/webhooks

        // Dynamic trials: apply 14-day trial only when isTrial=true AND planId==='basic'
        const trialDays = isTrial && planId === 'basic' ? 14 : undefined;
        const session = await stripeService.createCheckoutSession(
            customerId,
            priceId,
            `${process.env.FRONTEND_URL}/dashboard/hostels/${hostelId}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            `${process.env.FRONTEND_URL}/dashboard/hostels/${hostelId}/billing/cancel`,
            `${hostelId}:${req.user.id}`,
            planId,
            trialDays
        )
        res.json({sessionId: session.id});
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.getSubscriptionStatus = async (req,res) => {
    try {
        const hostelId = req.user.hostelId;
        const hostel = await Hostel.findByPk(hostelId);
        if(!hostel) {
            return res.status(404).send("Hostel not found");
        }
        // If we have a Stripe subscription but missing dates, fetch from Stripe as a safety net
        try {
            if (hostel.stripe_subscription_id && (!hostel.current_period_end || !hostel.current_period_start)) {
                const sub = await stripeService.retrieveSubscription(hostel.stripe_subscription_id);
                const item = sub?.items?.data?.[0];
                const fromMetadata = item?.price?.metadata?.plan_id;
                const planId = fromMetadata || hostel.plan_id;
                await hostel.update({
                    current_period_start: sub?.current_period_start ? new Date(sub.current_period_start * 1000) : hostel.current_period_start,
                    current_period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000) : hostel.current_period_end,
                    trial_end: sub?.trial_end ? new Date(sub.trial_end * 1000) : hostel.trial_end,
                    subscription_status: sub?.status || hostel.subscription_status,
                    plan_id: planId,
                });
            }
        } catch (e) {
            console.warn('Subscription reconcile in getSubscriptionStatus failed:', e?.message || e);
        }
        // Return canonical plan id stored in DB as-is (source of truth)
        let plan_id = hostel.plan_id;
        res.json({
            subscription_status:hostel.subscription_status,
            plan_id,
            stripe_subscription_id: hostel.stripe_subscription_id,
            current_period_start: hostel.current_period_start,
            current_period_end: hostel.current_period_end,
            trial_end: hostel.trial_end,

        });
    } catch(error) {
        console.error("Error fetching subscription status:", error);
        res.status(500).json({message:"Failed to get subscription status"})
    }
};

// Reconcile subscription after checkout success (in case webhooks lag)
exports.syncCheckoutSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ message: 'sessionId required' });
        const hostelId = req.user.hostelId;
        const hostel = await Hostel.findByPk(hostelId);
        if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

        const session = await stripeService.getCheckoutSession(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        let planId = hostel.plan_id;
        let currentPeriodStart = hostel.current_period_start;
        let currentPeriodEnd = hostel.current_period_end;
        let trialEnd = hostel.trial_end;
        let subStatus = hostel.subscription_status;
        try {
            // Prefer expanded subscription from session if available
            const sub = typeof session.subscription === 'object' ? session.subscription : (subscriptionId ? await stripeService.retrieveSubscription(subscriptionId) : null);
            if (sub) {
                const item = sub?.items?.data?.[0];
                const fromSubMetadata = sub?.metadata?.plan_id;
                const fromPriceMetadata = item?.price?.metadata?.plan_id;
                if (fromSubMetadata || fromPriceMetadata) planId = fromSubMetadata || fromPriceMetadata;
                currentPeriodStart = sub?.current_period_start ? new Date(sub.current_period_start * 1000) : currentPeriodStart;
                currentPeriodEnd = sub?.current_period_end ? new Date(sub.current_period_end * 1000) : currentPeriodEnd;
                trialEnd = sub?.trial_end ? new Date(sub.trial_end * 1000) : trialEnd;
                subStatus = sub?.status || subStatus;
            }
        } catch {}

    // Keep canonical plan ids as provided by Stripe metadata

        await hostel.update({
            stripe_subscription_id: subscriptionId || hostel.stripe_subscription_id,
            subscription_status: subStatus,
            plan_id: planId || hostel.plan_id,
            isPaid: !!subscriptionId || hostel.isPaid,
            isActive: !!subscriptionId || hostel.isActive,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            trial_end: trialEnd,
        });

        res.json({
            subscription_status: hostel.subscription_status,
            plan_id: hostel.plan_id,
            current_period_end: hostel.current_period_end,
            trial_end: hostel.trial_end,
        });
    } catch (error) {
        console.error('Error syncing checkout session:', error);
        res.status(500).json({ message: 'Failed to sync checkout session' });
    }
};

// Cancel subscription at period end
exports.cancelSubscription = async (req, res) => {
    try {
        const hostelId = req.user.hostelId;
        const hostel = await Hostel.findByPk(hostelId);
        if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
        if (!hostel.stripe_subscription_id) return res.status(400).json({ message: 'No active subscription to cancel' });

        const sub = await stripeService.cancelSubscription(hostel.stripe_subscription_id);
        await hostel.update({ 
            // Stripe keeps status 'active' until the end of the period; we set local status to 'canceled' for UX
            subscription_status: 'canceled',
            current_period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000) : hostel.current_period_end,
        });

        res.json({ message: 'Subscription cancellation scheduled', subscription_status: hostel.subscription_status, current_period_end: hostel.current_period_end });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ message: 'Failed to cancel subscription' });
    }
};

// Resume subscription (undo cancel_at_period_end)
exports.resumeSubscription = async (req, res) => {
    try {
        const hostelId = req.user.hostelId;
        const hostel = await Hostel.findByPk(hostelId);
        if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
        if (!hostel.stripe_subscription_id) return res.status(400).json({ message: 'No subscription to resume' });

        const sub = await require('../services/stripeService').resumeSubscription(hostel.stripe_subscription_id);
        await hostel.update({ 
            subscription_status: sub?.status || 'active',
            current_period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000) : hostel.current_period_end,
        });
        res.json({ message: 'Subscription resumed', subscription_status: hostel.subscription_status, current_period_end: hostel.current_period_end });
    } catch (error) {
        console.error('Error resuming subscription:', error);
        res.status(500).json({ message: 'Failed to resume subscription' });
    }
};

// Cancel immediately (used for trials or if the user wants to end access now)
exports.cancelSubscriptionNow = async (req, res) => {
    try {
        const hostelId = req.user.hostelId;
        const hostel = await Hostel.findByPk(hostelId);
        if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
        if (!hostel.stripe_subscription_id) return res.status(400).json({ message: 'No subscription to cancel' });

        const sub = await require('../services/stripeService').cancelSubscriptionNow(hostel.stripe_subscription_id);
        await hostel.update({ 
            subscription_status: sub?.status || 'canceled',
            current_period_end: sub?.canceled_at ? new Date(sub.canceled_at * 1000) : hostel.current_period_end,
        });
        res.json({ message: 'Subscription canceled immediately', subscription_status: hostel.subscription_status });
    } catch (error) {
        console.error('Error immediate cancel subscription:', error);
        res.status(500).json({ message: 'Failed to cancel subscription immediately' });
    }
};