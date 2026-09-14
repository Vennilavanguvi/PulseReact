const express = require('express');
const { getFeed, createPost, toggleLike } = require('../controllers/postController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { postRules, validate } = require('../utils/validators');

const router = express.Router();

router.get('/', optionalAuth, getFeed);
router.post('/', requireAuth, postRules, validate, createPost);
router.post('/:id/like', requireAuth, toggleLike);

module.exports = router;
