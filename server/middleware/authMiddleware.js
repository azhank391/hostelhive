const jwt = require('jsonwebtoken');

// ✅ Verify JWT Token with configurable expiry
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 DEBUG: AuthMiddleware - Decoded token:', decoded);
    req.user = decoded; // { id, role, hostelId, ... }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// ✅ Basic Authentication Middleware (requires any valid user)
exports.requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// ✅ Role-based Authorization Middleware
exports.requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied: Authorized Access Only' });
    }
    next();
  };
};

// ✅ Multiple Role Authorization Middleware
exports.requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

// ✅ Owner or Warden Authorization Middleware
exports.requireOwnerOrWarden = (req, res, next) => {
  if (!req.user || !['owner', 'warden'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: Owner or Warden access required' });
  }
  next();
};

// ✅ Owner Only Authorization Middleware
exports.requireOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied: Owner access required' });
  }
  next();
};