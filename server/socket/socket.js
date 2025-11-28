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
 // PRIVATE MESSAGE
socket.on("private-message", ({ toUserId, fromUserId, message }) => {
  const targetSocketId = onlineUsers.get(toUserId);

  // DEBUG LOGS (Remove later)
  console.log(`📨 Message from ${fromUserId} to ${toUserId}`);
  console.log(`🔍 Lookup result for ${toUserId}:`, targetSocketId);

  if (targetSocketId) {
    io.to(targetSocketId).emit("private-message", {
      fromUserId,
      message,
    });
    console.log("✅ Message sent to socket:", targetSocketId);
  } else {
    // THIS IS THE MISSING PIECE
    console.log("⚠️ Receiver is OFFLINE or ID mismatch. Message dropped.");
    
    // Optional: Emit an event back to sender saying "User Offline"
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
