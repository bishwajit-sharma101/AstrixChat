// backend/socket.js
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

    // PRIVATE MESSAGE
    socket.on("private-message", (payload) => {
      const {
        toUserId,
        fromUserId,
        message,
        originalAudioUrl,
        originalAudioBlob, // ← NOW CAPTURED
        translatedAudioUrl,
        translatedText,
        metadata = {},
      } = payload;

      const targetSocketId = onlineUsers.get(toUserId);

      console.log(`📨 Message from ${fromUserId} to ${toUserId}`, {
        message,
        originalAudioUrl,
        originalAudioBlob, // ← NOW LOGGED
        translatedAudioUrl,
        translatedText,
        targetSocketId,
      });

      if (targetSocketId) {
        io.to(targetSocketId).emit("private-message", {
          fromUserId,
          message,
          originalAudioUrl,
          originalAudioBlob, // ← NOW FORWARDED
          translatedAudioUrl,
          translatedText,
          metadata,
        });
        console.log("✅ Message forwarded to socket:", targetSocketId);
      } else {
        console.log("⚠️ Receiver is OFFLINE or ID mismatch. Message dropped.");
        socket.emit("message-failed", { error: "User is offline" });
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