
// Normalize incoming plan identifiers to canonical values used by planLimits
// Accept legacy labels like "enterprise" or "basic_pro" and map to { basic, pro }
function normalizePlanId(input) {
  if (!input) return input;
  const v = String(input).trim().toLowerCase();
  if (v === "enterprise" || v === "pro_enterprise" || v === "pro-plus") return "pro";
  if (v === "basic_pro" || v === "basic-plus" || v === "basicpro") return "basic";
  if (v === "basic" || v === "pro") return v;
  // Fallback: return as-is, but callers should still handle unknown by falling back to free
  return v;
}

// Add helper to derive period dates when Stripe didn't include them on the event payload
function addInterval(date, interval, count) {
  const d = new Date(date.getTime());
  const c = Math.max(1, Number(count) || 1);
  switch (interval) {
    case 'day':
      d.setDate(d.getDate() + c);
      break;
    case 'week':
      d.setDate(d.getDate() + 7 * c);
      break;
    case 'month':
      d.setMonth(d.getMonth() + c);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() + c);
      break;
    default:
      d.setMonth(d.getMonth() + c);
  }
  return d;
}

function derivePeriodDatesFromSubscription(sub) {
  if (!sub) return { start: null, end: null };
  const start = sub.current_period_start
    ? new Date(sub.current_period_start * 1000)
    : sub.billing_cycle_anchor
    ? new Date(sub.billing_cycle_anchor * 1000)
    : null;
  let end = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  if (!end && start) {
    const price = sub.items?.data?.[0]?.price;
    const interval = price?.recurring?.interval; // 'day'|'week'|'month'|'year'
    const intervalCount = price?.recurring?.interval_count || 1;
    if (interval) {
      end = addInterval(start, interval, intervalCount);
    }
  }
  return { start, end };
}

module.exports = { normalizePlanId, derivePeriodDatesFromSubscription };
