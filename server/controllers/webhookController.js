
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Hostel } = require("../models");
const stripeService = require("../services/stripeService");
const { normalizePlanId, derivePeriodDatesFromSubscription } = require("../utils/billingUtils");

// Helper function to update hostel subscription data
async function updateHostelWithSubscription(hostel, subscription) {
  if (!subscription) return;

  // Defensive: if subscription is a lightweight object without period dates, refetch full
  if (!subscription.current_period_end || !subscription.current_period_start) {
    try {
      const fresh = await stripeService.retrieveSubscription(subscription.id);
      if (fresh) subscription = fresh;
    } catch (e) {
      console.warn('Webhook: failed to refetch subscription for full data', e?.message || e);
    }
  }

  // Get plan from subscription metadata or price metadata
  const item = subscription.items?.data?.[0];
  const fromSubMetadata = subscription.metadata?.plan_id;
  const fromPriceMetadata = item?.price?.metadata?.plan_id;
  const planId = normalizePlanId(fromSubMetadata || fromPriceMetadata || "basic");

  const updateData = {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.cancel_at_period_end
      ? "canceled"
      : subscription.status,
    current_period_start: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : derivePeriodDatesFromSubscription(subscription).start || hostel.current_period_start,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : derivePeriodDatesFromSubscription(subscription).end || hostel.current_period_end,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : hostel.trial_end,
    plan_id: planId,
    isPaid: true,
    isActive: true,
    cancel_at_period_end: !!subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : hostel.canceled_at,
    billing_cycle_anchor: subscription.billing_cycle_anchor
      ? new Date(subscription.billing_cycle_anchor * 1000)
      : hostel.billing_cycle_anchor,
  };

  console.log("📝 Updating hostel:", hostel.id, JSON.stringify(updateData, null, 2));
  await hostel.update(updateData);
}

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("🎯 Processing webhook:", event.type, event.id);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("💳 Checkout completed:", session.id);

        const hostel = await Hostel.findOne({
          where: { stripe_customer_id: session.customer },
        });

        if (!hostel) {
          console.error("❌ No hostel found for customer:", session.customer);
          break;
        }

        if (session.subscription) {
          const subscription = await stripeService.retrieveSubscription(
            session.subscription
          );
          await updateHostelWithSubscription(hostel, subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("🔄 Subscription event:", subscription.id);

        const hostelForSub = await Hostel.findOne({
          where: { stripe_customer_id: subscription.customer },
        });

        if (hostelForSub) {
          await updateHostelWithSubscription(hostelForSub, subscription);
        }
        break;
      }

      case "invoice.paid":
      case "invoice.finalized": {
        const invoice = event.data.object;
        console.log("📄 Invoice event:", invoice.id);

        if (invoice.subscription) {
          const sub = await stripeService.retrieveSubscription(
            invoice.subscription
          );
          const hostelForInvoice = await Hostel.findOne({
            where: { stripe_customer_id: invoice.customer },
          });

          if (hostelForInvoice) {
            await updateHostelWithSubscription(hostelForInvoice, sub);
          }
        }
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err.message);
    return res.status(500).send(`Webhook Handler Error: ${err.message}`);
  }
};
