import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react"; 

// --- INTERNAL COMPONENT: CUSTOM AUDIO PLAYER ---
const CustomAudioPlayer = ({ src, isOwn }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(curr);
      setProgress(dur > 0 ? (curr / dur) * 100 : 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  return (
    <div className={`
      flex items-center gap-3 p-2 rounded-xl min-w-[200px] select-none transition-colors mt-1
      ${isOwn ? 'bg-black/20 border border-white/10' : 'bg-black/20 border border-white/5'}
    `}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />

      <button
        onClick={togglePlay}
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95
          ${isOwn 
            ? 'bg-white text-brand-600' 
            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'}
        `}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1 justify-center mr-1">
        <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${isOwn ? 'bg-white' : 'bg-cyan-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[8px] font-mono opacity-60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default function MessageList({ messages = [], currentUser = null, targetLang = "none" }) {
  const endRef = useRef(null);
  const [localMessages, setLocalMessages] = useState([]);
  const processedIds = useRef(new Set());

  // --- FIX START: SMART MERGE LOGIC ---
  useEffect(() => {
    setLocalMessages((prev) => {
      // Create a map of existing messages to preserve their translation state
      const prevMap = new Map(prev.map(m => [m.id, m]));

      return messages.map((newMsg) => {
        const existing = prevMap.get(newMsg.id);
        if (existing) {
          // If we already have this message, merge the new data (like ID updates)
          // BUT KEEP the existing translations so we don't re-trigger the API
          return {
            ...newMsg,
            textTranslated: existing.textTranslated || newMsg.textTranslated,
            audioTranslated: existing.audioTranslated || newMsg.audioTranslated,
            // Also preserve internal loading flags to prevent flickering
            _translatingText: existing._translatingText,
            _translatingAudio: existing._translatingAudio
          };
        }
        // If it's brand new, just return it
        return newMsg;
      });
    });
  }, [messages]);
  // --- FIX END ---

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const updateMessageById = (id, patch) => {
    setLocalMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  function base64ToUrl(base64, mime = "audio/wav") {
    try {
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Base64 to URL conversion failed:", e);
      return null;
    }
  }

  // --- TRANSLATION LOGIC ---
  useEffect(() => {
    if (!localMessages || localMessages.length === 0) return;

    localMessages.forEach(async (m) => {
      if (!targetLang || targetLang === "none") return;

      const sessionKey = `${m.id}-${targetLang}`;
      if (processedIds.current.has(sessionKey)) return;

      // 1. Text Translation
      // Added check: If we already have textTranslated, STOP.
      if (m.textOriginal && !m.textTranslated && !m._translatingText) {
        processedIds.current.add(sessionKey);
        updateMessageById(m.id, { _translatingText: true });
        
        try {
          const res = await fetch("http://127.0.0.1:7861/translate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: m.textOriginal,
              target_lang: targetLang,
            }),
          });
          const data = await res.json();
          updateMessageById(m.id, {
            textTranslated: data.translation || data.translation_text || null,
            _translatingText: false,
          });
        } catch (err) {
          updateMessageById(m.id, { _translatingText: false });
          processedIds.current.delete(sessionKey);
        }
      }

      // 2. Audio Translation
      if (m.audioOriginalBlob && !m.audioTranslated && !m._translatingAudio) {
        const audioKey = `${m.id}-audio-${targetLang}`;
        if (processedIds.current.has(audioKey)) return;
        processedIds.current.add(audioKey);

        updateMessageById(m.id, { _translatingAudio: true });

        try {
          const audioBlob = m.audioOriginalBlob;
          const formData = new FormData();
          formData.append("audio", audioBlob, "input.webm"); 
          formData.append("target_lang", targetLang);

          const resp = await fetch("http://127.0.0.1:7861/translate_voice", {
            method: "POST",
            body: formData,
          });

          if (!resp.ok) throw new Error(`Status ${resp.status}`);
          const data = await resp.json();
          let translatedURL = null;
          let translatedText = data.translated_text || data.translation || data.transcription;

          if (data.audio_file) {
            translatedURL = `http://127.0.0.1:7861/file/${data.audio_file}`;
          } else if (data.translated_audio_base64) {
            translatedURL = base64ToUrl(data.translated_audio_base64);
          }

          updateMessageById(m.id, {
            audioTranslated: translatedURL,
            textTranslated: translatedText || m.textTranslated,
            _translatingAudio: false,
          });
        } catch (err) {
          updateMessageById(m.id, { _translatingAudio: false });
          processedIds.current.delete(audioKey);
        }
      }
    });
  }, [localMessages, targetLang]);

  // --- RENDER ---
  return (
    <div className="flex flex-col gap-3 w-full px-4">
      <AnimatePresence initial={false}>
        {localMessages.map((m) => {
          const own = !!m.fromMe;
          const hasAudioOriginal = !!m.audioOriginal;
          const hasAudioTranslated = !!m.audioTranslated;
          const displayOriginal = m.content?.original || m.textOriginal || "";
          const currentTranslation = m.textTranslated;

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full ${own ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  relative px-4 py-2.5 rounded-2xl backdrop-blur-md border transition-all duration-500
                  ${own 
                    ? 'bg-brand-600/20 border-brand-500/30 text-white rounded-tr-none max-w-[65%]' 
                    : 'bg-white/5 border-white/10 text-slate-200 rounded-tl-none max-w-[65%]'
                  }
                `}
              >
                {(hasAudioOriginal || hasAudioTranslated) ? (
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    {/* ORIGINAL AUDIO */}
                    {hasAudioOriginal && (own || !hasAudioTranslated) && (
                      <CustomAudioPlayer src={m.audioOriginal} isOwn={own} />
                    )}

                    {/* TRANSLATED AUDIO */}
                    {!own && hasAudioTranslated && (
                      <>
                         {hasAudioOriginal && <div className="h-[1px] w-full bg-white/5 my-1" />}
                         <div className="text-[9px] text-cyan-400 uppercase tracking-widest ml-1">Translation</div>
                         <CustomAudioPlayer src={m.audioTranslated} isOwn={false} />
                      </>
                    )}
                    
                    {/* LOADING STATE */}
                    {!own && !hasAudioTranslated && targetLang !== 'none' && (
                       <div className="text-[9px] font-mono text-cyan-400 animate-pulse mt-1 ml-1">PROCESSING VOICE...</div>
                    )}
                    
                    {/* TRANSCRIBED TEXT */}
                    {currentTranslation && !own && (
                       <div className="text-sm mt-1 opacity-90 italic">"{currentTranslation}"</div>
                    )}
                  </div>
                ) : (
                  // TEXT CONTENT
                  <div className="flex flex-col">
                    {(own || targetLang === "none") ? (
                      <div className="text-[14px] leading-[1.5] tracking-tight font-light whitespace-pre-wrap">
                        {displayOriginal}
                      </div>
                    ) : (
                      <>
                        {currentTranslation ? (
                          <>
                            <div className="text-slate-500 text-[11px] mb-1.5 border-b border-white/5 pb-1 font-mono uppercase tracking-tighter">Original Trace</div>
                            <div className="text-slate-400 text-[13px] mb-2 opacity-60 italic">{displayOriginal}</div>
                            <div className="text-[14px] leading-[1.5] tracking-tight font-light">{currentTranslation}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-slate-400 text-[13px] mb-2 opacity-60 italic">{displayOriginal}</div>
                            <div className="text-[11px] font-mono text-brand-400 animate-pulse uppercase tracking-[0.2em]">Analyzing Frequency...</div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className={`text-[8px] mt-1.5 opacity-30 font-mono tracking-widest ${own ? 'text-right' : 'text-left'}`}>
                  {m.ts} // E2EE
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