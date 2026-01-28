const express = require('express');
const router = express.Router();
const { protect } = require("../../modules/auth/auth.middleware"); // Secure it
const { limiter } = require("../../middlewares/rateLimit.middleware");
const { checkQuota } = require("../../modules/auth/quota.middleware");

const geminiRoutes = require("./ai/gemini.routes");
const localRoutes = require("./ai/local_translation.routes");

router.use("/translate_text", protect, limiter,checkQuota, geminiRoutes);
router.use("/translate_text", protect, limiter,checkQuota, localRoutes);

router.use("/upload_audio", protect, limiter, (req, res, next) => {
    // ... upload logic ...
    next();
});

module.exports = router;