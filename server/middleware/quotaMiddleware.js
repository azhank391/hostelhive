const { Hostel, User, Room, VisitorLog, Complaint } = require("../models");
const planLimits = require("../config/planLimits");
const { normalizePlanId } = require("../utils/billingUtils");

// Map resource keys to models and count predicates
const resourceConfig = {
  students: {
    limitKey: "max_students",
    count: async (hostelId) => {
      return User.count({ where: { hostelId, role: "student" } });
    },
  },
  rooms: {
    limitKey: "max_rooms",
    count: async (hostelId) => {
      return Room.count({ where: { hostelId } });
    },
  },
  wardens: {
    limitKey: "max_wardens",
    count: async (hostelId) => {
      return User.count({ where: { hostelId, role: "warden" } });
    },
  },
  visitors: {
    limitKey: "max_visitors",
    count: async (hostelId) => {
      return VisitorLog.count({ where: { hostelId } });
    },
  },
  complaints: {
    limitKey: "max_complaints",
    count: async (hostelId) => {
      return Complaint.count({ where: { hostelId } });
    },
  },
  hostels: {
    limitKey: "max_hostels",
    count: async (hostelId, req) => {
      // For hostels quota, count hostels owned by the current user
      if (!req?.user?.id) return 0;
      return Hostel.count({ where: { ownerId: req.user.id } });
    },
  },

  staff: {
    limitKey: "max_staff",
    count: async (hostelId) => {
      // Count users with an explicit 'staff' role if such a role exists in your system
      return User.count({ where: { hostelId, role: "staff" } });
    },
  },
};

// Factory to create a quota check middleware for a given resource key
const enforceQuota = (resourceKey) => {
  return async (req, res, next) => {
    try {
      // Allow superadmin to bypass
      if (req.user && req.user.role === "superadmin") {
        return next();
      }

      const isOwnerHostelQuota = resourceKey === "hostels";
      let hostelId = req.params.hostelId || req.hostelId || req.user?.hostelId;
      let hostel = null;
  let planId;
      if (!isOwnerHostelQuota) {
        if (!hostelId) {
          return res
            .status(403)
            .json({
              message: "Hostel context missing",
              code: "hostel_context_missing",
            });
        }
        hostel = await Hostel.findByPk(hostelId);
        if (!hostel) {
          return res.status(404).json({ message: "Hostel not found" });
        }
        // Determine enforcement based on subscription_status and period bounds
        const now = Date.now();
        const periodEnd = hostel.current_period_end
          ? new Date(hostel.current_period_end).getTime()
          : null;
        const withinGrace =
          hostel.subscription_status === "canceled" &&
          !!periodEnd &&
          now < periodEnd;

        if (
          (hostel.subscription_status === "active" || withinGrace) &&
          hostel.plan_id
        ) {
          // Active subscription or canceled-but-still-in-period → enforce actual plan limits
          planId = hostel.plan_id;
        } else if (hostel.subscription_status === "trialing") {
          // Trial period → enforce trial limits
          planId = "trial_basic";
        } else {
          // No subscription/free/expired
          planId = "free";
        }
      } else {
        // For hostels quota (per-owner), derive the owner's best plan from any of their hostels
        const ownerId = req?.user?.id;
        planId = "free";
        if (ownerId) {
          const ownerHostels = await Hostel.findAll({ where: { ownerId } });
          // Determine highest entitlement: pro > basic > trial_basic > free
          let best = "free";
          const nowTs = Date.now();
          for (const h of ownerHostels) {
            const status = h.subscription_status;
            const periodEndTs = h.current_period_end ? new Date(h.current_period_end).getTime() : null;
            const inGrace = status === "canceled" && !!periodEndTs && nowTs < periodEndTs;
            const isActiveLike = status === "active" || inGrace;
            const isTrial = status === "trialing";
            let candidate = "free";
            if (isActiveLike && h.plan_id) {
              candidate = normalizePlanId(h.plan_id) || h.plan_id;
            } else if (isTrial) {
              candidate = "trial_basic";
            }
            const rank = (p) => (p === "pro" ? 3 : p === "basic" ? 2 : p === "trial_basic" ? 1 : 0);
            if (rank(candidate) > rank(best)) best = candidate;
          }
          planId = best;
        }
      }
  // Normalize plan id and map to limits
  const normalized = normalizePlanId(planId) || planId;
  const plan = planLimits[normalized] || planLimits.free;

      const cfg = resourceConfig[resourceKey];
      if (!cfg) return next();

      const currentUsage = await cfg.count(hostelId, req);
      const limit = plan[cfg.limitKey] ?? Number.MAX_SAFE_INTEGER;

      if (currentUsage >= limit) {
        const upgradeUrl = hostelId
          ? `/dashboard/hostels/${hostelId}/billing?plan=pro`
          : `/dashboard/billing?plan=pro`;
        return res.status(402).json({
          message: `Quota exceeded for ${resourceKey}`,
          code: "quota_exceeded",
          paywall: true,
          resource: resourceKey,
          plan_id: planId,
          limit,
          currentUsage,
          upgradeUrl,
        });
      }

      next();
    } catch (err) {
      console.error("Quota middleware error:", err);
      res
        .status(500)
        .json({ message: "Quota check failed", code: "quota_check_failed" });
    }
  };
};

module.exports = { enforceQuota };
