const express = require("express");
const router = express.Router();
const User = require("../../../modules/user-management/models/user.model");

// GET ALL USERS (Except the logged-in user)
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "_id name email avatar");

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
