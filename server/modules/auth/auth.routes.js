const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('./auth.controller');

/**
 * @desc Authentication Routes for User Registration and Login
 * @route /api/v1/auth
 */

// POST /api/v1/auth/register
router.post('/register', registerUser);

// POST /api/v1/auth/login
router.post('/login', loginUser);

// GET /api/v1/auth/logout
router.get('/logout', logoutUser);

module.exports = router;