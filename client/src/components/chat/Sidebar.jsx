import React, { useRef, useState } from "react";
import { Search, Sparkles, Zap, Users, Globe, MessageSquare, Check, CheckCheck, Loader2, Trash2, ShieldBan, Upload, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AICoreStatus = () => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full bg-brand-500/30 opacity-70 animate-ping-slow" />
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/40 border border-white/10">
            <Zap size={20} className="text-white fill-yellow-300 animate-pulse" />
        </div>
    </div>
);

export default function Sidebar({
    chats = [],
    onSelectChat = () => {},
    activeChatId = null,
    onlineUsers = [],
    viewMode = "chat", 
    onViewChange = () => {},
    searchTerm = "",
    onSearchChange = () => {},
    lastMessages = {},
    // ⚡ PAGINATION PROPS
    onLoadMoreUsers = () => {},
    hasMoreUsers = false,
    loadingUsers = false,
    // ⚡ USER PROPS
    currentUser = null,
    onAvatarChange = () => {},
    // ⚡ CONTEXT ACTIONS
    onBlockUser = () => {}, 
    onDeleteChat = () => {} 
}) {
    const fileInputRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);

    // ⚡ SCROLL HANDLER (Infinite Scroll)
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Trigger when near bottom (within 10px)
        if (scrollHeight - scrollTop <= clientHeight + 10 && hasMoreUsers && !loadingUsers) {
            onLoadMoreUsers();
        }
    };

    // ⚡ CONTEXT MENU HANDLER (Right Click)
    const handleContextMenu = (e, userId) => {
        e.preventDefault(); // Stop default browser menu
        setContextMenu({ x: e.clientX, y: e.clientY, userId });
    };

    // ⚡ AVATAR UPLOAD TRIGGERS
    const handleAvatarClick = (e) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            onAvatarChange(e.target.files[0]);
        }
    };

    return (
        <aside 
            className="w-80 h-full flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl"
            onClick={() => setContextMenu(null)} // Close menu on click anywhere
        >
            {/* --- HEADER --- */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-6">
                    
                    {/* ⚡ CLICKABLE AVATAR */}
                    <div className="relative group cursor-pointer z-50" onClick={handleAvatarClick}>
                        <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#050510]">
                            {currentUser?.avatar ? (
                                <img 
                                    src={currentUser.avatar} 
                                    className="w-full h-full object-cover transition-opacity group-hover:opacity-50" 
                                    alt="My DP" 
                                />
                            ) : (
                                <Zap size={20} className="text-brand-400 fill-brand-400/20" />
                            )}
                            
                            {/* Camera Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <Camera size={18} className="text-white" />
                            </div>
                        </div>
                        
                        {/* Hidden Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-white">{currentUser?.name || "Astrix AI"}</h1>
                        <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                            <Sparkles size={10} /> NEURAL MONITORING
                        </p>
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex p-1 mb-4 bg-black/40 rounded-xl border border-white/5">
                    <button onClick={() => onViewChange("chat")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === "chat" ? "bg-brand-600/20 text-brand-300 border border-brand-500/20" : "text-slate-500"}`}><MessageSquare size={14} /><span>Links</span></button>
                    <button onClick={() => onViewChange("global")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === "global" ? "bg-blue-600/20 text-blue-300 border border-blue-500/20" : "text-slate-500"}`}><Globe size={14} /><span>Matrix</span></button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input className="w-full bg-black/30 border border-white/5 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-brand-500/50" placeholder="Search..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                </div>
            </div>

            {/* --- LIST AREA --- */}
            {viewMode === "chat" ? (
                <div 
                    className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar"
                    onScroll={handleScroll} // ⚡ ATTACH SCROLL LISTENER
                >
                    {chats.length === 0 && (
                        <div className="text-center text-slate-500 mt-10 text-sm flex flex-col items-center">
                            <Users size={16} className="mb-2" />
                            {searchTerm ? "No users found." : "No signals detected."}
                        </div>
                    )}

                    {chats.map((u) => {
                        const isOnline = onlineUsers.includes(u._id);
                        const isActive = activeChatId === u._id;
                        const lastMsg = lastMessages[u._id];

                        return (
                            <motion.button
                                key={u._id}
                                onClick={() => onSelectChat(u)}
                                onContextMenu={(e) => handleContextMenu(e, u._id)} // ⚡ RIGHT CLICK TRIGGER
                                whileHover={{ x: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} 
                                whileTap={{ scale: 0.98 }}
                                className={`relative w-full flex items-center gap-3 p-3 rounded-2xl transition-colors duration-300 group overflow-hidden ${isActive ? "bg-brand-500/15 border border-brand-500/30" : "border border-transparent"}`}
                            >
                                {isActive && <motion.div className="absolute inset-0 bg-brand-500/20 opacity-40 rounded-2xl" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 3, repeat: Infinity }} />}
                                
                                <div className={`relative p-[2px] rounded-full z-10 ${isActive ? 'bg-gradient-to-r from-brand-400 to-purple-500' : 'bg-transparent'}`}>
                                    <img className="w-10 h-10 rounded-full object-cover border-2 border-[#050510]" src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt={u.name} />
                                    {isOnline && <motion.span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#050510] rounded-full" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                                </div>

                                <div className="flex-1 text-left z-10 overflow-hidden">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <div className={`text-sm font-medium ${isActive ? "text-white" : "text-slate-300"}`}>{u.name}</div>
                                        {/* Time & Ticks */}
                                        {lastMsg && (
                                            <div className="flex items-center gap-1">
                                                {lastMsg.isOwn && (
                                                    <span className={lastMsg.isRead ? "text-blue-400" : "text-slate-500"}>
                                                        {lastMsg.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-600 font-mono">{lastMsg.time}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate h-4 flex items-center gap-1">
                                        {lastMsg ? (
                                            <span className={(!lastMsg.isRead && !lastMsg.isOwn) ? "text-slate-200 font-semibold" : ""}>{lastMsg.text.substring(0, 30)}</span>
                                        ) : (
                                            <span className="italic opacity-50 text-[10px]">No messages yet</span>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                    
                    {/* ⚡ LOADER AT BOTTOM */}
                    {loadingUsers && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="animate-spin text-brand-400" size={20} />
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 px-6 py-10 text-center text-slate-500 text-sm">
                    <Globe className="mx-auto mb-3 opacity-50" size={32} />
                    <p>Scanning global frequencies...</p>
                </div>
            )}

            {/* ⚡ CONTEXT MENU OVERLAY */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed z-50 bg-[#0f0f17] border border-white/10 rounded-xl shadow-2xl py-1 w-40 overflow-hidden"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button 
                            onClick={() => { onDeleteChat(contextMenu.userId); setContextMenu(null); }}
                            className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={14} /> Delete Chat
                        </button>
                        <button 
                            onClick={() => { onBlockUser(contextMenu.userId); setContextMenu(null); }}
                            className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                        >
                            <ShieldBan size={14} /> Block User
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`@keyframes ping-slow { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.4); opacity: 0.3; } } .animate-ping-slow { animation: ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite; }`}</style>
        </aside>
    );
}