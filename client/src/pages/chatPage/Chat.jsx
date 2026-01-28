import React, { useState, useEffect, useRef, useCallback } from "react";
import NebulaLayout from "../../layouts/NebulaLayout";
import Sidebar from "../../components/chat/Sidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import RightDrawer from "../../components/chat/RightDrawer";
import PublicFeed from "../../components/chat/PublicFeed"; 
import { getSocket } from "../../socket";
import Cookies from "js-cookie";
import { usePublicFeed } from "../../hooks/usePublicFeed";
import axios from "axios"; 

// --- HELPER 1: Blob to Base64 (For Sending) ---
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

// --- HELPER 2: Base64 to Blob (For Receiving) ---
const base64ToBlob = (base64, mimeType = "audio/webm") => {
    try {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
    } catch (e) { return null; }
};

export default function Chat() {
  // --- USER STATE ---
  const [currentUser, setCurrentUser] = useState(() => {
      const cookieUser = Cookies.get("user");
      return cookieUser ? JSON.parse(cookieUser) : null;
  });
  const token = Cookies.get("token");

  // --- DATA STATE ---
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [lastMessages, setLastMessages] = useState({}); 

  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("chat"); 
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false); 
  const [rightDrawerMode, setRightDrawerMode] = useState("ai"); 
  const [activePostForComments, setActivePostForComments] = useState(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiReply, setAiReply] = useState("");

  // --- PAGINATION STATE ---
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  const [msgPage, setMsgPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);

  const { posts, isLoading, createPost, addComment } = usePublicFeed();
  const activeChatIdRef = useRef(null);
  const socketRef = useRef(null);

  if (!token || !currentUser) return <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center">Please login first.</div>;

  useEffect(() => { activeChatIdRef.current = activeChat?.id; }, [activeChat]);

  // --- 1. FETCH USERS ---
  const fetchUsers = useCallback(async (page = 1, reset = false) => {
    if (isFetchingUsers) return; 
    setIsFetchingUsers(true);
    try {
        const url = searchTerm 
            ? `http://localhost:5000/api/v1/users?search=${searchTerm}`
            : `http://localhost:5000/api/v1/users?page=${page}&limit=20`;

        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        
        if (data.success) {
            if (data.users.length < 20 && !searchTerm) setHasMoreUsers(false);
            
            setUsers(prev => {
                if(searchTerm || reset) return data.users;
                const newUsers = data.users.filter(u => !prev.some(p => p._id === u._id));
                return [...prev, ...newUsers];
            });
        }
    } catch (err) { console.error(err); }
    setIsFetchingUsers(false);
    setLoading(false);
  }, [token, searchTerm]);

  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          fetchUsers(1, true);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    if (socket && currentUser) socket.emit("register-user", currentUser._id || currentUser.id);
    
    const onlineHandler = (list) => setOnlineUsers(list);
    socket.on("online-users", onlineHandler);
    
    return () => socket.off("online-users", onlineHandler);
  }, []); 

  const handleLoadMoreUsers = () => {
      if(hasMoreUsers && !isFetchingUsers && !searchTerm) {
          const nextPage = userPage + 1;
          setUserPage(nextPage);
          fetchUsers(nextPage);
      }
  };

  // --- 2. MESSAGE MAPPER (Fixed for Audio) ---
  const mapMessage = (m, myId) => {
    // ⚡ FIX: Reconstruct Blob URL if Base64 exists
    let reconstructedUrl = m.audioOriginal || null; // Use existing if available (optimistic)
    let reconstructedBlob = m.audioOriginalBlob || null;

    if (!reconstructedUrl && m.originalAudioBase64) {
        reconstructedBlob = base64ToBlob(m.originalAudioBase64);
        if (reconstructedBlob) {
            reconstructedUrl = URL.createObjectURL(reconstructedBlob);
        }
    }

    return {
        id: m._id || m.id || Date.now(),
        textOriginal: m.content?.original || m.message || "", 
        content: m.content || { original: m.message, translations: {} }, 
        textTranslated: null,
        
        // ⚡ RESTORED AUDIO FIELDS
        audioOriginal: reconstructedUrl, 
        audioOriginalBlob: reconstructedBlob,
        
        audioTranslated: null,
        fromMe: String(m.from || m.fromUserId) === String(myId),
        fromUserId: m.from || m.fromUserId, 
        toUserId: m.to || m.toUserId,
        isRead: m.isRead || false,
        ts: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt || new Date(),
        metadata: m.metadata || {},
    };
  };

  // --- 3. SELECT CHAT ---
  const handleSelectChat = async (user) => {
    setViewMode("chat");
    setRightDrawerMode("ai"); 
    setRightDrawerOpen(true);
    setMsgPage(1); 
    setHasMoreMessages(true);
    
    const myId = currentUser._id || currentUser.id;
    const res = await fetch(
        `http://localhost:5000/api/v1/messages/history/${user._id}?myId=${myId}&page=1&limit=30`,
        { headers: { "Authorization": `Bearer ${token}` } }
    );
    const data = await res.json();
    const history = data.success ? data.messages.map(m => mapMessage(m, myId)) : [];

    if (data.messages.length < 30) setHasMoreMessages(false);

    setActiveChat({
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      lastSeen: user.lastSeen, 
      messages: history,
      isBlocked: user.isBlocked || false
    });
    setAiReply("");

    socketRef.current?.emit("mark-read", { senderId: user._id });
  };

  const loadMoreMessages = async () => {
    if (!activeChat || !hasMoreMessages || isFetchingMessages) return;
    setIsFetchingMessages(true);
    const nextPage = msgPage + 1;
    
    try {
        const myId = currentUser._id || currentUser.id;
        const res = await fetch(
            `http://localhost:5000/api/v1/messages/history/${activeChat.id}?myId=${myId}&page=${nextPage}&limit=30`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        const data = await res.json();

        if (data.success) {
            if (data.messages.length < 30) setHasMoreMessages(false);
            const newMessages = data.messages.map(m => mapMessage(m, myId));
            
            setActiveChat(prev => ({
                ...prev,
                messages: [...newMessages, ...prev.messages] 
            }));
            setMsgPage(nextPage);
        }
    } catch (e) { console.error(e); }
    setIsFetchingMessages(false);
  };

  // --- 4. SEND MESSAGE ---
  const sendMessage = async (msgOrBlob, targetLang) => {
    if (!activeChat) return;
    const socket = getSocket();
    const currentUserId = currentUser?._id || currentUser?.id;
    const isAudio = msgOrBlob instanceof Blob;

    if (!isAudio && typeof msgOrBlob === 'string' && msgOrBlob.startsWith("@ash")) {
        // AI Logic...
        return;
    }

    const tempId = Date.now(); 
    let originalAudioUrl = isAudio ? URL.createObjectURL(msgOrBlob) : null;

    const newMsgObj = {
        id: tempId,
        _id: tempId,
        textOriginal: isAudio ? null : msgOrBlob,
        content: { original: isAudio ? null : msgOrBlob, translations: {} },
        fromMe: true,
        fromUserId: currentUserId,
        toUserId: activeChat.id,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date(),
        audioOriginal: originalAudioUrl,
        audioOriginalBlob: isAudio ? msgOrBlob : null,
        metadata: { tempId },
        isRead: false
    };

    setActiveChat((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsgObj],
    }));

    setLastMessages(prev => ({ ...prev, [activeChat.id]: { text: isAudio ? "Voice Message" : msgOrBlob, time: newMsgObj.ts, isRead: false, isOwn: true } }));
    
    setUsers(prev => {
        const index = prev.findIndex(u => u._id === activeChat.id);
        if (index <= 0) return prev; 
        const user = prev[index];
        return [user, ...prev.filter(u => u._id !== activeChat.id)];
    });

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

  // --- SOCKET EVENT HANDLERS ---
  useEffect(() => {
      const socket = socketRef.current;
      if (!socket) return;

      const msgHandler = (payload) => {
          const { fromUserId, toUserId, message, _id, createdAt } = payload;
          const myId = currentUser._id || currentUser.id;
          const otherId = String(fromUserId) === String(myId) ? toUserId : fromUserId;

          setLastMessages(prev => ({
            ...prev,
            [otherId]: {
                text: message || "Media",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isRead: false,
                isOwn: String(fromUserId) === String(myId)
            }
          }));

          setActiveChat(prev => {
              if(!prev) return prev;
              
              const isRelated = (prev.id === fromUserId) || (String(fromUserId) === String(myId) && prev.id === toUserId);
              if (!isRelated) return prev;

              const isDuplicate = prev.messages.some(m => 
                  (payload._id && m.id === payload._id) || 
                  (payload.metadata?.tempId && m.metadata?.tempId === payload.metadata.tempId)
              );

              if (isDuplicate) {
                  return {
                      ...prev,
                      messages: prev.messages.map(m => 
                          (m.metadata?.tempId === payload.metadata?.tempId) 
                          ? mapMessage({ ...payload, audioOriginal: m.audioOriginal }, myId) // Keep optimistic audio
                          : m
                      )
                  };
              }

              // ⚡ PASS PAYLOAD CORRECTLY TO MAPMESSAGE
              return { ...prev, messages: [...prev.messages, mapMessage(payload, myId)] };
          });
      };
      
      const readHandler = ({ byUserId }) => {
          if (activeChatIdRef.current === byUserId) {
              setActiveChat(prev => {
                  if(!prev) return prev;
                  return { ...prev, messages: prev.messages.map(m => m.fromMe ? { ...m, isRead: true } : m) };
              });
          }
      };

      const deleteHandler = ({ messageId }) => {
        setActiveChat(prev => {
            if (!prev) return prev;
            return { ...prev, messages: prev.messages.filter(m => m.id !== messageId) };
        });
      };

      socket.on("private-message", msgHandler);
      socket.on("messages-read", readHandler);
      socket.on("message-deleted", deleteHandler);
      return () => {
          socket.off("private-message", msgHandler);
          socket.off("messages-read", readHandler);
          socket.off("message-deleted", deleteHandler);
      };
  }, [currentUser]);

  // --- AVATAR & DELETE ---
  const handleAvatarChange = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const previewUrl = URL.createObjectURL(file);
        const tempUser = { ...currentUser, avatar: previewUrl };
        setCurrentUser(tempUser); 

        const res = await axios.post("http://localhost:5000/api/v1/users/avatar", formData, {
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });

        if (res.data.success) {
            const finalUser = { ...currentUser, avatar: res.data.avatarUrl };
            setCurrentUser(finalUser);
            Cookies.set("user", JSON.stringify(finalUser), { expires: 7 });
        }
    } catch (err) { alert("Failed to update profile picture."); }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
        setActiveChat(prev => ({ ...prev, messages: prev.messages.filter(m => m.id !== messageId) }));
        await axios.delete(`http://localhost:5000/api/v1/messages/${messageId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
    } catch (err) { console.error(err); }
  };

  const handleDeleteChat = async (targetUserId) => {
    if(!window.confirm("Delete this conversation?")) return;
    try {
        setUsers(prev => prev.filter(u => u._id !== targetUserId));
        if (activeChat?.id === targetUserId) setActiveChat(null);
        await axios.post("http://localhost:5000/api/v1/messages/clear", 
            { targetId: targetUserId }, 
            { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
        );
    } catch (e) { console.error(e); }
  };

  const handleBlockUser = async () => { /* ... */ };
  const handleUnblockUser = async () => { /* ... */ };
  const handleClearChat = async () => { /* ... */ };
  const handleStartChatFromFeed = async (targetUserId) => { /* ... */ };
  const handleOpenComments = (post) => { /* ... */ };

  return (
    <NebulaLayout>
      <Sidebar
        chats={users}
        activeChatId={activeChat?.id}
        onSelectChat={handleSelectChat}
        onlineUsers={onlineUsers}
        viewMode={viewMode}
        onViewChange={(mode) => setViewMode(mode)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        lastMessages={lastMessages} 
        onLoadMoreUsers={handleLoadMoreUsers}
        hasMoreUsers={hasMoreUsers}
        loadingUsers={isFetchingUsers}
        currentUser={currentUser}
        onAvatarChange={handleAvatarChange}
        onDeleteChat={handleDeleteChat} 
      />
      
      {viewMode === "chat" ? (
        <ChatWindow 
            chat={activeChat} 
            onSend={sendMessage} 
            aiProcessing={aiProcessing} 
            currentUser={currentUser} 
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            onClear={handleClearChat}
            onDeleteMessage={handleDeleteMessage} 
            isOnline={onlineUsers.includes(activeChat?.id)}
            onLoadMoreMessages={loadMoreMessages}
            hasMoreMessages={hasMoreMessages}
            loadingMessages={isFetchingMessages}
        />
      ) : (
        <PublicFeed posts={posts} isLoading={isLoading} onCreatePost={createPost} onStartChat={handleStartChatFromFeed} onOpenComments={handleOpenComments} />
      )}

      <RightDrawer visible={rightDrawerOpen} onClose={() => setRightDrawerOpen(false)} mode={rightDrawerMode} chat={activeChat} aiReply={aiReply} aiProcessing={aiProcessing} activePost={activePostForComments} onAddComment={addComment} />
    </NebulaLayout>
  );
}