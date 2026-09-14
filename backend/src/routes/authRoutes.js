const express = require('express');
const { register, login } = require('../controllers/authController');
const { registerRules, loginRules, validate } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);

module.exports = router;
