import React, { useState, useRef } from "react";
import { Mic, Send, Paperclip, Smile } from "lucide-react"; 
import { motion } from "framer-motion";

export default function MessageInput({ onSend, targetLang }) {
  const [msg, setMsg] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const handleSend = () => {
    if (!msg.trim()) return;
    // Pass the message AND the selected target language
    onSend(msg.trim(), targetLang);
    setMsg("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      setIsRecording(true);
      setMsg(""); 

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        setIsRecording(false);
        // Pass the audio Blob AND the selected target language
        onSend(blob, targetLang);
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  };

  return (
    <div className="relative">
      <div className={`
        relative flex items-center gap-2 p-2 rounded-2xl border transition-all duration-300
        ${isRecording 
          ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
          : 'bg-white/5 border-white/10 focus-within:bg-black/40 focus-within:border-brand-500/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.1)]'
        }
      `}>
        
        {/* LEFT ACTIONS */}
        <div className="flex gap-1 ml-2 text-slate-400">
          <button className="p-2 hover:text-white transition" disabled={isRecording}><Paperclip size={20} /></button>
          <button className="p-2 hover:text-white transition" disabled={isRecording}><Smile size={20} /></button>
        </div>

        {/* INPUT AREA */}
        <input
          value={isRecording ? "🔴 RECORDING... Say your message." : msg}
          onChange={(e) => !isRecording && setMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Message in ${targetLang === 'en' ? 'English' : targetLang}...`}
          disabled={isRecording}
          className={`
            flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 outline-none font-light 
            ${isRecording ? 'animate-pulse text-red-400' : ''}
          `}
        />

        {/* RIGHT ACTIONS */}
        <div className="flex gap-2 mr-1">
          {/* MIC BUTTON */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            className={`
              p-3 rounded-xl transition-all flex items-center justify-center relative
              ${isRecording 
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/40 animate-[pulse_1.5s_infinite]' 
                : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }
            `}
          >
            <Mic size={20} />
          </motion.button>

          {/* SEND BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!msg.trim()}
            className={`
              p-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 transition-opacity
              ${msg.trim() ? 'opacity-100' : 'opacity-50 pointer-events-none'}
            `}
          >
            <Send size={20} className={msg.trim() ? "fill-white/20" : ""} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}