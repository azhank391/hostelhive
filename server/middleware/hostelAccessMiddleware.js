const { Hostel, User, TenantLocation } = require('../models');

/**
 * Middleware to validate user has access to hostel in URL
 * Usage: router.get('/:hostelId/visitors', authMiddleware, validateHostelAccess, getVisitors)
 */
const validateHostelAccess = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('🔐 Validating hostel access:', { hostelId, userId, userRole });

    if (!hostelId) {
      return res.status(400).json({ 
        success: false,
        message: 'Hostel ID is required' 
      });
    }

    // Super admin has access to all hostels
    if (userRole === 'superadmin') {
      const hostel = await Hostel.findByPk(hostelId, {
        include: [{ model: TenantLocation, as: 'location' }]
      });
      
      if (!hostel) {
        return res.status(404).json({ 
          success: false,
          message: 'Hostel not found' 
        });
      }

      req.hostel = hostel;
      req.hostelId = hostelId;
      return next();
    }

    // Check if user has access to this hostel
    const hasAccess = await checkUserHostelAccess(userId, hostelId, userRole);
    
    if (!hasAccess.allowed) {
      return res.status(403).json({ 
        success: false,
        message: hasAccess.message || 'Access denied to this hostel' 
      });
    }

    // Store hostel data in request for use in controllers
    req.hostel = hasAccess.hostel;
    req.hostelId = hostelId;
    next();
  } catch (error) {
    console.error('❌ Error in validateHostelAccess:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error during hostel access validation' 
    });
  }
};

/**
 * Check if user has access to specific hostel
 */
const checkUserHostelAccess = async (userId, hostelId, userRole) => {
  try {
    const hostel = await Hostel.findByPk(hostelId, {
      include: [{ model: TenantLocation, as: 'location' }]
    });

    if (!hostel) {
      return { 
        allowed: false, 
        message: 'Hostel not found' 
      };
    }

    switch (userRole) {
      case 'owner':
        // Owner can only access hostels they own
        if (hostel.ownerId !== userId) {
          return { 
            allowed: false, 
            message: 'You can only access hostels you own' 
          };
        }
        break;

      case 'warden':
      case 'student':
        // Warden/Student can only access their assigned hostel
        const user = await User.findByPk(userId);
        if (!user || user.hostelId !== hostelId) {
          return { 
            allowed: false, 
            message: 'You can only access your assigned hostel' 
          };
        }
        break;

      default:
        // Handle custom roles - they can access their assigned hostel
        const customUser = await User.findByPk(userId);
        if (!customUser || customUser.hostelId !== hostelId) {
          return { 
            allowed: false, 
            message: 'You can only access your assigned hostel' 
          };
        }
        break;
    }

    return { 
      allowed: true, 
      hostel 
    };
  } catch (error) {
    console.error('❌ Error in checkUserHostelAccess:', error);
    return { 
      allowed: false, 
      message: 'Error validating hostel access' 
    };
  }
};

/**
 * Get all hostels user has access to
 */
const getUserAccessibleHostels = async (userId, userRole) => {
  try {
    let hostels = [];

    switch (userRole) {
      case 'owner':
        hostels = await Hostel.findAll({
          where: { ownerId: userId },
          include: [{ model: TenantLocation, as: 'location' }],
          order: [['createdAt', 'DESC']]
        });
        break;

      case 'warden':
      case 'student':
        const user = await User.findByPk(userId);
        if (user && user.hostelId) {
          const hostel = await Hostel.findByPk(user.hostelId, {
            include: [{ model: TenantLocation, as: 'location' }]
          });
          if (hostel) hostels = [hostel];
        }
        break;

      case 'superadmin':
        hostels = await Hostel.findAll({
          include: [{ model: TenantLocation, as: 'location' }],
          order: [['createdAt', 'DESC']]
        });
        break;

      default:
        // Handle custom roles - they can access their assigned hostel
        const customUser = await User.findByPk(userId);
        if (customUser && customUser.hostelId) {
          const hostel = await Hostel.findByPk(customUser.hostelId, {
            include: [{ model: TenantLocation, as: 'location' }]
          });
          if (hostel) hostels = [hostel];
        }
        break;
    }

    return hostels;
  } catch (error) {
    console.error('❌ Error in getUserAccessibleHostels:', error);
    return [];
  }
};

/**
 * Middleware to require specific roles for hostel operations
 */
const requireHostelRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
};

/**
 * Middleware to require owner access to hostel
 */
const requireHostelOwner = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'superadmin') {
      return next(); // Superadmin bypasses owner check
    }

    if (userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Owner access required'
      });
    }

    const hostel = await Hostel.findByPk(hostelId);
    if (!hostel || hostel.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify hostels you own'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error in requireHostelOwner:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error during owner validation' 
    });
  }
};

module.exports = {
  validateHostelAccess,
  checkUserHostelAccess,
  getUserAccessibleHostels,
  requireHostelRole,
  requireHostelOwner
};




