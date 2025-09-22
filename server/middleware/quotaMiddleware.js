const { Hostel, User, Room, VisitorLog, Complaint } = require('../models');
const planLimits = require('../config/planLimits');

// Map resource keys to models and count predicates
const resourceConfig = {
  students: {
    limitKey: 'max_students',
    count: async (hostelId) => {
      return User.count({ where: { hostelId, role: 'student' } });
    },
  },
  rooms: {
    limitKey: 'max_rooms',
    count: async (hostelId) => {
      return Room.count({ where: { hostelId } });
    },
  },
  wardens: {
    limitKey: 'max_wardens',
    count: async (hostelId) => {
      return User.count({ where: { hostelId, role: 'warden' } });
    },
  },
  visitors: {
    limitKey: 'max_visitors',
    count: async (hostelId) => {
      return VisitorLog.count({ where: { hostelId } });
    },
  },
  complaints: {
    limitKey: 'max_complaints',
    count: async (hostelId) => {
      return Complaint.count({ where: { hostelId } });
    },
  },
  hostels: {
    limitKey: 'max_hostels',
    count: async (hostelId, req) => {
      // For hostels quota, count hostels owned by the current user
      if (!req?.user?.id) return 0;
      return Hostel.count({ where: { ownerId: req.user.id } });
    },
  },

  staff: {
    limitKey: 'max_staff',
    count: async (hostelId) => {
      // Count users with an explicit 'staff' role if such a role exists in your system
      return User.count({ where: { hostelId, role: 'staff' } });
    },
  },
};

// Factory to create a quota check middleware for a given resource key
const enforceQuota = (resourceKey) => {
  return async (req, res, next) => {
    try {
      // Allow superadmin to bypass
      if (req.user && req.user.role === 'superadmin') {
        return next();
      }

      const isOwnerHostelQuota = resourceKey === 'hostels';
  let hostelId = req.params.hostelId || req.hostelId || req.user?.hostelId;
      let hostel = null;
      let planId;
      if (!isOwnerHostelQuota) {
        if (!hostelId) {
          return res.status(403).json({ message: 'Hostel context missing', code: 'hostel_context_missing' });
        }
        hostel = await Hostel.findByPk(hostelId);
        if (!hostel) {
          return res.status(404).json({ message: 'Hostel not found' });
        }
        // If subscription is active, use the subscribed plan; otherwise enforce Free during trials or no subscription
        if (hostel.subscription_status === 'active' && hostel.plan_id) {
          planId = hostel.plan_id;
        } else if (hostel.subscription_status === 'trialing') {
          // Enforce trial limits
          planId = 'trial_basic';
        } else {
          planId = 'free';
        }
      } else {
        // For hostels quota (per-owner), default to free for owners without a hostel subscription
        planId = 'free';
      }
      // Map legacy values if any
      if (planId === 'basic_pro') planId = 'basic';
      if (planId === 'enterprise') planId = 'pro';
      const plan = planLimits[planId] || planLimits.free;

      const cfg = resourceConfig[resourceKey];
      if (!cfg) return next();

  const currentUsage = await cfg.count(hostelId, req);
      const limit = plan[cfg.limitKey] ?? Number.MAX_SAFE_INTEGER;

      if (currentUsage >= limit) {
        return res.status(402).json({
          message: `Quota exceeded for ${resourceKey}`,
          code: 'quota_exceeded',
          paywall: true,
          resource: resourceKey,
          plan_id: planId,
          limit,
          currentUsage,
          upgradeUrl: `/dashboard/hostels/${hostelId}/billing?plan=pro`,
        });
      }

      next();
    } catch (err) {
      console.error('Quota middleware error:', err);
      res.status(500).json({ message: 'Quota check failed', code: 'quota_check_failed' });
    }
  };
};

module.exports = { enforceQuota };
