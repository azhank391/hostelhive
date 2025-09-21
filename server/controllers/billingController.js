const stripeService = require('../services/stripeService');
const {Hostel,User} = require('../models');

exports.createCheckoutSession = async (req,res) => {
    try {
        const {priceId,planId} = req.body;
        const hostelId = req.user.hostelId;

        if (req.user.role !== 'admin') {
            return res.status(403).send("Forbidden: Only admin users can create checkout sessions");
        }

        const hostel = await Hostel.findByPk(hostelId);
        if (!hostel) {
            return res.status(404).send("Hostel not found");
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
        const session = await stripeService.createCheckoutSession(
            customerId,
            priceId,
            `${process.env.FRONTEND_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            `${process.env.FRONTEND_URL}/dashboard/billing/cancel`
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
        res.json({
            subscription_status:hostel.subscription_status,
            plan_id:hostel.plan_id,
            current_period_end: hostel.current_period_end,
            trial_end: hostel.trial_end,

        });
    } catch(error) {
        console.error("Error fetching subscription status:", error);
        res.status(500).json({message:"Failed to get subscription status"})
    }
};