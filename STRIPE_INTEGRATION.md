# Stripe Integration Guide

This document explains how Stripe subscriptions are integrated in HostelHive, how plan selection flows from the client to the server, and how subscription lifecycle events update your database.

## Overview

- Plans are identified internally by `plan_id` (e.g., basic, premium, enterprise).
- Billing is handled via Stripe Checkout in subscription mode.
- Webhooks are the source of truth for subscription status. We update these fields on the `Hostel` model:
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `subscription_status` (active, trialing, past_due, canceled, etc.)
  - `current_period_start`, `current_period_end`
  - `trial_end`
  - `plan_id` (derived from Stripe price metadata or nickname)
- The legacy column `plan` has been deprecated and removed. All code uses `plan_id`.

## Environment Variables

Configure these in the server environment (.env):

- STRIPE_SECRET_KEY=sk_test_xxx
- STRIPE_WEBHOOK_SECRET=whsec_xxx
- FRONTEND_URL=http://localhost:3000
- BACKEND_URL=http://localhost:5000

Client-side:
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

## Price and Plan Mapping

Stripe Prices should include a clear mapping to your internal plan identifiers. Recommended options:

- Add `plan_id` in the price metadata (preferred):
  - price_xxx metadata: { "plan_id": "basic" }
  - price_yyy metadata: { "plan_id": "premium" }
- Alternatively, set Price nickname to the internal plan_id (e.g., basic, premium) and we fall back to nickname when metadata is absent.

## Database Fields (Hostel model)

The `Hostel` table includes:
- plan_id: string (our internal logical plan)
- subscription_status: string (Stripe status)
- stripe_customer_id, stripe_subscription_id: strings
- current_period_start, current_period_end, trial_end: dates
- isPaid: boolean (legacy convenience flag; for UI use only)

Legacy `plan` column has been dropped via migration.

## Default Trial Behavior

When a new hostel is created (owner self-serve or superadmin assisted):
- plan_id defaults to `basic`
- subscription_status is set to `trialing`
- trial_end is set to now + 14 days
- isPaid defaults to false

After a successful checkout, Stripe webhooks update subscription_status to `active` and set current period windows. Trial transitions are also reflected via webhooks.

## Checkout Flow

1. User selects a plan on client (saved in HOSTELHIVE_SELECTED_PLAN).
2. Client calls the server to create a Checkout Session with the selected `plan_id`.
3. Server stores the intended `plan_id` on the hostel immediately, then creates a Stripe Checkout session in subscription mode and returns `{ sessionId }`.
4. Client calls `stripe.redirectToCheckout({ sessionId })`.

Important: The client HTTP helper returns parsed JSON directly; don’t access `.data.sessionId`. Use `response.sessionId`.

## Webhooks

We handle key events in `server/controllers/webhookController.js`:
- customer.subscription.created/updated/deleted
- invoice.finalized/paid/payment_succeeded

On these events, we update:
- subscription_status
- stripe_customer_id and stripe_subscription_id
- current_period_start, current_period_end, trial_end
- plan_id (inferred from price metadata or nickname)
- isPaid/isActive toggles on invoice events (for UI convenience)

Ensure your webhook endpoint uses raw body parsing and the Stripe signature verification.

## Migrations

- A consolidated migration ensures subscription columns exist and drops the legacy `plan` column. Run your migrations after pulling these changes.

## Admin/Superadmin Behavior

- There is no direct endpoint to set a plan. Plan changes must go through Stripe Checkout or Stripe Admin, with webhooks syncing back.
- Superadmin analytics, lists, and billing now reference `plan_id`.

## Troubleshooting

- IntegrationError: redirectToCheckout must be called with a valid sessionId
  - Fix: Ensure the client uses `response.sessionId`, not `response.data.sessionId`.
- Webhook received but fields not updating
  - Check Stripe Price metadata includes `plan_id`, or set the Price nickname to the internal plan id.
  - Verify STRIPE_WEBHOOK_SECRET and raw body parsing.
- Old APIs returning undefined `plan`
  - Update your client code to read `plan_id`. All routes now expose `plan_id` instead of `plan`.

## Local Testing Tips

- Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:5000/api/webhook`
- Create test Checkout Sessions with test prices that include metadata `plan_id`.
- Monitor server logs for webhook updates and confirm fields on the hostel row.
