const express = require('express');
const router = express.Router();

const authRoutes = require('../../modules/auth/auth.routes');
const chatRoutes = require('../../modules/chat/message.routes'); // Corrected path assumption based on context
const aiRoutes = require('./ai/ai.routes');
const userRoutes = require('./users/users.routes');
const reportRoutes = require('./report/report.routes'); // NEW

router.use('/auth', authRoutes);
router.use('/messages', chatRoutes); // Or however you mounted chat
router.use('/ai', aiRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes); // NEW

module.exports = router;