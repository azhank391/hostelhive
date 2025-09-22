const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a new customer in Stripe
class StripeService {
    async createCustomer(email, name, metadata = {}) {
        return await stripe.customers.create({
            email,
            name,
            metadata, // proper Stripe metadata
        });
    }
    async createSubscription(customerId, priceId, trialDays) {
        return await stripe.subscriptions.create({
            customer: customerId,
            items: [{price:priceId}],
            trial_period_days: trialDays,
            expand: ['latest_invoice.payment_intent'],
        })
}
    async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, clientReferenceId, planId, trialDays) {
        return await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            client_reference_id: clientReferenceId,
            // Trial logic is controlled via Price configuration (trial_period_days)
            subscription_data: {
                trial_period_days: trialDays,
                metadata: planId ? { plan_id: planId } : undefined,
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
    }

    async getCheckoutSession(sessionId) {
        return await stripe.checkout.sessions.retrieve(sessionId);
    }

    async retrieveSubscription(subscriptionId) {
        return await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
    }

    async cancelSubscription(subscriptionId) {
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });
    }

    async resumeSubscription(subscriptionId) {
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
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