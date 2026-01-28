const asyncHandler = require("express-async-handler");
const User = require("../../../modules/user-management/models/user.model");
const Message = require("../../../modules/chat/models/message.model"); // Needed for account deletion cleanup

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  let keyword = {};
  if (req.query.search) {
    const cleanSearch = escapeRegex(String(req.query.search)); 
    keyword = {
      $or: [
        { name: { $regex: cleanSearch, $options: "i" } },
        { email: { $regex: cleanSearch, $options: "i" } },
      ],
    };
  }

  const users = await User.find({ ...keyword, _id: { $ne: req.user._id } })
    .select("name email avatar isOnline lastSeen") 
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const count = await User.countDocuments({ ...keyword, _id: { $ne: req.user._id } });

  res.json({
    success: true,
    users,
    page,
    pages: Math.ceil(count / limit),
    totalUsers: count
  });
});

// NEW: Block User
const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.blockedUsers.includes(userId)) {
        user.blockedUsers.push(userId);
        await user.save();
    }
    res.json({ success: true, message: "User blocked" });
});

// NEW: Unblock User
const unblockUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
    await user.save();
    res.json({ success: true, message: "User unblocked" });
});

// NEW: Delete Account (Cascade)
const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // 1. Delete all messages sent by or received by this user
    await Message.deleteMany({
        $or: [{ from: user._id }, { to: user._id }]
    });

    // 2. Delete user
    await user.deleteOne();

    res.json({ success: true, message: "Account deleted permanently" });
});

module.exports = { getAllUsers, blockUser, unblockUser, deleteAccount };