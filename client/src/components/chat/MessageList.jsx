// src/components/chat/MessageList.jsx
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";

export default function MessageList({ messages = [] }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <AnimatePresence initial={false}>
        {messages.map((m) => {
          const own = !!m.fromMe;
          
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex w-full ${own ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  relative max-w-[75%] p-4 rounded-3xl backdrop-blur-sm border
                  ${own 
                    ? 'bg-gradient-to-br from-brand-600 to-indigo-700 border-white/10 text-white shadow-[0_4px_20px_rgba(79,70,229,0.4)] rounded-tr-sm' 
                    : 'bg-white/5 border-white/5 text-slate-200 rounded-tl-sm shadow-lg'
                  }
                `}
              >
                {/* AUDIO MESSAGE VISUALIZATION */}
                {(m.audio || m.audioUrl) ? (
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className={`p-3 rounded-full ${own ? 'bg-white/20' : 'bg-brand-500/20'}`}>
                      <Play size={20} className="fill-current" />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                       {/* This is the hidden actual audio player, skinned by the visual above */}
                       <audio controls className="w-full h-8 opacity-60 scale-95 origin-left accent-brand-500">
                         <source src={m.audio || m.audioUrl} />
                       </audio>
                    </div>
                  </div>
                ) : (
                  <div className="text-[15px] leading-relaxed tracking-wide font-light">
                    {m.text}
                  </div>
                )}
                
                <div className={`text-[10px] mt-2 opacity-60 font-mono ${own ? 'text-right' : 'text-left'}`}>
                   {m.ts} • ENC-AES256
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}