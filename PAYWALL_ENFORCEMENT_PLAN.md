# Paywall Enforcement Plan

This plan defines how we will enforce plan limits and subscription status across backend and frontend, using `plan_id`, `subscription_status`, and usage quotas. It also covers lifecycle, error modes, and rollout.

## Goals
- Use backend as the source of truth for access control and quotas.
- Keep free accounts unblocked after trial if they stay within free limits.
- Allow self-serve upgrades/downgrades strictly via Stripe Checkout and webhooks.
- Provide consistent, actionable errors that the frontend can render with CTAs.

## Key Concepts
- plan_id: logical plan tier (free, basic pro, enterprise)
- subscription_status: Stripe status (trialing, active, past_due, unpaid, canceled, incomplete, incomplete_expired)
- trial_end: date; trial considered active if now < trial_end
- isPaid: legacy boolean for UI hints; not used for enforcement

## Plan Limits (example)
- free: up to 10 rooms, 20 students, 1 warden
- basic: up to 500 students, unlimited rooms, 5 wardens
- pro: unlimited everything

Note: Define limits centrally (server/config/planLimits.js) and import where needed.

## Enforcement Architecture

1) Backend middleware layers
- authMiddleware: identifies user and role
- paywallMiddleware (checkSubscription):
  - Allow superadmin always
  - Resolve hostel by req.user.hostelId
  - Determine access window: active if subscription_status in [active, trialing] OR trial_end in future
  - If inactive, return 402 with payload: { paywall: true, subscription_status, trial_end }
  - Attach req.hostelSubscription = { status, planId, trialEnd, currentPeriodEnd }
- quotaMiddleware (new):
  - On write operations (create student/room/staff, import, export heavy), check usage against plan limits
  - If limit exceeded, return 402 with payload: { paywall: true, reason: 'quota_exceeded', limit: {...}, usage: {...}, upgradeHint: plan_id }

2) Usage accounting
- Derive usage on-demand via counts to start (Room.count, User.count by role etc.)
- Optionally add denormalized counters later for performance

3) Feature gating
- Feature flags by plan via a central map, e.g., visitor stats premium-only
- Middleware can check planId against feature map before allowing route

## Stripe Lifecycle Handling
- On subscription events, webhook updates Hostel:
  - plan_id from Price metadata/nickname
  - subscription_status, current_period_start/end
  - trial_end from Stripe subscription if present
- Downgrades are applied at period end by Stripe; we honor plan_id changes when webhook updates

## Frontend Behavior
- Read `plan_id` and `subscription_status` from:
  - Hostel context endpoints and billing status endpoint
- UI gating:
  - Soft gate: hide/disable buttons, show tooltip "Requires Pro plan"
  - Hard gate: attempt -> API returns 402; show upsell modal with "Go to Billing" CTA
- Persist selected plan in HOSTELHIVE_SELECTED_PLAN; billing page passes it to checkout

## API Error Contract
- 402 Payment Required
  - { paywall: true, reason?: 'inactive' | 'quota_exceeded' | 'feature_locked', subscription_status, trial_end?, limit?, usage?, plan_id? }
- 403 Forbidden
  - Permission issues unrelated to billing

## Middleware Attachment Plan
- Attach checkSubscription to routes that require any paid/trial state (admin features beyond free tier)
- Attach quotaMiddleware to create/update endpoints where limits apply:
  - POST /rooms, POST /students, POST /staff, imports/exports as needed

## Quota Middleware Sketch
- Input: req.user.hostelId, req.hostelSubscription.planId
- Compute usage:
  - students = User.count({ role: 'student', hostelId })
  - rooms = Room.count({ hostelId })
  - wardens = User.count({ role: 'warden', hostelId })
- Compare vs plan limits; allow if within; else 402

## Edge Cases
- subscription_status=past_due/unpaid: treat as inactive unless trial still active
- canceled/incomplete/incomplete_expired: inactive unless trial still active
- trial_end missing: rely on subscription_status in [active, trialing]
- webhook delays: on first request after checkout, session complete page should poll billing status endpoint to reflect updates

## Rollout
1. Ship middleware but default quota checks to log-only in staging
2. Enable quota enforcement per-route behind an env flag (PAYWALL_ENFORCE=1)
3. Add analytics for 402 responses to tune plan limits UX

## Telemetry
- Log paywall blocks with reason, hostelId, plan_id
- Add metrics dashboard for paywall events rate and funnel to checkout

## Testing
- Unit tests for paywall and quota middleware
- Integration tests: create hostel → trial flows; exceed quotas; checkout → webhook → access allowed

## Ownership
- Backend: paywall/quota middleware and webhook updates
- Frontend: billing UI, soft gates, and modal handling of 402 responses
