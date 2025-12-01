// src/pages/chat.jsx
import React, { useState, useEffect } from "react";
import NebulaLayout from "../../layouts/NebulaLayout";
import Sidebar from "../../components/chat/Sidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import RightDrawer from "../../components/chat/RightDrawer";
import { getSocket } from "../../socket";
import Cookies from "js-cookie";

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiReply, setAiReply] = useState("");

  const token = Cookies.get("token");
  const currentUser = Cookies.get("user") ? JSON.parse(Cookies.get("user")) : null;

  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center">
        Please login first.
      </div>
    );
  }

  // Register socket user
  useEffect(() => {
    const socket = getSocket();
    const userId = currentUser?._id || currentUser?.id;
    if (socket && userId) {
      socket.emit("register-user", userId);
    }
  }, [currentUser]);

  // Fetch user list
  useEffect(() => {
    fetch("http://localhost:5000/api/v1/users", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users);
      })
      .catch((err) => console.log("Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Online status
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (list) => setOnlineUsers(list);
    socket.on("online-users", handler);
    return () => socket.off("online-users", handler);
  }, []);

  // Receiving messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (payload) => {
  console.log("--- Received Payload ---", payload);
      const {
        fromUserId,
        message,
        originalAudioUrl,
        originalAudioBlob,
        translatedAudioUrl,
        translatedText,
        metadata,
      } = payload;

      setActiveChat((prev) => {
        if (!prev || prev.id !== fromUserId) return prev;

        const newMsg = {
          id: Date.now(),
          textOriginal: message || null,
          textTranslated: translatedText || null,
          audioOriginal: null,
          audioOriginalBlob: null,
          audioTranslated: translatedAudioUrl || null,
          fromMe: false,
          ts: "Now",
          metadata: metadata || {},
        };

        // Normalize originalAudioBlob to a real browser Blob and create objectURL
        if (originalAudioBlob) {
          try {
            let blob = null;

            // NEW LOGIC: Prioritize checking for the confirmed { data: [...] } structure
            if (
              typeof originalAudioBlob === "object" &&
              originalAudioBlob.data &&
              Array.isArray(originalAudioBlob.data)
            ) {
              console.log("--- FOUND: Array Buffer Data Structure ---");
              const u8 = new Uint8Array(originalAudioBlob.data);
              blob = new Blob([u8.buffer], { type: "audio/webm" });
            } else if (originalAudioBlob instanceof Blob) {
              blob = originalAudioBlob;
            } else if (originalAudioBlob instanceof ArrayBuffer) {
              blob = new Blob([originalAudioBlob], { type: "audio/webm" });
            } else if (originalAudioBlob._isBuffer && originalAudioBlob.data) {
              // Fallback for Node.js Buffer structure
              const u8 = new Uint8Array(originalAudioBlob.data);
              blob = new Blob([u8.buffer], { type: "audio/webm" });
            } else if (typeof originalAudioBlob === "object" && originalAudioBlob.byteLength) {
              blob = new Blob([originalAudioBlob], { type: "audio/webm" });
            } else if (Array.isArray(originalAudioBlob)) {
              // Check for raw array of bytes
              const u8 = new Uint8Array(originalAudioBlob);
              blob = new Blob([u8.buffer], { type: "audio/webm" });
            } else {
              // FINAL FALLBACK
              try {
                const arr = originalAudioBlob.data || originalAudioBlob;
                const u8 = new Uint8Array(arr);
                blob = new Blob([u8.buffer], { type: "audio/webm" });
              } catch (e) {
                console.warn("Unable to normalize originalAudioBlob", e);
              }
            }

            if (blob) {
              console.log("--- Successfully created Blob on receiver ---", blob);
              const url = URL.createObjectURL(blob);
              newMsg.audioOriginal = url;
              newMsg.audioOriginalBlob = blob;
            }
          } catch (err) {
            console.warn("Failed to create object URL for originalAudioBlob", err);
          }
        } else if (originalAudioUrl) {
          newMsg.audioOriginal = originalAudioUrl;
        }

        return {
          ...prev,
          messages: [...prev.messages, newMsg],
        };
      });
    };

    socket.on("private-message", handler);
    return () => socket.off("private-message", handler);
  }, [activeChat]);

  const handleSelectChat = (user) => {
    setActiveChat({
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      messages: [],
    });
    setAiReply("");
  };

  // ---------- SEND MESSAGE (UNCHANGED) ----------
  const sendMessage = async (msgOrBlob, targetLang) => {
    if (!activeChat) return;
    const socket = getSocket();
    const currentUserId = currentUser?._id || currentUser?.id;

    setAiProcessing(true);

    const isAudio = msgOrBlob instanceof Blob;

    // ------------------- NEW: AI Command Check and Exit -------------------
    // If message addressed to @ash and is not audio, handle AI locally and return
    if (!isAudio && typeof msgOrBlob === 'string' && msgOrBlob.startsWith("@ash")) {
      const purePrompt = msgOrBlob.replace("@ash", "").trim();
      try {
        setAiReply("Thinking...");
        const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "my-chat",
            prompt: purePrompt,
            stream: false,
          }),
        });
        const data = await response.json();
        setAiReply(data.response);
      } catch (err) {
        setAiReply("⚠️ Could not reach local AI engine.");
      }

      setAiProcessing(false);
      // STOP EXECUTION: This message is a local command, so we don't display it or send it via socket.
      return; 
    }
    // ------------------- END NEW -------------------

    let finalMessagePayload = isAudio ? "(Voice Message)" : msgOrBlob;
    let originalAudioUrl = null;

    // AUDIO: create local URL for sender playback only
    if (isAudio) {
      originalAudioUrl = URL.createObjectURL(msgOrBlob);
    }

    // TEXT: send raw message as original (no translation on sender)
    if (!isAudio) {
      finalMessagePayload = msgOrBlob;
    }

    // Local UI for sender: only original (no translated content)
    setActiveChat((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: Date.now(),
          textOriginal: isAudio ? null : (msgOrBlob || null),
          textTranslated: null,
          audioOriginal: isAudio ? originalAudioUrl : null,
          audioOriginalBlob: null,
          audioTranslated: null,
          fromMe: true,
          ts: "Now",
          metadata: {},
        },
      ],
    }));

    // Emit socket: include the actual Blob so backend can forward binary to recipient
    const payload = {
      toUserId: activeChat.id,
      fromUserId: currentUserId,
      message: isAudio ? "(Voice Message)" : (msgOrBlob || finalMessagePayload),
      originalAudioUrl: isAudio ? originalAudioUrl : null,
      originalAudioBlob: isAudio ? msgOrBlob : null,
      translatedAudioUrl: null,
      translatedText: null,
      metadata: {}, // do NOT include sender's targetLang
    };

    socket.emit("private-message", payload);

    setAiProcessing(false);
  };
  // ---------- END SEND MESSAGE (UNCHANGED) ----------

  if (loading)
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-brand-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );

  return (
    <NebulaLayout>
      <Sidebar
        chats={users}
        activeChatId={activeChat?.id}
        onSelectChat={handleSelectChat}
        onlineUsers={onlineUsers}
      />

      <ChatWindow
        chat={activeChat}
        onSend={sendMessage}
        aiProcessing={aiProcessing}
        currentUser={currentUser}
      />

      <RightDrawer visible={!!activeChat} chat={activeChat} aiReply={aiReply} />
    </NebulaLayout>
  );
}