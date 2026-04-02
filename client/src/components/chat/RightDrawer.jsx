import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Scan, ChevronRight, Sparkles, Zap, MessageCircle, Send, Activity, Database, Lock, ShieldAlert, Heart, Briefcase, Flame, MessageSquare, Search, PowerOff } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

// ==================================================================================
// 1. THE 3D NEURAL HELIX
// ==================================================================================
const NeuralHelix = () => {
  const points = Array.from({ length: 24 });
  return (
    <div className="w-full h-64 flex items-center justify-center relative overflow-hidden">
      <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute w-full h-[1px] bg-cyan-500/30 blur-[2px] z-0" />
      <div className="relative" style={{ perspective: '1000px' }}>
        <motion.div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }} animate={{ rotateY: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
          {points.map((_, i) => {
            const angle = (i / points.length) * Math.PI * 6;
            const y = (i - points.length / 2) * 10; 
            return (
              <React.Fragment key={i}>
                <motion.div className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee]" style={{ transform: `rotateY(${angle}rad) translateZ(50px) translateY(${y}px)` }} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }} />
                <motion.div className="absolute w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_15px_#a855f7]" style={{ transform: `rotateY(${angle + Math.PI}rad) translateZ(50px) translateY(${y}px)` }} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }} />
                <div className="absolute h-[1px] bg-gradient-to-r from-cyan-500/10 via-white/20 to-purple-500/10" style={{ width: '100px', transform: `rotateY(${angle}rad) translateY(${y}px)`, transformStyle: 'preserve-3d' }} />
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
  mode = "ai", 
  onClose = () => {},
  chat = null,
  aiReply = "",
  aiProcessing = false,
  activePost = null,
  onAddComment = () => {},
}) {
  const scrollRef = useRef(null);
  
  // States
  const [commentInput, setCommentInput] = useState("");
  const [scanState, setScanState] = useState("idle"); // idle, permission, modes, processing, results
  const [localAiReply, setLocalAiReply] = useState("");
  const [typedReply, setTypedReply] = useState("");
  const [activeCoach, setActiveCoach] = useState(null); // Tracks the continuously active coach persona

  const isThinking = aiProcessing || scanState === "processing";

  // Watch external AI Reply (from @ash)
  useEffect(() => {
    if (aiProcessing) setScanState("processing");
    else if (aiReply) {
       setLocalAiReply(aiReply);
       setScanState("results");
    }
  }, [aiReply, aiProcessing]);

  // (Removed continuous auto-fetch effect. It now only tracks activeCoach natively, requiring manual 'Re-Analyze')

  // Typewriter
  useEffect(() => {
    if (mode !== 'ai' || !localAiReply) { setTypedReply(""); return; }
    let i = 0;
    setTypedReply("");
    const interval = setInterval(() => {
      setTypedReply(localAiReply.slice(0, i + 1));
      i++;
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      if (i >= localAiReply.length) clearInterval(interval);
    }, 15); 
    return () => clearInterval(interval);
  }, [localAiReply, mode]);

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !activePost) return;
    onAddComment(activePost.id, commentInput);
    setCommentInput("");
  };

  const handleCoachSelect = async (persona, isSilentReRun = false) => {
      if (!isSilentReRun) {
         setScanState("processing");
         setLocalAiReply("");
         setActiveCoach(persona);
      }

      // Compile Context
      let contextStr = "No chat history available. Start texting and I will analyze the intent.";
      if (chat && chat.messages && chat.messages.length > 0) {
          const msgs = chat.messages.slice(-25); // Last 25 msgs
          contextStr = msgs.map(m => `[${m.fromMe ? 'Me' : 'Other'}]: ${typeof m.content === 'string' ? m.content : m.content.original}`).join('\n');
      }

      let prompt = "Analyze this conversation.";
      if (persona === "Summarize") prompt = "Summarize this conversation briefly, highlighting key points.";
      if (persona === "Love ❤️") prompt = "Act as a dating and relationship coach. Analyze the conversation and suggest a flirty, caring, or appropriate next response for 'Me' to send.";
      if (persona === "Formal 👔") prompt = "Act as a professional executive coach. Suggest a highly formal, polite, and business-appropriate next response for 'Me' to send.";
      if (persona === "GenZ 🛹") prompt = "Act as a Gen-Z communications expert. Suggest a trendy, slang-heavy, casual response for 'Me' to send next. Keep it brief.";
      if (persona === "Debate ⚔️") prompt = "Act as a master debater. Analyze the conversation and suggest a logical, argumentative, and factual counter-point for 'Me' to send.";
      if (persona === "Empathy 🤝") prompt = "Act as an empathetic listener and therapist. Suggest a compassionate, supportive, and emotionally intelligent next response for 'Me' to send.";

      try {
          const token = Cookies.get('token');
          const res = await axios.post("http://localhost:5000/api/v1/ai/analyze-chat", {
              prompt,
              messagesContext: contextStr
          }, { headers: { Authorization: `Bearer ${token}` }});
          
          if (res.data.success) {
              setLocalAiReply(res.data.response);
          } else {
              setLocalAiReply("Neural link failed. Awaiting new data.");
          }
      } catch (err) {
          setLocalAiReply("Core offline. Unable to reach AI modules.");
      } finally {
          if (!isSilentReRun) setScanState("results");
      }
  };

  const handleDisableCoach = () => {
      setActiveCoach(null);
      setLocalAiReply("");
      setScanState("idle");
  };

  if (!visible) return null;

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 35 }}
      className="w-full h-full flex flex-col overflow-hidden bg-[#030305] relative shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/5"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between relative z-10 bg-[#030305]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${mode === 'ai' ? 'bg-brand-500/10 text-brand-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            {mode === 'ai' ? <Bot size={16} /> : <MessageCircle size={16} />}
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{mode === 'ai' ? 'Neural Coach' : 'Context Log'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isThinking ? 'bg-brand-400' : 'bg-green-500'}`} />
               <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{isThinking ? "PROCESSING..." : "SYSTEM READY"}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all"><X size={18} /></button>
      </div>

      {/* AI MODE */}
      {mode === 'ai' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 flex flex-col p-6" ref={scrollRef}>
          <AnimatePresence mode="wait">
            
            {/* STATE 1: IDLE (UPDATED 'COOL' UI) */}
            {scanState === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-[50vh] relative">
                    
                    {/* Background Radar / Scan Effect */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                         <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-64 h-64 border border-brand-500/20 rounded-full border-t-brand-500 relative">
                             <div className="absolute top-0 right-1/2 w-[1px] h-32 bg-gradient-to-b from-brand-500 to-transparent origin-bottom" style={{ transform: 'rotate(45deg)' }} />
                         </motion.div>
                         <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute w-48 h-48 border border-purple-500/10 rounded-full border-b-purple-500" />
                         <motion.div animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute w-20 h-20 bg-brand-500/10 rounded-full blur-xl" />
                    </div>

                    <div className="text-center relative z-10 mb-8 w-full">
                         <Scan size={36} className="text-brand-400 mx-auto mb-4 animate-pulse drop-shadow-[0_0_15px_#22d3ee]" />
                         <h3 className="text-sm font-bold text-white uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-400">Context Scanner</h3>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">{chat?.messages?.length || 0} Data Packets Discovered</p>
                    </div>

                    <button onClick={() => setScanState("permission")} className="relative group px-10 py-4 rounded-full border border-brand-500/30 bg-[#050510] hover:bg-brand-500/10 transition-all duration-500 overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                         <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                         <span className="text-[11px] font-bold text-white uppercase tracking-[0.2em] relative z-10 flex items-center gap-2">
                             Engage AI Module <ChevronRight size={14} className="text-brand-400" />
                         </span>
                    </button>
                    
                    <div className="mt-12 grid grid-cols-2 gap-4 w-full px-4 relative z-10 opacity-60">
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg text-center">
                            <Database size={14} className="text-slate-400 mx-auto mb-1" />
                            <span className="text-[9px] uppercase tracking-widest text-slate-500">History: Linked</span>
                        </div>
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg text-center">
                            <Activity size={14} className="text-slate-400 mx-auto mb-1" />
                            <span className="text-[9px] uppercase tracking-widest text-slate-500">Model: Ready</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* STATE 2: PERMISSION */}
            {scanState === "permission" && (
                <motion.div key="permission" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full py-10">
                    <div className="max-w-xs text-center border border-yellow-500/20 bg-yellow-500/5 p-6 rounded-2xl">
                        <ShieldAlert size={28} className="text-yellow-500 mb-4 mx-auto" />
                        <h3 className="text-sm font-bold text-white mb-2">Grant Privacy Override?</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6">To provide coaching, the underlying AI models must read the contents of this conversation.</p>
                        <div className="flex gap-2">
                             <button onClick={() => setScanState("idle")} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors">Cancel</button>
                             <button onClick={() => setScanState("modes")} className="flex-1 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition-colors">Accept</button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* STATE 3: MODE SELECT */}
            {scanState === "modes" && (
                <motion.div key="modes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                     <button onClick={() => handleCoachSelect("Summarize")} className="w-full relative group overflow-hidden border border-brand-500/30 bg-[#08080c] p-4 rounded-xl flex items-center justify-between hover:bg-brand-500/10 transition-all">
                          <div className="flex items-center gap-3">
                               <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400"><Search size={16}/></div>
                               <span className="text-sm font-bold text-white tracking-wide">Summarize Conversation</span>
                          </div><ChevronRight size={16} className="text-brand-400" />
                     </button>
                     
                     <div className="pt-4 border-t border-white/5 space-y-3">
                         <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2">Communication Coach</h4>
                         
                         {[
                             { id: "Love ❤️", icon: Heart, color: "text-red-400", bg: "bg-red-500/10" },
                             { id: "Formal 👔", icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10" },
                             { id: "GenZ 🛹", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" },
                             { id: "Debate ⚔️", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                             { id: "Empathy 🤝", icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                         ].map(p => (
                             <button key={p.id} onClick={() => handleCoachSelect(p.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all group">
                                  <div className={`p-1.5 rounded-md ${p.bg} ${p.color}`}><p.icon size={14}/></div>
                                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{p.id.split(' ')[0]} Coach</span>
                             </button>
                         ))}
                     </div>
                </motion.div>
            )}

            {/* STATE 4: PROCESSING */}
            {scanState === "processing" && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[400px]">
                    <NeuralHelix />
                    <div className="mt-8 text-center space-y-2">
                        <span className="text-[10px] font-mono text-brand-400 uppercase tracking-widest animate-pulse">Running Neural Models...</span>
                    </div>
                </motion.div>
            )}

            {/* STATE 5: RESULTS */}
            {scanState === "results" && typedReply && (
               <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-cyan-500 rounded-2xl blur opacity-20 transition duration-1000"></div>
                    <div className="relative bg-[#050508] border border-white/10 p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                            <div className="flex items-center gap-2 text-brand-400">
                                <Sparkles size={14} className={activeCoach ? "animate-pulse" : ""} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                   {activeCoach ? `Live Coach: ${activeCoach}` : 'Analysis Matrix'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                               <button onClick={() => setScanState("modes")} className="text-[10px] text-slate-500 hover:text-white uppercase">Switch Mode</button>
                               <button onClick={handleDisableCoach} className="text-[10px] text-red-500 hover:text-red-400 uppercase flex items-center gap-1"><PowerOff size={10}/></button>
                            </div>
                        </div>
                        <div className="text-[13px] text-slate-200 leading-[1.8] font-light whitespace-pre-wrap custom-scrollbar">
                            {typedReply}
                            <span className="inline-block w-1.5 h-4 ml-1 bg-brand-500 align-middle animate-pulse"/>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
                             <button onClick={() => handleCoachSelect(activeCoach)} className="flex-1 py-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30 hover:bg-brand-500 hover:text-black transition-all text-[11px] font-bold uppercase tracking-widest flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                                 <Scan size={12} /> Re-Analyze Context
                             </button>
                        </div>
                    </div>
                  </div>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}

      {/* COMMENTS MODE */}
      {mode === 'comments' && activePost && (
        <div className="flex-1 flex flex-col h-full bg-[#030305]">
          <div className="p-5 bg-[#08080c] border-b border-white/5">
             <div className="flex items-center gap-3 mb-3">
                <img src={activePost.author.avatar} className="w-6 h-6 rounded-full border border-white/10" alt="OP" />
                <span className="text-xs font-bold text-white">{activePost.author.name}</span>
             </div>
             <div className="pl-3 border-l-2 border-slate-700">
                <p className="text-xs text-slate-400 line-clamp-2 italic font-serif">"{activePost.content.original}"</p>
             </div>
          </div>

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
                   <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-3">
                      <img src={c.avatar || (typeof c.user === 'object' && c.user.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${typeof c.user === 'object' ? c.user.name : c.user}`} className="w-7 h-7 rounded-full mt-1 border border-white/10 bg-white/5" alt="user" />
                      <div className="flex-1">
                         <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl rounded-tl-sm hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-baseline mb-1">
                               <span className="text-xs font-bold text-slate-200">{typeof c.user === 'object' ? (c.user.name || "Unknown") : c.user}</span>
                               <span className="text-[9px] font-mono text-slate-600">{c.time}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{c.text}</p>
                         </div>
                      </div>
                   </motion.div>
                ))
             )}
          </div>

          <div className="p-5 border-t border-white/5 bg-[#030305]">
             <form onSubmit={handleSendComment} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Inject comment..." className="relative w-full bg-[#08080c] border border-white/10 text-white rounded-xl pl-4 pr-12 py-3.5 text-xs focus:outline-none placeholder:text-slate-600 transition-colors" />
                <button type="submit" disabled={!commentInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-600 rounded-lg text-white disabled:opacity-0 disabled:scale-90 transition-all hover:bg-brand-500"><Send size={14} /></button>
             </form>
          </div>
        </div>
      )}

      {/* TELEMETRY FOOTER */}
      {mode === 'ai' && (
        <div className="p-4 border-t border-white/5 bg-[#020203] relative z-20">
          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1">
                <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Latency</div>
                <div className="flex items-center gap-1 text-[9px] text-green-400 font-mono"><Activity size={10} /> 12ms</div>
             </div>
             <div className="space-y-1 border-l border-white/5 pl-4">
                <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Model</div>
                <div className="flex items-center gap-1 text-[9px] text-brand-400 font-mono"><Database size={10} /> Hybrid Core</div>
             </div>
             <div className="space-y-1 border-l border-white/5 pl-4">
                <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Security</div>
                <div className="flex items-center gap-1 text-[9px] text-yellow-400 font-mono"><Lock size={10} /> Authorized</div>
             </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}