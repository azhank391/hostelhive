const { body } = require('express-validator');
const { handleValidationErrors } = require('./validationMiddleware');

// ✅ Validate visitor log creation/update
exports.validateVisitorLog = [
  body('visitorName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Visitor name must be between 2 and 50 characters'),
  body('relation')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Relation must be between 2 and 30 characters'),
  body('studentId')
    .optional()
    .isUUID()
    .withMessage('Valid student ID is required for admin creation'),
  body('checkIn')
    .optional()
    .isISO8601()
    .withMessage('Valid check-in date is required'),
  handleValidationErrors
];

// ✅ Validate visitor log update
exports.validateVisitorLogUpdate = [
  body('visitorName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Visitor name must be between 2 and 50 characters'),
  body('relation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Relation must be between 2 and 30 characters'),
  handleValidationErrors
];

// ✅ Validate visitor checkout
exports.validateVisitorCheckout = [
  body('checkOut')
    .optional()
    .isISO8601()
    .withMessage('Valid check-out date is required'),
  handleValidationErrors
];
