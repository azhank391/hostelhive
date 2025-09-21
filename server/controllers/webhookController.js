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
        where: {stripe_customer_id: subscription.customer}
    });
    if (hostel) {
        await hostel.update ({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        })
    }
}
async function handleSubscriptionCanceled(subscription) {
    const hostel = await Hostel.findOne({
        where: {stripe_customer_id: subscription.id}
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
      hostel.plan = invoice.lines.data[0]?.price?.nickname || hostel.plan; // optional
      await hostel.save();
      console.log("🏠 Hostel updated:", hostel.id);
    } else {
      console.warn("⚠️ No hostel found for customer", customerId);
    }
  } catch (err) {
    console.error("❌ Error in handlePaymentSucceeded:", err);
  }
}
