
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

  console.log("🔍 Plan ID extraction:", {
    fromSubMetadata,
    fromPriceMetadata,
    normalizedPlanId: planId,
    subscriptionId: subscription.id,
    hostelId: hostel.id
  });

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
      : null,
    plan_id: planId,
    isPaid: subscription.status === 'active' || subscription.status === 'trialing',
    isActive: true,
    cancel_at_period_end: !!subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
    billing_cycle_anchor: subscription.billing_cycle_anchor
      ? new Date(subscription.billing_cycle_anchor * 1000)
      : null,
  };

  console.log("📝 Updating hostel:", hostel.id, JSON.stringify(updateData, null, 2));
  
  // Store old values before update
  const oldPlanId = hostel.plan_id;
  const oldSubscriptionStatus = hostel.subscription_status;
  const oldIsPaid = hostel.isPaid;
  
  // Update the hostel record
  await hostel.update(updateData);
  
  // Reload to get fresh data
  await hostel.reload();
  
  // Log successful update with before/after comparison
  console.log("✅ Hostel updated successfully:", {
    hostelId: hostel.id,
    hostelName: hostel.name,
    oldPlanId: oldPlanId,
    newPlanId: hostel.plan_id,
    oldSubscriptionStatus: oldSubscriptionStatus,
    newSubscriptionStatus: hostel.subscription_status,
    oldIsPaid: oldIsPaid,
    newIsPaid: hostel.isPaid,
    stripeSubscriptionId: hostel.stripe_subscription_id,
    currentPeriodStart: hostel.current_period_start,
    currentPeriodEnd: hostel.current_period_end,
    trialEnd: hostel.trial_end,
    billingCycleAnchor: hostel.billing_cycle_anchor,
    cancelAtPeriodEnd: hostel.cancel_at_period_end,
    canceledAt: hostel.canceled_at
  });
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
        console.log("💳 Checkout completed:", session.id, {
          customer: session.customer,
          subscription: session.subscription,
          paymentStatus: session.payment_status
        });

        const hostel = await Hostel.findOne({
          where: { stripe_customer_id: session.customer },
        });

        if (!hostel) {
          console.error("❌ No hostel found for customer:", session.customer);
          break;
        }

        console.log("✅ Found hostel:", {
          hostelId: hostel.id,
          hostelName: hostel.name,
          currentPlanId: hostel.plan_id
        });

        if (session.subscription) {
          const subscription = await stripeService.retrieveSubscription(
            session.subscription
          );
          console.log("📦 Retrieved subscription:", {
            id: subscription.id,
            status: subscription.status,
            metadata: subscription.metadata,
            priceMetadata: subscription.items?.data?.[0]?.price?.metadata
          });
          await updateHostelWithSubscription(hostel, subscription);
        } else {
          console.warn("⚠️ No subscription in checkout session");
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("🔄 Subscription event:", subscription.id, {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });

        const hostelForSub = await Hostel.findOne({
          where: { stripe_customer_id: subscription.customer },
        });

        if (hostelForSub) {
          console.log("✅ Found hostel for subscription:", {
            hostelId: hostelForSub.id,
            hostelName: hostelForSub.name,
            currentPlanId: hostelForSub.plan_id
          });
          await updateHostelWithSubscription(hostelForSub, subscription);
        } else {
          console.error("❌ No hostel found for subscription customer:", subscription.customer);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("🗑️ Subscription deleted:", subscription.id);

        const hostelForDeletion = await Hostel.findOne({
          where: { stripe_customer_id: subscription.customer },
        });

        if (hostelForDeletion) {
          console.log("⬇️ Downgrading hostel to free plan:", hostelForDeletion.id);
          await hostelForDeletion.update({
            stripe_subscription_id: null,
            subscription_status: 'canceled',
            plan_id: 'free',
            isPaid: false,
            cancel_at_period_end: false,
            canceled_at: new Date()
          });
          console.log("✅ Hostel downgraded to free plan");
        }
        break;
      }

      case "invoice.paid":
      case "invoice.finalized": {
        const invoice = event.data.object;
        console.log("📄 Invoice event:", event.type, invoice.id, {
          customer: invoice.customer,
          subscription: invoice.subscription,
          status: invoice.status,
          amountPaid: invoice.amount_paid
        });

        if (invoice.subscription) {
          const sub = await stripeService.retrieveSubscription(
            invoice.subscription
          );
          const hostelForInvoice = await Hostel.findOne({
            where: { stripe_customer_id: invoice.customer },
          });

          if (hostelForInvoice) {
            console.log("✅ Found hostel for invoice:", {
              hostelId: hostelForInvoice.id,
              hostelName: hostelForInvoice.name
            });
            await updateHostelWithSubscription(hostelForInvoice, sub);
          } else {
            console.error("❌ No hostel found for invoice customer:", invoice.customer);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("⚠️ Invoice payment failed:", invoice.id, {
          customer: invoice.customer,
          subscription: invoice.subscription,
          attemptCount: invoice.attempt_count
        });

        const hostelForFailure = await Hostel.findOne({
          where: { stripe_customer_id: invoice.customer },
        });

        if (hostelForFailure && invoice.subscription) {
          // Update subscription status to past_due
          const sub = await stripeService.retrieveSubscription(invoice.subscription);
          await hostelForFailure.update({
            subscription_status: sub.status, // Should be 'past_due' or 'unpaid'
            isPaid: false
          });
          console.log("⚠️ Updated hostel subscription status to:", sub.status);
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
