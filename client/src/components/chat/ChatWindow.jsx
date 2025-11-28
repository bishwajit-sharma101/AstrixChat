"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { MoreVertical, Phone, Video, Sparkles, Languages } from "lucide-react";

// ---------------- LANGUAGE DROPDOWN ----------------
const LanguageDropdown = ({ targetLang, setTargetLang }) => {
  const [open, setOpen] = useState(false);

  const languages = [
    { label: "English", code: "en" },
    { label: "Hindi", code: "hi" },
    { label: "Spanish", code: "es" },
    { label: "French", code: "fr" },
    { label: "Chinese", code: "zh" },
    { label: "Japanese", code: "ja" },
  ];

  const handleClick = (code) => {
    console.log("Selected:", code); // DEBUG: should log for every click
    setTargetLang(code);
    setOpen(false);
  };


useEffect(() => {
  console.log("Current targetLang changed:", targetLang);
}, [targetLang]);

  return (
    <div className="relative z-50 pointer-events-auto">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center gap-2 transition-all"
      >
        <Languages size={22} className="text-brand-400" />
        <span className="font-medium text-slate-200">
          {languages.find((l) => l.code === targetLang)?.label || "English"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-[#0f0f17] border border-white/10 rounded-xl shadow-2xl py-1">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => handleClick(l.code)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                targetLang === l.code
                  ? "bg-brand-500/20 text-brand-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------- HEADER ----------------
const GlassHeader = ({ activeChat, targetLang, setTargetLang }) => (
  <div className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
    <div className="flex items-center gap-4">
      <div className="relative">
        <img
          src={
            activeChat.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.name}`
          }
          className="w-10 h-10 rounded-full ring-2 ring-white/10"
          alt="Avatar"
        />
        <div className="absolute -bottom-1 -right-1 bg-[#050510] rounded-full p-[2px]">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium text-base">{activeChat.name}</h2>
        <div className="text-xs text-brand-400 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-brand-400"></span> Neural Link Active
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <LanguageDropdown targetLang={targetLang} setTargetLang={setTargetLang} />

      <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

      <button className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
        <Phone size={18} />
      </button>
      <button className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
        <Video size={18} />
      </button>
      <button className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
        <MoreVertical size={18} />
      </button>
    </div>
  </div>
);

// ---------------- MAIN CHAT WINDOW ----------------
export default function ChatWindow({ chat, onSend, aiProcessing }) {
  const [targetLang, setTargetLang] = useState("en"); // ALWAYS use codes

  if (!chat)
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500/50">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-white/5 to-transparent flex items-center justify-center mb-4 blur-sm">
          <Sparkles size={40} className="text-white/20" />
        </div>
        <p className="text-lg font-light tracking-wide">Select a constellation to begin.</p>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col relative z-0">
      <GlassHeader activeChat={chat} targetLang={targetLang} setTargetLang={setTargetLang} />

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 relative">
        <div className="max-w-4xl mx-auto py-6 flex flex-col gap-6">
          <MessageList messages={chat.messages} />

          {aiProcessing && (
            <div className="self-start ml-2 mt-2">
              <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-300 px-4 py-2 rounded-full text-xs font-mono shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                PROCESSING AUDIO/TEXT STREAM...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <MessageInput onSend={(msg) => onSend(msg, targetLang)} targetLang={targetLang} />
      </div>
    </div>
  );
}
