const { body, param, query, validationResult } = require('express-validator');

// ✅ Validation Result Handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// ✅ User Registration Validation
exports.validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['owner', 'warden', 'student'])
    .withMessage('Valid role is required'),
  body('hostelId')
    .isUUID()
    .withMessage('Valid hostel ID is required'),
  handleValidationErrors
];

// ✅ User Login Validation
exports.validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// ✅ Room Creation Validation
exports.validateRoomCreation = [
  body('roomNumber')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Room number must be between 1 and 20 characters'),
  body('capacity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Capacity must be between 1 and 10'),
  body('block')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Block must be less than 20 characters'),
  handleValidationErrors
];

// ✅ Student Creation Validation
exports.validateStudentCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// ✅ Complaint Creation Validation
exports.validateComplaintCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  handleValidationErrors
];

// ✅ Hostel Registration Validation
// Creation path now auto-generates subdomain and defaults plan to 'free'
exports.validateHostelRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hostel name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country must be less than 50 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  handleValidationErrors
];

// ✅ UUID Parameter Validation
exports.validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Valid UUID is required'),
  handleValidationErrors
];

// ✅ Pagination Query Validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// (Removed) Plan update validation – plan changes are managed by Stripe billing and webhooks.

// ✅ Status Update Validation
exports.validateStatusUpdate = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors
];

// ✅ Billing Status Update Validation
exports.validateBillingUpdate = [
  body('isPaid')
    .isBoolean()
    .withMessage('isPaid must be a boolean'),
  handleValidationErrors
];

// ✅ Room Allocation Validation
exports.validateRoomAllocation = [
  body('studentId')
    .isUUID()
    .withMessage('Valid student ID is required'),
  body('roomId')
    .isUUID()
    .withMessage('Valid room ID is required'),
  handleValidationErrors
];

// ✅ Visitor Log Validation
exports.validateVisitorLog = [
  body('visitorName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Visitor name must be between 2 and 50 characters'),
  body('relation')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Relation must be between 2 and 30 characters'),
  handleValidationErrors
]; 