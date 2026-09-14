const { body, validationResult } = require('express-validator');

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers, and underscores'),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('displayName')
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage('Display name is required (max 60 characters)'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const postRules = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Post must be 1-500 characters'),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      details: errors.array(),
    });
  }
  next();
}

module.exports = { registerRules, loginRules, postRules, validate };
