const express = require("express");
const router = express.Router();
const { getAllUsers, blockUser, unblockUser, deleteAccount, updateProfile } = require("./users.controller");
const { protect } = require("../../../modules/auth/auth.middleware");

// Protect ensures 'req.user' exists so we can hide 'myself' from the list
router.get("/", protect, getAllUsers);
router.post("/block", protect, blockUser);
router.post("/unblock", protect, unblockUser);
router.delete("/delete", protect, deleteAccount);
router.put("/profile", protect, updateProfile);

module.exports = router;