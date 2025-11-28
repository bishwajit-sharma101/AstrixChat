// 1. Core Imports
const asyncHandler = require('express-async-handler');
const debug = require('debug')('app:auth:controller');
const UserDto = require('../../shared/dtos/UserDto');

// 2. Service Import (Business Logic)
const authService = require('./auth.service');

// --- CONTROLLER FUNCTIONS ---

/**
 * @desc Register a new user
 * @route POST /api/v1/auth/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
    debug('Received registration request.');
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please include a name, email, and password.');
    }

    const { user, token } = await authService.register({ name, email, password });

    // COOKIE #1 — JWT Token
    res.cookie('token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, 
        sameSite: "lax"
    });

    // COOKIE #2 — User Info (frontend expects this)
    res.cookie('user', JSON.stringify(new UserDto(user)), {
        httpOnly: false,   // must be readable by frontend
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.status(201).json({
        success: true,
        user: new UserDto(user),
        message: 'Registration successful. User authenticated.',
    });
});

/**
 * @desc Authenticate a user and get token
 * @route POST /api/v1/auth/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
    debug('Received login request.');
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide both email and password.');
    }

    const { user, token } = await authService.login(email, password);

    // COOKIE #1 — JWT Token
    res.cookie('token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: "lax"
    });

    // COOKIE #2 — User Info
    res.cookie('user', JSON.stringify(new UserDto(user)), {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.status(200).json({
        success: true,
        user: new UserDto(user),
        message: 'Login successful. User authenticated.',
    });
});

/**
 * @desc Log out user / Clear cookie
 * @route GET /api/v1/auth/logout
 */
const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    });

    res.cookie('user', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: false,
        secure: false,
    });

    res.status(200).json({ success: true, message: 'User successfully logged out.' });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
};
