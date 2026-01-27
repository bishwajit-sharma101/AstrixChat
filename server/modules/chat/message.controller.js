const asyncHandler = require("express-async-handler");
const Message = require("./models/message.model");

const saveMessage = asyncHandler(async (req, res) => {
  const { from, to, message } = req.body;

  if (!from || !to || !message) {
    return res.status(400).json({
      success: false,
      message: "from, to and message fields are required"
    });
  }

  // UPDATED: Saving to content.original
  const saved = await Message.create({ 
    from, 
    to, 
    content: { 
      original: message 
    } 
  });

  res.status(201).json({
    success: true,
    message: "Message saved successfully",
    data: saved
  });
});

const getChatHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { myId } = req.query;

  console.log("--- DEBUG: Fetching Chat History ---");
  console.log("Target User (params):", userId);
  console.log("My ID (query):", myId);

  // 1. Validation Log
  if (!userId || !myId) {
    console.log("❌ Error: Missing IDs");
    return res.status(400).json({ success: false, message: "IDs missing" });
  }

  try {
    // 2. Query Log
    console.log("🔍 Querying Database...");
    const messages = await Message.find({
      $or: [
        { from: myId, to: userId },
        { from: userId, to: myId }
      ]
    }).sort({ createdAt: 1 });

    console.log(`✅ Found ${messages.length} messages`);

    res.json({
      success: true,
      messages
    });
  } catch (dbError) {
    // 3. Catch specific DB error
    console.error("❌ Database Error Detail:", dbError.message);
    res.status(500).json({ 
      success: false, 
      error: dbError.message 
    });
  }
});

module.exports = { saveMessage, getChatHistory };