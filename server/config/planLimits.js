// Centralized per-plan limits for quota enforcement
// Use Number.MAX_SAFE_INTEGER to represent "unlimited"

module.exports = {
  // Basic (formerly "basic_pro")
  basic: {
    max_students: 500,
    max_rooms: Number.MAX_SAFE_INTEGER,
    max_wardens: 5,
    max_staff: 20,
    max_visitors: 300,
    max_complaints: 1000,
    max_hostels: 5,
  },
  // Pro/Enterprise (formerly "enterprise")
  pro: {
    max_students: Number.MAX_SAFE_INTEGER,
    max_rooms: Number.MAX_SAFE_INTEGER,
    max_wardens: Number.MAX_SAFE_INTEGER,
    max_staff: Number.MAX_SAFE_INTEGER,
    max_visitors: Number.MAX_SAFE_INTEGER,
    max_complaints: Number.MAX_SAFE_INTEGER,
    max_hostels: Number.MAX_SAFE_INTEGER,

  },
  // Trial plan (limited subset of basic)
  trial_basic: {
    max_students: 100,
    max_rooms: 50,
    max_wardens: 2,
    max_staff: 5,
    max_visitors: 50,
    max_complaints: 200,
    max_hostels: 1,
  },
  // default fallbacks (free plan)
  free: {
    max_students: 20,
    max_rooms: 10,
    max_wardens: 1,
    max_staff: 0,
    max_visitors: 0,
    max_complaints: 0,
    max_hostels: 1,
  },
};
