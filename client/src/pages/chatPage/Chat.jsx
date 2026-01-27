import React, { useState, useEffect } from "react";
import NebulaLayout from "../../layouts/NebulaLayout";
import Sidebar from "../../components/chat/Sidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import RightDrawer from "../../components/chat/RightDrawer";
import PublicFeed from "../../components/chat/PublicFeed"; 
import { getSocket } from "../../socket";
import Cookies from "js-cookie";
import { usePublicFeed } from "../../hooks/usePublicFeed";

// --- HELPER 1: Convert Blob to Base64 String (For Sending) ---
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result looks like "data:audio/webm;base64,VGhpcyBpcy..."
      // We only want the part after the comma
      const base64String = reader.result.split(",")[1]; 
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// --- HELPER 2: Convert Base64 String to Blob (For Receiving) ---
const base64ToBlob = (base64, mimeType = "audio/webm") => {
  try {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (e) {
    console.error("Failed to convert base64 to blob", e);
    return null;
  }
};

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("chat"); 
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false); 
  const [rightDrawerMode, setRightDrawerMode] = useState("ai"); 
  const [activePostForComments, setActivePostForComments] = useState(null);

  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiReply, setAiReply] = useState("");

  const { posts, isLoading, createPost, addComment } = usePublicFeed();

  const token = Cookies.get("token");
  const currentUser = Cookies.get("user") ? JSON.parse(Cookies.get("user")) : null;
  
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center">
        Please login first.
      </div>
    );
  }

  useEffect(() => {
    const socket = getSocket();
    const userId = currentUser?._id || currentUser?.id;
    if (socket && userId) {
      socket.emit("register-user", userId);
    }
  }, [currentUser?._id, currentUser?.id]);

  useEffect(() => {
    fetch("http://localhost:5000/api/v1/users", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users);
      })
      .catch((err) => console.log("Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchChatHistory = async (otherUserId) => {
    try {
      const myId = currentUser?._id || currentUser?.id;
      if (!myId) return [];
      
      const res = await fetch(
        `http://localhost:5000/api/v1/chat/messages/history/${otherUserId}?myId=${myId}`,
        { method: "GET", credentials: "include" }
      );

      const data = await res.json();
      if (!data.success) return [];

      return data.messages.map((m) => ({
        id: m._id,
        textOriginal: m.content?.original || m.message || "", 
        content: m.content, 
        textTranslated: null,
        audioOriginal: null,
        audioOriginalBlob: null,
        audioTranslated: null,
        fromMe: String(m.from) === String(myId),
        ts: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {},
      }));
    } catch (err) {
      console.error("History fetch failed", err);
      return [];
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (list) => setOnlineUsers(list);
    socket.on("online-users", handler);
    return () => socket.off("online-users", handler);
  }, []);

  // --- FIXED SOCKET HANDLER ---
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (payload) => {
      // 1. Destructure the Base64 audio string
      const { fromUserId, toUserId, message, content, metadata, originalAudioBase64 } = payload;
      const myId = currentUser?._id || currentUser?.id;

      setActiveChat((prev) => {
        if (!prev) return prev;

        const isRelated = (prev.id === fromUserId) || (String(fromUserId) === String(myId) && prev.id === toUserId);
        if (!isRelated) return prev;

        const isDuplicate = prev.messages.some(m => 
          (payload._id && m.id === payload._id) || 
          (metadata?.tempId && m.id === metadata.tempId)
        );

        if (isDuplicate) {
          // If duplicate, just update ID but KEEP existing audio blobs (sender side)
          return {
            ...prev,
            messages: prev.messages.map(m => 
              m.id === metadata?.tempId ? { ...m, id: payload._id } : m
            )
          };
        }

        // 2. RECONSTRUCT BLOB (Receiver Side)
        let reconstructedBlob = null;
        let reconstructedUrl = null;

        if (originalAudioBase64) {
          console.log("🔊 Receiving Audio Base64 length:", originalAudioBase64.length);
          reconstructedBlob = base64ToBlob(originalAudioBase64);
          if (reconstructedBlob) {
            reconstructedUrl = URL.createObjectURL(reconstructedBlob);
          }
        }

        const newMsg = {
          id: payload._id || Date.now(),
          textOriginal: content?.original || message || null,
          content: content || { original: message, translations: {} },
          fromMe: String(fromUserId) === String(myId),
          ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          
          // 3. INJECT THE RECONSTRUCTED AUDIO
          audioOriginal: reconstructedUrl, 
          audioOriginalBlob: reconstructedBlob, 

          metadata: metadata || {},
        };

        return { ...prev, messages: [...prev.messages, newMsg] };
      });
    };

    socket.on("private-message", handler);
    return () => socket.off("private-message", handler);
  }, [currentUser?._id, currentUser?.id]);

  const handleSelectChat = async (user) => {
    setViewMode("chat");
    setRightDrawerMode("ai"); 
    setRightDrawerOpen(true);
    
    const history = await fetchChatHistory(user._id);
    setActiveChat({
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      messages: history,
    });
    setAiReply("");
  };

  const handleStartChatFromFeed = async (targetUserId) => {
    const targetUser = users.find(u => u._id === targetUserId);
    if (targetUser) await handleSelectChat(targetUser);
  };

  const handleOpenComments = (post) => {
    setActivePostForComments(post);
    setRightDrawerMode("comments");
    setRightDrawerOpen(true);
  };

  // --- FIXED SEND MESSAGE FUNCTION ---
  const sendMessage = async (msgOrBlob, targetLang) => {
    if (!activeChat) return;
    const socket = getSocket();
    const currentUserId = currentUser?._id || currentUser?.id;

    const isAudio = msgOrBlob instanceof Blob;

    if (!isAudio && typeof msgOrBlob === 'string' && msgOrBlob.startsWith("@ash")) {
      const purePrompt = msgOrBlob.replace("@ash", "").trim();
      setAiProcessing(true);
      try {
        setAiReply("Thinking...");
        const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "my-chat", prompt: purePrompt, stream: false }),
        });
        const data = await response.json();
        setAiReply(data.response);
      } catch (err) { setAiReply("⚠️ Error."); }
      setAiProcessing(false); 
      return; 
    }

    const tempId = Date.now(); 
    // Sender gets a local URL immediately
    let originalAudioUrl = isAudio ? URL.createObjectURL(msgOrBlob) : null;

    // 1. Add to Local UI (Optimistic)
    setActiveChat((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: tempId,
          textOriginal: isAudio ? null : msgOrBlob,
          content: { original: isAudio ? null : msgOrBlob, translations: {} },
          fromMe: true,
          ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioOriginal: originalAudioUrl,
          audioOriginalBlob: isAudio ? msgOrBlob : null,
          metadata: { tempId },
        },
      ],
    }));

    // 2. Prepare Base64 for Network Transmission
    let audioBase64 = null;
    if (isAudio) {
        audioBase64 = await blobToBase64(msgOrBlob);
        console.log("🎤 Sending Audio Base64 length:", audioBase64.length);
    }

    // 3. Emit to Socket
    socket.emit("private-message", {
      toUserId: activeChat.id,
      fromUserId: currentUserId,
      message: isAudio ? "(Voice Message)" : msgOrBlob,
      // Do NOT send the raw Blob object, it causes socket issues. Send Base64.
      originalAudioBase64: audioBase64, 
      metadata: { tempId }, 
    });
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
        viewMode={viewMode}
        onViewChange={(mode) => {
          setViewMode(mode);
          if (mode === 'global') setRightDrawerOpen(false); 
          else if (activeChat) setRightDrawerOpen(true);
        }}
      />
      
      {viewMode === "chat" ? (
        <ChatWindow chat={activeChat} onSend={sendMessage} aiProcessing={aiProcessing} currentUser={currentUser} />
      ) : (
        <PublicFeed posts={posts} isLoading={isLoading} onCreatePost={createPost} onStartChat={handleStartChatFromFeed} onOpenComments={handleOpenComments} />
      )}

      <RightDrawer visible={rightDrawerOpen} onClose={() => setRightDrawerOpen(false)} mode={rightDrawerMode} chat={activeChat} aiReply={aiReply} aiProcessing={aiProcessing} activePost={activePostForComments} onAddComment={addComment} />
    </NebulaLayout>
  );
}