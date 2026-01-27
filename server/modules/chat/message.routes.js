const express = require("express");
const router = express.Router();

const { saveMessage, getChatHistory } = require("./message.controller");

router.post("/save", saveMessage);
router.get("/history/:userId", getChatHistory);

module.exports = router;
