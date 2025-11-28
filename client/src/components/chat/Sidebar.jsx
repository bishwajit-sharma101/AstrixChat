// src/components/chat/Sidebar.jsx
import React from "react";
import { Search, Sparkles, Zap, Users } from "lucide-react";
import { motion } from "framer-motion";

// --- New Component: AICoreStatus ---
const AICoreStatus = () => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Outer Pulsing Ring (The AI 'Breath') */}
        <div className="absolute w-full h-full rounded-full bg-brand-500/30 opacity-70 animate-ping-slow" />
        
        {/* Core Icon */}
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/40 border border-white/10">
            <Zap size={20} className="text-white fill-yellow-300 animate-pulse" />
        </div>
    </div>
);
// --- End AICoreStatus ---


export default function Sidebar({
    chats = [],
    onSelectChat = () => {},
    activeChatId = null,
    onlineUsers = [],
}) {
    return (
        <aside className="w-80 h-full flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl">
            
            {/* 1. AI CORE HEADER */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-6">
                    <AICoreStatus />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-white">Astrix AI</h1>
                        <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                            <Sparkles size={10} /> NEURAL MONITORING
                        </p>
                    </div>
                </div>

                {/* SEARCH "PILL" */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-400 transition-colors" size={16} />
                    <input
                        className="w-full bg-black/30 border border-white/5 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                        placeholder="Search frequency..."
                    />
                </div>
            </div>

            {/* 2. DYNAMIC USER LIST */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {/* Fallback/System message */}
                {chats.length === 0 && (
                    <div className="text-center text-slate-500 mt-10 text-sm flex flex-col items-center">
                        <Users size={16} className="mb-2" />
                        No signals detected.
                    </div>
                )}

                {chats.map((u) => {
                    const isOnline = onlineUsers.includes(u._id);
                    const isActive = activeChatId === u._id;

                    return (
                        <motion.button
                            key={u._id}
                            onClick={() => onSelectChat(u)}
                            // Microanimation: Kinetic Hover Effect (moves 5px right)
                            whileHover={{ x: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} 
                            whileTap={{ scale: 0.98 }}
                            className={`
                                relative w-full flex items-center gap-3 p-3 rounded-2xl transition-colors duration-300 group overflow-hidden
                                ${isActive ? "bg-brand-500/15 border border-brand-500/30" : "border border-transparent"}
                            `}
                        >
                            {/* 3. Active Connection Glow (Only for active chat) */}
                            {isActive && (
                                <motion.div 
                                    className="absolute inset-0 bg-brand-500/20 opacity-40 rounded-2xl"
                                    animate={{ 
                                        opacity: [0.4, 0.6, 0.4], // Soft pulse effect
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                />
                            )}

                            {/* AVATAR WITH GLOW */}
                            <div className={`relative p-[2px] rounded-full z-10 transition-all ${isActive ? 'bg-gradient-to-r from-brand-400 to-purple-500' : 'bg-transparent'}`}>
                                <img
                                    className="w-10 h-10 rounded-full object-cover border-2 border-[#050510]"
                                    src={u.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + u.name}
                                    alt={u.name}
                                />
                                {/* Status Dot Microanimation */}
                                {isOnline && (
                                    <motion.span 
                                        className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#050510] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
                                        animate={{ scale: [1, 1.1, 1] }} 
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    />
                                )}
                            </div>

                            <div className="flex-1 text-left z-10">
                                <div className={`text-sm font-medium transition-colors ${isActive ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                                    {u.name}
                                </div>
                                <div className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                                    {u.email || "Encrypted Connection"}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
            {/* Added animation utility for the AI Core */}
            <style jsx global>{`
                @keyframes ping-slow {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.7;
                    }
                    50% {
                        transform: scale(1.4);
                        opacity: 0.3;
                    }
                }
                .animate-ping-slow {
                    animation: ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
        </aside>
    );
}