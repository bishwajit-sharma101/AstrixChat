import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { X, Bot, Cpu, Scan } from "lucide-react";

export default function RightDrawer({
  visible = true,
  chat = null,
  aiReply = "",
  onClose = () => {},
  onCardSelect = () => {}, // 👈 you will use this to insert text into input
}) {

  const safeChat = chat || { id: null, name: "No conversation", avatar: null };

  const controls = useAnimation();
  const [scanProgress, setScanProgress] = useState(0);
  const [cards, setCards] = useState([]);

  // ---------------- TYPEWRITER FOR AI RESPONSE ----------------
  const [typedReply, setTypedReply] = useState("");

  useEffect(() => {
    if (!aiReply) {
      setTypedReply("");
      return;
    }

    let i = 0;
    setTypedReply("");

    const interval = setInterval(() => {
      setTypedReply(aiReply.slice(0, i + 1));
      i++;

      if (i >= aiReply.length) clearInterval(interval);
    }, 15);

    return () => clearInterval(interval);

  }, [aiReply]);

  // ---------------- DRAWER ANIMATION ----------------
  useEffect(() => {
    if (!visible) return;

    controls.start({ opacity: 1, x: 0 });

    const t = setInterval(() => {
      setScanProgress((p) => (p >= 100 ? 0 : p + Math.random() * 4));
    }, 500);

    return () => clearInterval(t);

  }, [visible]);

  if (!visible) return null;

  // ---------------- SCAN BUTTON HANDLER ----------------
  const runScan = () => {
    if (!chat?.messages?.length) return;

    const lastMsgs = chat.messages.slice(-6).map((m) => m.text);

    const generated = [
      "Ask them to clarify something deeper.",
      "Respond with empathy about their last message.",
      "Continue the topic but with a twist—add curiosity.",
      "Ask a related follow-up to keep the flow alive.",
      "Share something small about yourself to balance the chat.",
    ];

    setCards(generated);
  };

  return (
    <motion.aside
      initial={{ x: 340, opacity: 0 }}
      animate={controls}
      exit={{ x: 340, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="w-[360px] h-screen sticky top-0 p-5 bg-[#020205]/80 backdrop-blur-md border-l border-[#0b1220] shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] overflow-y-auto text-slate-200"
    >

      {/* HEADER */}
      <div className="flex items-start justify-between mb-4">
        
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#071025] to-[#001018] border border-[#0b2b3a] flex items-center justify-center">
            <Bot size={22} className="text-[#66ffee]" />
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              ASTRiX • AI Coach
            </div>
            <div className="text-sm font-semibold tracking-wide">
              {safeChat.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SCAN BUTTON */}
          <button
            onClick={runScan}
            className="px-3 py-[6px] rounded-md bg-[#041018] border border-[#0b2430] hover:bg-white/5 text-xs flex items-center gap-1"
          >
            <Scan size={14} /> Scan
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/5 transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* LIVE SIGNAL CARD */}
      <div className="relative mb-6 mx-auto w-full">
        <div className="relative z-10 bg-[#061018]/60 border border-[#0e1a26] rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Cpu size={14} /> Live Signal
            </div>
            <div className="text-[11px] text-slate-500">Latency: 120ms</div>
          </div>

          <div className="relative h-2 bg-[#031018] rounded-full overflow-hidden border border-[#0b2632]">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00ffd5] via-[#66ffb3] to-[#7b61ff]"
              style={{ width: `${Math.min(scanProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* CENTERED CARDS */}
      {cards.length > 0 && (
        <div className="flex flex-col items-center gap-3 mb-6">
          {cards.map((c, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              onClick={() => onCardSelect(c)}
              className="w-[90%] p-3 bg-[#041018] border border-[#0b2430] rounded-lg text-left shadow-md hover:bg-[#071b26]"
            >
              <div className="text-sm text-slate-200">{c}</div>
            </motion.button>
          ))}
        </div>
      )}

      {/* AI REPLY BOX */}
      {typedReply && (
        <div className="mb-4 bg-[#050b13]/70 border border-[#0d1824] p-4 rounded-lg shadow-inner">
          <div className="text-[11px] text-slate-400 uppercase tracking-widest mb-2">
            ASTRiX • Response
          </div>

          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {typedReply}
          </div>
        </div>
      )}

      <div className="text-[11px] text-slate-500 font-mono mt-6">
        ASTRiX • v0.4 • local-first • E2EE-ready
      </div>
    </motion.aside>
  );
}
