import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Scan, ChevronRight, Sparkles, Zap, MessageCircle, Send } from "lucide-react";

// --- 3D NEURAL HELIX ANIMATION ---
const NeuralHelix = () => {
  const points = Array.from({ length: 20 });
  
  return (
    <div className="w-full h-64 flex items-center justify-center" style={{ perspective: '1200px' }}>
      <motion.div 
        className="relative w-full h-full flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        {points.map((_, i) => {
          const angle = (i / points.length) * Math.PI * 4; 
          const y = (i - points.length / 2) * 12; 
          
          return (
            <React.Fragment key={i}>
              <motion.div
                className="absolute w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                style={{ transform: `rotateY(${angle}rad) translateZ(40px) translateY(${y}px)` }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
              />
              <motion.div
                className="absolute w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"
                style={{ transform: `rotateY(${angle + Math.PI}rad) translateZ(40px) translateY(${y}px)` }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
              />
              <div 
                className="absolute h-[1px] bg-gradient-to-r from-cyan-400/20 via-white/40 to-purple-500/20"
                style={{ width: '80px', transform: `rotateY(${angle}rad) translateY(${y}px)`, transformStyle: 'preserve-3d' }}
              />
            </React.Fragment>
          );
        })}
      </motion.div>
    </div>
  );
};

export default function RightDrawer({
  visible = true,
  mode = "ai", // 'ai' or 'comments'
  onClose = () => {},
  
  // AI Props
  chat = null,
  aiReply = "",
  aiProcessing = false,
  onCardSelect = () => {},

  // Comments Props
  activePost = null,
  onAddComment = () => {},
}) {
  const [cards, setCards] = useState([]);
  const [localThinking, setLocalThinking] = useState(false);
  const [typedReply, setTypedReply] = useState("");
  
  // Comment Input State
  const [commentInput, setCommentInput] = useState("");

  const isThinking = aiProcessing || localThinking;

  // Typewriter effect for AI
  useEffect(() => {
    if (mode !== 'ai' || !aiReply) {
      setTypedReply("");
      return;
    }
    let i = 0;
    setTypedReply("");
    const interval = setInterval(() => {
      setTypedReply(aiReply.slice(0, i + 1));
      i++;
      if (i >= aiReply.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [aiReply, mode]);

  const runScan = () => {
    setLocalThinking(true);
    setCards([]);
    setTimeout(() => {
      setCards([
        "Explore historical context.",
        "Analyze emotional tone.",
        "Generate creative rebuttal.",
        "Summarize key takeaways."
      ]);
      setLocalThinking(false);
    }, 2500);
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !activePost) return;
    onAddComment(activePost.id, commentInput);
    setCommentInput("");
  };

  if (!visible) return null;

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-[380px] h-screen sticky top-0 bg-[#030308] border-l border-white/5 flex flex-col z-50 overflow-hidden shadow-2xl"
    >
      {/* GLOW DECORATION */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[80px] pointer-events-none" />
      
      {/* HEADER */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10 bg-[#030308]">
        <div>
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">
            {mode === 'ai' ? 'Neural Stream' : 'Discussion'}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === 'ai' && isThinking ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-zinc-700'}`} />
            <span className="text-xs font-bold text-white tracking-wide">
              {mode === 'ai' ? (isThinking ? "SYNCHRONIZING..." : "STANDBY") : "LIVE FEED"}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all">
          <X size={20} />
        </button>
      </div>

      {/* --- CONTENT AREA: AI MODE --- */}
      {mode === 'ai' && (
        <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isThinking ? (
              /* 3D HELIX VIEW */
              <motion.div 
                key="thinking"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                className="py-10"
              >
                <NeuralHelix />
                <div className="text-center space-y-2 mt-4">
                  <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-[0.4em]">Deciphering Neural Nodes</p>
                  <div className="flex justify-center gap-1">
                    {[1,2,3].map(i => <motion.div key={i} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, delay: i*0.2 }} className="w-1 h-1 bg-white rounded-full" />)}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* RESULTS VIEW */
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pt-6"
              >
                {typedReply && (
                  <div className="relative p-5 rounded-3xl bg-white/[0.03] border border-white/5 group overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-24 h-24 bg-cyan-500/10 blur-3xl" />
                    <div className="flex items-center gap-2 mb-4 text-cyan-400">
                      <Zap size={14} className="fill-current" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Core Intelligence</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed font-light italic">"{typedReply}"</p>
                  </div>
                )}

                {cards.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="h-[1px] w-4 bg-zinc-800" /> Options
                    </h4>
                    {cards.map((c, i) => (
                      <button key={i} onClick={() => onCardSelect(c)} className="w-full text-left p-5 bg-gradient-to-r from-white/[0.01] to-transparent hover:from-white/[0.04] border border-white/5 rounded-2xl group transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{c}</span>
                          <ChevronRight size={16} className="text-zinc-800 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!typedReply && cards.length === 0 && (
                  <button onClick={runScan} className="w-full py-12 rounded-3xl border-2 border-dashed border-white/5 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all group">
                    <Scan size={32} className="mx-auto text-zinc-700 group-hover:text-cyan-500/50 mb-4" />
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Initiate Context Scan</p>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- CONTENT AREA: COMMENTS MODE --- */}
      {mode === 'comments' && activePost && (
        <div className="flex-1 flex flex-col h-full bg-[#05050A]">
          {/* Active Post Snippet */}
          <div className="p-4 bg-zinc-900/30 border-b border-white/5">
             <div className="flex items-center gap-3 mb-2">
                <img src={activePost.author.avatar} className="w-8 h-8 rounded-full" alt="OP" />
                <span className="text-sm font-bold text-white">{activePost.author.name}</span>
             </div>
             <p className="text-xs text-zinc-400 line-clamp-2 italic">"{activePost.content.original}"</p>
          </div>

          {/* Comment List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {(!activePost.commentsList || activePost.commentsList.length === 0) ? (
                <div className="text-center py-10 opacity-30">
                  <MessageCircle size={32} className="mx-auto mb-2" />
                  <p className="text-xs">No comments yet.<br/>Start the discussion.</p>
                </div>
             ) : (
                activePost.commentsList.map((c, i) => (
                   <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <img src={c.avatar} className="w-8 h-8 rounded-full mt-1 border border-white/10" alt="user" />
                      <div className="flex-1">
                         <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                            <div className="flex justify-between items-baseline mb-1">
                               <span className="text-xs font-bold text-zinc-300">{c.user}</span>
                               <span className="text-[10px] text-zinc-600">{c.time}</span>
                            </div>
                            <p className="text-sm text-zinc-200">{c.text}</p>
                         </div>
                      </div>
                   </div>
                ))
             )}
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-white/10 bg-[#030308]">
             <form onSubmit={handleSendComment} className="relative">
                <input
                   type="text"
                   value={commentInput}
                   onChange={(e) => setCommentInput(e.target.value)}
                   placeholder="Write a comment..."
                   className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={!commentInput.trim()} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 rounded-lg text-white disabled:opacity-50 disabled:bg-zinc-700 transition-all hover:scale-105"
                >
                   <Send size={14} />
                </button>
             </form>
          </div>
        </div>
      )}

      {/* FOOTER STATS */}
      {mode === 'ai' && (
        <div className="p-8 border-t border-white/5 bg-[#030308]">
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">
            <span>Signal Strength: 98%</span>
            <span>E2EE Active</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}