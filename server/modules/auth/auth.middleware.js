const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../user-management/models/user.model');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Check Authorization Header (Standard Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }
    // 2. Check Cookies (Since your controller sets cookies)
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }

    try {
        const secret = process.env.JWT_SECRET || "astrix_secret_key_fallback_123";
        const decoded = jwt.verify(token, secret);

        // Attach user to request, exclude password
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            res.status(401);
            throw new Error('User not found');
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(401);
        throw new Error('Not authorized, token failed');
    }
});

module.exports = { protect };