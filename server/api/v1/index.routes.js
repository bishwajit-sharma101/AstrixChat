const express = require('express');
const router = express.Router();

// Stub imports for all required route files
const authRoutes = require('../../modules/auth/auth.routes');
const chatRoutes = require('./chat.routes');
const aiRoutes = require('./ai.routes');

// Mount the routes
router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/ai', aiRoutes);
router.use("/users", require("./users/users.routes"));

module.exports = router;