const { body, validationResult } = require('express-validator');

/**
 * Common validation middleware to check for express-validator errors.
 * Returns 400 with detailed error messages if validation fails.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors into a readable string or object
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

/**
 * Auth Validation Rules
 */
const signupValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone().withMessage('Must be a valid phone number'),
  body('country')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 2 }).withMessage('Country must be a 2-letter ISO code (e.g. IN)'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

/**
 * Deed Validation Rules
 */
const createDeedValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Deed title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional({ checkFalsy: true })
    .isString().withMessage('Description must be text')
    .isLength({ max: 2000 }).withMessage('Description too long (max 2000 chars)'),
  body('acceptanceCriteria')
    .optional({ checkFalsy: true })
    .isString().withMessage('Acceptance criteria must be text'),
  // We explicitly DO NOT duplicate strict amount validation here because 
  // validateAmount() handles integer bounds, minimums, and rounding deep in the service layer.
  body('amount')
    .notEmpty().withMessage('Amount is required'),
  body('currency')
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('deadline')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Deadline must be a valid date'),
  body('revisionLimit')
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 10 }).withMessage('Revision limit must be between 0 and 10'),
  body('isMilestone')
    .optional()
    .isBoolean().withMessage('isMilestone must be a boolean')
];

/**
 * Review Validation Rules
 */
const createReviewValidation = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters')
];

module.exports = {
  validateRequest,
  signupValidation,
  loginValidation,
  createDeedValidation,
  createReviewValidation
};
