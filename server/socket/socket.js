const Message = require("../modules/chat/models/message.model.js");
const User = require("../modules/user-management/models/user.model.js");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const mongoose = require("mongoose");

const onlineUsers = new Map();
const messageRateLimits = new Map(); 

// HELPER: Background Translation Worker
// Triggers only if recipient is offline to ensure "Premium" feel on login
const backgroundTranslate = async (messageId, text, targetLang) => {
    try {
        if (!targetLang || targetLang === 'en') return; // Skip if english or unknown

        // Call Local AI Service (or Gemini)
        const response = await fetch("http://127.0.0.1:7861/translate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: text,
                target_lang: targetLang
            })
        });

        const data = await response.json();
        const translatedText = data.translation || data.translation_text;

        if (translatedText) {
            await Message.findByIdAndUpdate(messageId, {
                $set: { [`content.translations.${targetLang}`]: translatedText }
            });
            console.log(`🌙 Offline Translation cached for msg ${messageId} [${targetLang}]`);
        }
    } catch (err) {
        console.error("Background translation failed:", err.message);
    }
};

module.exports = function initSocket(server) {
  const io = new Server(server, {
    // ⚡ FIX 2: Socket Reliability (Heartbeats)
    // Detects disconnects in 5 seconds instead of minutes
    pingTimeout: 5000,
    pingInterval: 10000, 
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    }
  });

  io.use((socket, next) => {
    try {
      let token = null;
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }
      if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.token;
      }

      if (!token) return next(new Error("Authentication error: No token provided"));

      const secret = (process.env.JWT_SECRET || "").trim();
      if (!secret) {
          console.error("❌ CRITICAL: JWT_SECRET not found in environment!");
          return next(new Error("Internal server configuration error"));
      }
      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.id; 
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.userId);

    onlineUsers.set(socket.userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));

    socket.on("register-user", (userId) => {
        if (userId !== socket.userId) return;
        onlineUsers.set(userId, socket.id);
        io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("private-message", async (payload) => {
      try {
        const userId = socket.userId;
        const { toUserId, message } = payload;

        if (!toUserId || !mongoose.Types.ObjectId.isValid(toUserId)) {
            return socket.emit("message-failed", { error: "Invalid Recipient ID" });
        }
        if (userId === toUserId) return;

        // Rate Limiter
        const now = Date.now();
        let record = messageRateLimits.get(userId);
        if (!record || now - record.lastReset > 1000) {
          record = { count: 0, lastReset: now };
          messageRateLimits.set(userId, record);
        }
        if (record.count >= 5) {
          socket.emit("message-failed", { error: "You are sending messages too fast." });
          return; 
        }
        record.count++;

        // Blocking & Recipient Data Check
        const recipient = await User.findById(toUserId).select("blockedUsers preferredLanguage");
        
        if (recipient && recipient.blockedUsers.includes(userId)) {
            socket.emit("message-failed", { error: "You cannot message this user." });
            return; 
        }

        // Save Message
        const savedMessage = await Message.create({
          from: userId,
          to: toUserId,
          content: { original: message, translations: {} }
        });

        // ⚡ FIX 1: Offline Translation Logic
        // If recipient is NOT online, trigger background translation
        const isRecipientOnline = onlineUsers.has(toUserId);
        if (!isRecipientOnline && recipient) {
            // Fire and forget (don't await) to keep socket fast
            backgroundTranslate(savedMessage._id, message, recipient.preferredLanguage);
        }

        const enrichedPayload = {
          ...payload,
          _id: savedMessage._id,
          createdAt: savedMessage.createdAt,
          fromUserId: userId, 
          message: message,             
          content: savedMessage.content,
          isRead: false
        };

        const targetSocketId = onlineUsers.get(toUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("private-message", enrichedPayload);
        }
        
        socket.emit("private-message", enrichedPayload);

      } catch (err) {
        console.error("❌ Message save error:", err);
        socket.emit("message-failed", { error: "Message failed" });
      }
    });

    socket.on("delete-message", async ({ messageId, toUserId }) => {
        try {
            if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) return;

            // ⚡ FIX: Verify ownership before emitting deletion signal
            const message = await Message.findById(messageId);
            if (!message || message.from.toString() !== socket.userId) {
                return; // Silently fail to avoid leaking info
            }

            if (toUserId && mongoose.Types.ObjectId.isValid(toUserId)) {
                const targetSocketId = onlineUsers.get(toUserId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit("message-deleted", { messageId });
                }
            }
        } catch (e) {
            console.error("Delete socket error", e);
        }
    });

    socket.on("mark-read", async ({ senderId }) => {
        try {
            if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) return;
            await Message.updateMany(
                { from: senderId, to: socket.userId, isRead: false },
                { $set: { isRead: true } }
            );
            const senderSocket = onlineUsers.get(senderId);
            if (senderSocket) {
                io.to(senderSocket).emit("messages-read", { byUserId: socket.userId });
            }
        } catch (e) {
            console.error("Read receipt error", e);
        }
    });

    socket.on("disconnect", async () => {
      console.log("🔴 Socket disconnected:", socket.id);
      if (socket.userId) {
          onlineUsers.delete(socket.userId);
          messageRateLimits.delete(socket.userId);
          await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
      }
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });
};