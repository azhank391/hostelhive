const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a new customer in Stripe
class StripeService {
    async createCustomer(email,name) {
        return await stripe.customers.create({
            email,
            name,
            metaData
        })
    }
    async createSubscription(customerId, priceId, trialDays) {
        return await stripe.subscriptions.create({
            customer: customerId,
            items: [{price:priceId}],
            trial_period_days: trialDays,
            expand: ['latest_invoice.payment_intent'],
        })
}
    async createCheckoutSession(customerId,priceId,successUrl,cancelUrl) {
        return await stripe.checkout.session.create({
            customer:customerId,
            payment_method_types: ['card'],
            line_items: [{
                price:priceId,
                quantity:1
            }],
            mode:'subscription',
            success_url:successUrl,
            cancel_url:cancelUrl,
        })
    }

    async cancelSubscription(subscriptionId) {
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });
    }

    async updateSubscription(subscriptionId, newPriceId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return await stripe.subscriptions.update(subscriptionId, {
            items: [{
                id:subscription.items.data[0].id,
                price:newPriceId
            }]
        });
    }
}
module.exports = new StripeService();