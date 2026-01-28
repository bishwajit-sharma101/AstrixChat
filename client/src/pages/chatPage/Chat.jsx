import React, { useState, useEffect, useRef } from "react";
import NebulaLayout from "../../layouts/NebulaLayout";
import Sidebar from "../../components/chat/Sidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import RightDrawer from "../../components/chat/RightDrawer";
import PublicFeed from "../../components/chat/PublicFeed"; 
import { getSocket } from "../../socket";
import Cookies from "js-cookie";
import { usePublicFeed } from "../../hooks/usePublicFeed";
import axios from "axios"; 

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1]; 
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

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
  const [searchTerm, setSearchTerm] = useState("");
  
  // ⚡ STORES PREVIEWS: { userId: { text, time, isRead, isOwn } }
  const [lastMessages, setLastMessages] = useState({}); 

  const [viewMode, setViewMode] = useState("chat"); 
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false); 
  const [rightDrawerMode, setRightDrawerMode] = useState("ai"); 
  const [activePostForComments, setActivePostForComments] = useState(null);

  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiReply, setAiReply] = useState("");

  const { posts, isLoading, createPost, addComment } = usePublicFeed();
  const activeChatIdRef = useRef(null);

  const token = Cookies.get("token");
  const currentUser = Cookies.get("user") ? JSON.parse(Cookies.get("user")) : null;
  
  if (!token || !currentUser) {
    return <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center">Please login first.</div>;
  }

  useEffect(() => {
    activeChatIdRef.current = activeChat?.id;
  }, [activeChat]);

  // --- HELPER: MOVE CHAT TO TOP ---
  const moveChatToTop = (userId) => {
    setUsers(prevUsers => {
        const index = prevUsers.findIndex(u => u._id === userId);
        if (index <= 0) return prevUsers; // Already top or not found
        const user = prevUsers[index];
        const newUsers = [user, ...prevUsers.filter(u => u._id !== userId)];
        return newUsers;
    });
  };

  useEffect(() => {
    const socket = getSocket();
    const userId = currentUser?._id || currentUser?.id;
    if (socket && userId) {
      socket.emit("register-user", userId);
    }
  }, [currentUser?._id, currentUser?.id]);

  useEffect(() => {
    fetch("http://localhost:5000/api/v1/users", { 
        headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users);
      })
      .catch((err) => console.log("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [token]);

  const fetchChatHistory = async (otherUserId) => {
    try {
      const myId = currentUser?._id || currentUser?.id;
      if (!myId) return [];
      
      const res = await fetch(
        `http://localhost:5000/api/v1/messages/history/${otherUserId}?myId=${myId}`,
        { 
            method: "GET", 
            headers: { "Authorization": `Bearer ${token}` }
        }
      );

      const data = await res.json();
      if (!data.success) return [];

      const mappedMessages = data.messages.map((m) => ({
        id: m._id,
        textOriginal: m.content?.original || m.message || "", 
        content: m.content, 
        textTranslated: null,
        audioOriginal: null,
        audioOriginalBlob: null,
        audioTranslated: null,
        fromMe: String(m.from) === String(myId),
        fromUserId: m.from, 
        toUserId: m.to,
        isRead: m.isRead,
        ts: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt,
        metadata: {},
      }));

      // ⚡ FIX: GRAB THE LAST MESSAGE (Newest), NOT THE FIRST (Oldest)
      if (mappedMessages.length > 0) {
          const lastMsg = mappedMessages[mappedMessages.length - 1]; 
          
          setLastMessages(prev => ({
              ...prev,
              [otherUserId]: {
                  text: lastMsg.textOriginal || (lastMsg.content?.translations ? "Translated Message" : "Media"),
                  time: lastMsg.ts,
                  isRead: lastMsg.isRead,
                  isOwn: lastMsg.fromMe
              }
          }));
      }

      return mappedMessages;
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

  // --- SOCKET EVENT HANDLERS ---
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // 1. Message Received
    const msgHandler = (payload) => {
      const { fromUserId, toUserId, message, content, metadata, originalAudioBase64, _id, createdAt } = payload;
      const myId = currentUser?._id || currentUser?.id;

      // Identify the other person
      const otherId = String(fromUserId) === String(myId) ? toUserId : fromUserId;

      // ⚡ UPDATE SIDEBAR PREVIEW (Live)
      setLastMessages(prev => ({
          ...prev,
          [otherId]: {
              text: message || "Media Message",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead: false,
              isOwn: String(fromUserId) === String(myId)
          }
      }));

      // ⚡ REORDER CHAT TO TOP
      moveChatToTop(otherId);

      setActiveChat((prev) => {
        if (!prev) return prev;

        const isRelated = (prev.id === fromUserId) || (String(fromUserId) === String(myId) && prev.id === toUserId);
        if (!isRelated) return prev;

        const isDuplicate = prev.messages.some(m => (payload._id && m.id === payload._id) || (metadata?.tempId && m.id === metadata.tempId));
        if (isDuplicate) {
          return {
            ...prev,
            messages: prev.messages.map(m => m.id === metadata?.tempId ? { ...m, id: _id } : m)
          };
        }

        let reconstructedBlob = null;
        let reconstructedUrl = null;
        if (originalAudioBase64) {
          reconstructedBlob = base64ToBlob(originalAudioBase64);
          if (reconstructedBlob) reconstructedUrl = URL.createObjectURL(reconstructedBlob);
        }

        const newMsg = {
          id: _id || Date.now(),
          textOriginal: content?.original || message || null,
          content: content || { original: message, translations: {} },
          fromMe: String(fromUserId) === String(myId),
          fromUserId: fromUserId,
          toUserId: toUserId,
          ts: new Date(createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioOriginal: reconstructedUrl, 
          audioOriginalBlob: reconstructedBlob, 
          metadata: metadata || {},
          isRead: false
        };

        if (String(fromUserId) !== String(myId) && String(fromUserId) === String(activeChatIdRef.current)) {
            socket.emit("mark-read", { senderId: fromUserId });
        }

        return { ...prev, messages: [...prev.messages, newMsg] };
      });
    };

    const deleteHandler = ({ messageId }) => {
        setActiveChat(prev => {
            if (!prev) return prev;
            return { ...prev, messages: prev.messages.filter(m => m.id !== messageId) };
        });
    };

    const readHandler = ({ byUserId }) => {
        // Update sidebar "read" status if needed
        setLastMessages(prev => {
            if (!prev[byUserId]) return prev;
            return {
                ...prev,
                [byUserId]: { ...prev[byUserId], isRead: true }
            };
        });

        if (activeChatIdRef.current === byUserId) {
            setActiveChat(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: prev.messages.map(m => m.fromMe ? { ...m, isRead: true } : m)
                };
            });
        }
    };

    socket.on("private-message", msgHandler);
    socket.on("message-deleted", deleteHandler);
    socket.on("messages-read", readHandler);

    return () => {
        socket.off("private-message", msgHandler);
        socket.off("message-deleted", deleteHandler);
        socket.off("messages-read", readHandler);
    };
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
      lastSeen: user.lastSeen, 
      messages: history,
    });
    setAiReply("");

    const socket = getSocket();
    if(socket) socket.emit("mark-read", { senderId: user._id });
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

  const sendMessage = async (msgOrBlob, targetLang) => {
    if (!activeChat) return;
    const socket = getSocket();
    const currentUserId = currentUser?._id || currentUser?.id;

    const isAudio = msgOrBlob instanceof Blob;

    if (!isAudio && typeof msgOrBlob === 'string' && msgOrBlob.startsWith("@ash")) {
        // ... (AI Logic omitted for brevity, keep existing)
        return;
    }

    const tempId = Date.now(); 
    let originalAudioUrl = isAudio ? URL.createObjectURL(msgOrBlob) : null;

    // 1. Optimistic UI
    const newMsgObj = {
        id: tempId,
        textOriginal: isAudio ? null : msgOrBlob,
        content: { original: isAudio ? null : msgOrBlob, translations: {} },
        fromMe: true,
        fromUserId: currentUserId,
        toUserId: activeChat.id,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioOriginal: originalAudioUrl,
        audioOriginalBlob: isAudio ? msgOrBlob : null,
        metadata: { tempId },
        isRead: false
    };

    setActiveChat((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsgObj],
    }));

    // ⚡ UPDATE SIDEBAR PREVIEW (Self)
    setLastMessages(prev => ({
        ...prev,
        [activeChat.id]: {
            text: isAudio ? "Voice Message" : msgOrBlob,
            time: newMsgObj.ts,
            isRead: false,
            isOwn: true
        }
    }));

    // ⚡ MOVE CHAT TO TOP
    moveChatToTop(activeChat.id);

    let audioBase64 = null;
    if (isAudio) audioBase64 = await blobToBase64(msgOrBlob);

    socket.emit("private-message", {
      toUserId: activeChat.id,
      fromUserId: currentUserId,
      message: isAudio ? "(Voice Message)" : msgOrBlob,
      originalAudioBase64: audioBase64, 
      metadata: { tempId }, 
    });
  };

  const handleBlockUser = async () => { 
      // ... keep existing block logic 
  };
  const handleClearChat = async () => { 
      // ... keep existing clear logic 
  };

  if (loading) return <div className="min-h-screen bg-[#030014] flex items-center justify-center text-brand-400">Loading...</div>;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <NebulaLayout>
      <Sidebar
        chats={filteredUsers}
        activeChatId={activeChat?.id}
        onSelectChat={handleSelectChat}
        onlineUsers={onlineUsers}
        viewMode={viewMode}
        onViewChange={(mode) => {
          setViewMode(mode);
          if (mode === 'global') setRightDrawerOpen(false); 
          else if (activeChat) setRightDrawerOpen(true);
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        // ⚡ PASS UPDATED LAST MESSAGES
        lastMessages={lastMessages} 
      />
      
      {viewMode === "chat" ? (
        <ChatWindow 
            chat={activeChat} 
            onSend={sendMessage} 
            aiProcessing={aiProcessing} 
            currentUser={currentUser} 
            onBlock={handleBlockUser}
            onClear={handleClearChat}
            isOnline={onlineUsers.includes(activeChat?.id)}
        />
      ) : (
        <PublicFeed posts={posts} isLoading={isLoading} onCreatePost={createPost} onStartChat={handleStartChatFromFeed} onOpenComments={handleOpenComments} />
      )}

      <RightDrawer 
        visible={rightDrawerOpen} 
        onClose={() => setRightDrawerOpen(false)} 
        mode={rightDrawerMode} 
        chat={activeChat} 
        aiReply={aiReply} 
        aiProcessing={aiProcessing} 
        activePost={activePostForComments} 
        onAddComment={addComment} 
      />
    </NebulaLayout>
  );
}