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
    return <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center">Please login first.</div>;
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
    fetch("http://localhost:5000/api/v1/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users);
      })
      .finally(() => setLoading(false))
      .catch((err) => console.log("Fetch error:", err));
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

    const handler = ({ fromUserId, message, audioUrl, translatedText }) => {
      setActiveChat((prev) => {
        if (!prev || prev.id !== fromUserId) return prev;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: Date.now(),
              text: translatedText || message,
              audioUrl: audioUrl || null,
              fromMe: false,
              ts: "Now",
            },
          ],
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

  // ---------- SEND MESSAGE ----------
  const sendMessage = async (msgOrBlob, targetLang = "English") => {
    if (!activeChat) return;

    const socket = getSocket();
    const currentUserId = currentUser?._id || currentUser?.id;

    setAiProcessing(true);

    const isAudio = msgOrBlob instanceof Blob;
    let finalMessagePayload = isAudio ? "(Voice Message)" : msgOrBlob;
    let finalAudioUrl = null;

    const langMap = { "English": "en", "Hindi": "hi", "Spanish": "es", "French": "fr", "German": "de", "Japanese": "ja", "Chinese": "zh" };
    const codeLang = langMap[targetLang] || "en";

    if (isAudio) {
      // 🔥 Audio -> /translate_voice
      try {
        const formData = new FormData();
        formData.append("audio", msgOrBlob, "input.webm");
        formData.append("target_lang", codeLang);

        const response = await fetch("http://127.0.0.1:7861/translate_voice", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Translation API failed");
        const data = await response.json();

        finalMessagePayload = data.translation;
        finalAudioUrl = `http://127.0.0.1:7861/file/${data.audio_file}`;
      } catch (error) {
        console.error("Audio Processing Error:", error);
        finalMessagePayload = "(Audio Translation Failed - Raw Audio)";
        finalAudioUrl = URL.createObjectURL(msgOrBlob);
      }
    }

    // 1️⃣ Update local chat
    setActiveChat((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: Date.now(),
          text: finalMessagePayload,
          audioUrl: finalAudioUrl,
          fromMe: true,
          ts: "Now",
        },
      ],
    }));

    // 2️⃣ Emit socket message
    socket.emit("private-message", {
      toUserId: activeChat.id,
      fromUserId: currentUserId,
      message: finalMessagePayload,
      audioUrl: finalAudioUrl,
      translatedText: isAudio ? finalMessagePayload : null,
    });

    // 3️⃣ Text messages -> my-chat AI
    if (!isAudio && finalMessagePayload.startsWith("@ash")) {
      const purePrompt = finalMessagePayload.replace("@ash", "").trim();
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
    }

    setAiProcessing(false);
  };

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
      />

      <RightDrawer
        visible={!!activeChat}
        chat={activeChat}
        aiReply={aiReply}
      />
    </NebulaLayout>
  );
}
