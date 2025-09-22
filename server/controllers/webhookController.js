const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {Hostel} = require('../models');

exports.handleStripeWebhook = async (req,res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
    event = stripe.webhooks.constructEvent(req.body,sig,process.env.STRIPE_WEBHOOK_SECRET);

    } catch (err) {
        console.log('webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionCanceled(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            case 'invoice.created':
            case 'invoice.finalized':
            case 'invoice.paid':
                await handleInvoiceEvent(event.type, event.data.object);
                break;
            case 'payment_intent.succeeded':
            case 'payment_intent.created':
                console.log(`ℹ️ Payment Intent event: ${event.type} for ${event.data.object.id}`);
                break;
            case 'customer.created':
            case 'customer.updated':
            case 'payment_method.attached':
            case 'product.created':
            case 'plan.created':
            case 'price.created':
            case 'charge.succeeded':
                console.log(`ℹ️ Informational event: ${event.type}`);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({received: true});
    } catch (error) {
        console.error('webhook handler error;',error);
        res.status(500).json({error: 
            'Webhook handler failed'
        });
    }

};
async function handleSubscriptionUpdate(subscription) {
    const hostel = await Hostel.findOne({
        where: { stripe_customer_id: subscription.customer },
    });
    if (hostel) {
        // Prefer canonical plan_id from price metadata; never blindly trust nickname
        let planId = hostel.plan_id;
        try {
            // Prefer subscription metadata set during Checkout
            const fromSubMetadata = subscription?.metadata?.plan_id;
            const item = subscription.items?.data?.[0];
            const fromPriceMetadata = item?.price?.metadata?.plan_id;
            planId = fromSubMetadata || fromPriceMetadata || planId;
        } catch {}
        // Map any legacy values to canonical IDs
        if (planId === 'basic_pro') planId = 'basic';
        if (planId === 'enterprise') planId = 'pro';

        await hostel.update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000)
                : null,
            current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            plan_id: planId || hostel.plan_id,
        });
    }
}
async function handleSubscriptionCanceled(subscription) {
    const hostel = await Hostel.findOne({
        where: { stripe_subscription_id: subscription.id }
    });
    if (hostel) {
        await hostel.update ({
            subscription_status: 'canceled',
        })
    }
}

async function handlePaymentSucceeded(invoice) {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    console.log("✅ Invoice paid for customer:", customerId);

    // Update hostel’s status
        const hostel = await Hostel.findOne({ where: { stripe_customer_id: customerId } });
        if (hostel) {
      hostel.isPaid = true;
      hostel.isActive = true;
            // Update plan_id if embedded in price metadata or nickname
            const price = invoice.lines?.data?.[0]?.price;
            const inferredPlanId = price?.metadata?.plan_id || price?.nickname || hostel.plan_id;
            hostel.plan_id = inferredPlanId || hostel.plan_id;
                        if (subscriptionId) {
                                hostel.stripe_subscription_id = subscriptionId;
                                hostel.subscription_status = 'active';
                        }
      await hostel.save();
      console.log("🏠 Hostel updated:", hostel.id);
    } else {
      console.warn("⚠️ No hostel found for customer", customerId);
    }
  } catch (err) {
    console.error("❌ Error in handlePaymentSucceeded:", err);
  }
}

async function handleInvoiceEvent(type, invoice) {
    try {
        const customerId = invoice.customer;
        const hostel = await Hostel.findOne({ where: { stripe_customer_id: customerId } });
        if (!hostel) {
            console.warn(`⚠️ Invoice event ${type} but no hostel for customer ${customerId}`);
            return;
        }

        if (type === 'invoice.paid' || type === 'invoice.finalized') {
            // Also try to keep plan_id in sync on invoice events
            const price = invoice.lines?.data?.[0]?.price;
            const inferredPlanId = price?.metadata?.plan_id || price?.nickname || hostel.plan_id;
            await hostel.update({ 
                isPaid: true, 
                isActive: true, 
                plan_id: inferredPlanId,
                stripe_subscription_id: invoice.subscription || hostel.stripe_subscription_id,
                subscription_status: invoice.paid ? 'active' : hostel.subscription_status,
            });
        }
        console.log(`✅ Processed invoice event ${type} for hostel ${hostel.id}`);
    } catch (err) {
        console.error(`❌ Error in handleInvoiceEvent(${type}):`, err);
    }
}

async function handleCheckoutSessionCompleted(session) {
    try {
        // session.subscription can be a string ID
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const hostel = await Hostel.findOne({ where: { stripe_customer_id: customerId } });
        if (!hostel) return;

        // Try to infer plan_id
        let planId = hostel.plan_id;
        let subStatus = 'active';
        let currentPeriodStart = hostel.current_period_start;
        let currentPeriodEnd = hostel.current_period_end;
        let trialEnd = hostel.trial_end;
        try {
            const subscription = subscriptionId
                ? await require('../services/stripeService').retrieveSubscription(subscriptionId)
                : null;
            const item = subscription?.items?.data?.[0];
            const fromSubMetadata = subscription?.metadata?.plan_id;
            const fromPriceMetadata = item?.price?.metadata?.plan_id;
            planId = fromSubMetadata || fromPriceMetadata || planId;
            if (subscription) {
                subStatus = subscription.status || subStatus;
                currentPeriodStart = subscription.current_period_start
                    ? new Date(subscription.current_period_start * 1000)
                    : currentPeriodStart;
                currentPeriodEnd = subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000)
                    : currentPeriodEnd;
                trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : trialEnd;
            }
        } catch {}

        // Normalize plan ids
        if (planId === 'basic_pro') planId = 'basic';
        if (planId === 'enterprise') planId = 'pro';

        await hostel.update({
            stripe_subscription_id: subscriptionId || hostel.stripe_subscription_id,
            subscription_status: subStatus,
            plan_id: planId || hostel.plan_id,
            isPaid: true,
            isActive: true,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            trial_end: trialEnd,
        });
        console.log('✅ checkout.session.completed processed for hostel', hostel.id);
    } catch (err) {
        console.error('❌ Error in handleCheckoutSessionCompleted:', err);
    }
}
