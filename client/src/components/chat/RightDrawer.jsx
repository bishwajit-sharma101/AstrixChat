import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Scan, ChevronRight, Sparkles, Zap, MessageCircle, Send, Cpu, Activity, Database, Lock } from "lucide-react";

// ==================================================================================
// 1. THE 3D NEURAL HELIX (Refined for "Containment Field" Look)
// ==================================================================================
const NeuralHelix = () => {
  const points = Array.from({ length: 24 }); // Increased density
  
  return (
    <div className="w-full h-64 flex items-center justify-center relative overflow-hidden">
      {/* Background Scanner Line */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute w-full h-[1px] bg-cyan-500/30 blur-[2px] z-0"
      />
      
      <div className="relative" style={{ perspective: '1000px' }}>
        <motion.div 
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          {points.map((_, i) => {
            const angle = (i / points.length) * Math.PI * 6; // Tighter spiral
            const y = (i - points.length / 2) * 10; 
            
            return (
              <React.Fragment key={i}>
                {/* Cyan Strand */}
                <motion.div
                  className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee]"
                  style={{ transform: `rotateY(${angle}rad) translateZ(50px) translateY(${y}px)` }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
                />
                {/* Purple Strand */}
                <motion.div
                  className="absolute w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_15px_#a855f7]"
                  style={{ transform: `rotateY(${angle + Math.PI}rad) translateZ(50px) translateY(${y}px)` }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
                />
                {/* Connector Beam */}
                <div 
                  className="absolute h-[1px] bg-gradient-to-r from-cyan-500/10 via-white/20 to-purple-500/10"
                  style={{ width: '100px', transform: `rotateY(${angle}rad) translateY(${y}px)`, transformStyle: 'preserve-3d' }}
                />
              </React.Fragment>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

// ==================================================================================
// 2. MAIN COMPONENT: RIGHT DRAWER
// ==================================================================================
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
  const scrollRef = useRef(null);
  
  // Comment Input State
  const [commentInput, setCommentInput] = useState("");

  const isThinking = aiProcessing || localThinking;

  // --- Typewriter Effect ---
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
      // Auto-scroll to bottom as text generates
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      if (i >= aiReply.length) clearInterval(interval);
    }, 15); // Slightly faster for responsiveness
    return () => clearInterval(interval);
  }, [aiReply, mode]);

  // --- Simulate Analysis ---
  const runScan = () => {
    setLocalThinking(true);
    setCards([]);
    setTimeout(() => {
      setCards([
        "Draft a formal rebuttal.",
        "Summarize the key conflict.",
        "Suggest a diplomatic response.",
        "Translate to French."
      ]);
      setLocalThinking(false);
    }, 2000);
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
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 35 }}
      className="w-full h-full flex flex-col overflow-hidden bg-[#030305] relative"
    >
      {/* BACKGROUND FX */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 blur-[100px] pointer-events-none" />

      {/* ==================== 
          HEADER 
         ==================== */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between relative z-10 bg-[#030305]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${mode === 'ai' ? 'bg-brand-500/10 text-brand-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            {mode === 'ai' ? <Bot size={16} /> : <MessageCircle size={16} />}
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">
              {mode === 'ai' ? 'Neural Engine' : 'Context Log'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isThinking ? 'bg-brand-400' : 'bg-green-500'}`} />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                {isThinking ? "PROCESSING STREAM..." : "SYSTEM READY"}
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* ==================== 
          CONTENT: AI MODE 
         ==================== */}
      {mode === 'ai' && (
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar relative z-10 flex flex-col" ref={scrollRef}>
          <AnimatePresence mode="wait">
            
            {/* STATE 1: THINKING (HELIX) */}
            {isThinking ? (
              <motion.div 
                key="thinking"
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-500/10 blur-[50px] rounded-full" />
                    <NeuralHelix />
                </div>
                
                <div className="mt-8 text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full">
                    <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />
                    <span className="text-[10px] font-mono text-brand-300 uppercase tracking-widest">Deciphering Matrix</span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                    Analyzing semantic patterns and historical context...
                  </p>
                </div>
              </motion.div>
            ) : (
              
              /* STATE 2: RESULTS */
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* The Answer Card */}
                {typedReply && (
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-[#050508] border border-white/10 p-6 rounded-2xl">
                        {/* Header Badge */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-2 text-brand-400">
                                <Zap size={14} fill="currentColor" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Core Intelligence</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-600">v4.0.2</span>
                        </div>
                        
                        {/* Content */}
                        <div className="text-sm text-slate-200 leading-relaxed font-light tracking-wide whitespace-pre-wrap">
                            {typedReply}
                            <span className="inline-block w-1.5 h-4 ml-1 bg-brand-500 align-middle animate-pulse"/>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 flex gap-2">
                            <button className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors border border-white/5">Copy</button>
                            <button className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors border border-white/5">Refine</button>
                        </div>
                    </div>
                  </div>
                )}

                {/* Suggestion Cards (Data Shards) */}
                {cards.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3 mb-4">
                      <span className="h-px w-8 bg-slate-800" /> 
                      Strategic Options
                      <span className="h-px flex-1 bg-slate-800" />
                    </h4>
                    
                    {cards.map((c, i) => (
                      <motion.button 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => onCardSelect(c)} 
                        className="w-full text-left p-4 bg-gradient-to-r from-white/[0.02] to-transparent hover:from-brand-500/[0.05] border border-white/5 hover:border-brand-500/30 rounded-xl group transition-all duration-300 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full group-hover:bg-brand-400 transition-colors" />
                            <span className="text-xs text-slate-300 group-hover:text-white transition-colors font-medium">{c}</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-700 group-hover:text-brand-400 transform group-hover:translate-x-1 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Empty State / Trigger */}
                {!typedReply && cards.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[50vh]">
                     <button 
                        onClick={runScan} 
                        className="relative group p-8 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500"
                     >
                        <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Scan size={32} className="text-slate-400 group-hover:text-white relative z-10 transition-colors" />
                     </button>
                     <p className="mt-6 text-xs text-slate-500 font-mono uppercase tracking-widest text-center">
                        Initiate Context Scan
                     </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ==================== 
          CONTENT: COMMENTS MODE 
         ==================== */}
      {mode === 'comments' && activePost && (
        <div className="flex-1 flex flex-col h-full bg-[#030305]">
          
          {/* Context Snippet */}
          <div className="p-5 bg-[#08080c] border-b border-white/5">
             <div className="flex items-center gap-3 mb-3">
                <img src={activePost.author.avatar} className="w-6 h-6 rounded-full border border-white/10" alt="OP" />
                <span className="text-xs font-bold text-white">{activePost.author.name}</span>
             </div>
             <div className="pl-3 border-l-2 border-slate-700">
                <p className="text-xs text-slate-400 line-clamp-2 italic font-serif">"{activePost.content.original}"</p>
             </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
             {(!activePost.commentsList || activePost.commentsList.length === 0) ? (
                <div className="text-center py-20 opacity-30">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle size={24} />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest">No data found in log</p>
                </div>
             ) : (
                activePost.commentsList.map((c, i) => (
                   <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-3"
                   >
                      <img src={c.avatar} className="w-7 h-7 rounded-full mt-1 border border-white/10 bg-white/5" alt="user" />
                      <div className="flex-1">
                         <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl rounded-tl-sm hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-baseline mb-1">
                               <span className="text-xs font-bold text-slate-200">{c.user}</span>
                               <span className="text-[9px] font-mono text-slate-600">{c.time}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{c.text}</p>
                         </div>
                      </div>
                   </motion.div>
                ))
             )}
          </div>

          {/* Input */}
          <div className="p-5 border-t border-white/5 bg-[#030305]">
             <form onSubmit={handleSendComment} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <input
                   type="text"
                   value={commentInput}
                   onChange={(e) => setCommentInput(e.target.value)}
                   placeholder="Inject comment into stream..."
                   className="relative w-full bg-[#08080c] border border-white/10 text-white rounded-xl pl-4 pr-12 py-3.5 text-xs focus:outline-none placeholder:text-slate-600 transition-colors"
                />
                <button 
                   type="submit" 
                   disabled={!commentInput.trim()} 
                   className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-600 rounded-lg text-white disabled:opacity-0 disabled:scale-90 transition-all hover:bg-brand-500 shadow-lg"
                >
                   <Send size={14} />
                </button>
             </form>
          </div>
        </div>
      )}

      {/* ==================== 
          FOOTER: SYSTEM TELEMETRY (Visual Candy)
         ==================== */}
      {mode === 'ai' && (
        <div className="p-6 border-t border-white/5 bg-[#020203] relative z-20">
          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1">
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Latency</div>
                <div className="flex items-center gap-1 text-[10px] text-green-400 font-mono">
                   <Activity size={10} /> 12ms
                </div>
             </div>
             <div className="space-y-1 border-l border-white/5 pl-4">
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Tokens</div>
                <div className="flex items-center gap-1 text-[10px] text-brand-400 font-mono">
                   <Database size={10} /> 48k
                </div>
             </div>
             <div className="space-y-1 border-l border-white/5 pl-4">
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Security</div>
                <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                   <Lock size={10} /> AES-256
                </div>
             </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

// Simple loader icon placeholder for the file
const Loader2 = ({ className, size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);