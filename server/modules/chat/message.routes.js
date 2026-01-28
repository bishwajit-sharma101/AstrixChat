const express = require("express");
const router = express.Router();
const { protect } = require("../../modules/auth/auth.middleware"); // CHANGED: Import

const { saveMessage, getChatHistory, cacheTranslation,deleteMessage,clearChat,markMessagesAsRead } = require("./message.controller");

// CHANGED: Added 'protect' middleware to all routes
router.post("/save", protect, saveMessage);
router.get("/history/:userId", protect, getChatHistory);
router.post("/cache_translation", protect, cacheTranslation);

router.delete("/:messageId", protect, deleteMessage);
router.post("/clear", protect, clearChat);
router.post("/read", protect, markMessagesAsRead);

module.exports = router;