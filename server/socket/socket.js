const Message = require("../modules/chat/models/message.model.js");
const { Server } = require("socket.io");

const onlineUsers = new Map();

module.exports = function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    }
  });

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // USER REGISTRATION
    socket.on("register-user", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`🟢 User ${userId} online`);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    // PRIVATE MESSAGE - FIXED FOR DUAL COMPATIBILITY
    socket.on("private-message", async (payload) => {
      try {
        const { fromUserId, toUserId, message } = payload;

        // 1. Save to Database using the new "Neural Cache" schema
        const savedMessage = await Message.create({
          from: fromUserId,
          to: toUserId,
          content: {
            original: message,
            translations: {} // Initialize empty Map for future translations
          }
        });

        // 2. Create the Dual Payload
        // We include 'message' for the UI and 'content' for the translation logic
        const enrichedPayload = {
          ...payload,
          _id: savedMessage._id,
          createdAt: savedMessage.createdAt,
          message: message,             // Fixes the "nothing showing up" issue for receiver
          content: savedMessage.content // Allows MessageList to access the translations Map
        };

        // 3. Route to Receiver
        const targetSocketId = onlineUsers.get(toUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("private-message", enrichedPayload);
        }
        
        // 4. Send back to Sender (to sync the local state with DB _id)
        socket.emit("private-message", enrichedPayload);

      } catch (err) {
        console.error("❌ Message save error:", err);
        socket.emit("message-failed", { error: "Message validation failed on server" });
      }
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);

      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🔴 User ${userId} offline`);
          break;
        }
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });
};