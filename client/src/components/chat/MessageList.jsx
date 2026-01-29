import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, CheckCheck, Trash2, Sparkles, Languages, Loader2, FileText, Download } from "lucide-react"; 

// ==================================================================================
// 1. CUSTOM AUDIO PLAYER
// ==================================================================================
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
      flex items-center gap-3 p-2.5 rounded-xl min-w-[220px] select-none transition-all duration-300 border backdrop-blur-md
      ${isOwn 
        ? 'bg-white/10 border-white/20 text-white' 
        : 'bg-black/30 border-white/10 text-cyan-400'}
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
          flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg
          ${isOwn 
            ? 'bg-white text-brand-600 hover:bg-slate-100' 
            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30'}
        `}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 justify-center mr-1">
        <div className={`relative w-full h-1 rounded-full overflow-hidden ${isOwn ? 'bg-white/20' : 'bg-white/10'}`}>
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${isOwn ? 'bg-white shadow-[0_0_10px_white]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className={`flex justify-between text-[9px] font-mono tracking-widest ${isOwn ? 'opacity-80' : 'opacity-60 text-slate-400'}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// 2. MAIN COMPONENT: MESSAGE LIST
// ==================================================================================
export default function MessageList({ messages = [], currentUser = null, targetLang = "none", onDeleteMessage }) {
  const endRef = useRef(null);
  const [localMessages, setLocalMessages] = useState([]);
  const processedIds = useRef(new Set());

  // --- HELPER: Save Translation ---
  const saveTranslationToDB = async (messageId, lang, text) => {
    if (typeof messageId === 'string' && messageId.length < 20) return; 
    try {
      await fetch("http://localhost:5000/api/v1/chat/messages/cache_translation", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}` 
        },
        body: JSON.stringify({ messageId, languageCode: lang, translatedText: text })
      });
    } catch (err) { console.error("Failed to save translation:", err); }
  };

  // --- HELPER: Base64 to Blob URL ---
  function base64ToUrl(base64, mime = "audio/wav") {
    try {
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      return URL.createObjectURL(new Blob([new Uint8Array(byteNumbers)], { type: mime }));
    } catch (e) { return null; }
  }

  // --- SMART MERGE LOGIC ---
  useEffect(() => {
    setLocalMessages((prev) => {
      const prevMap = new Map(prev.map(m => [m.id, m]));

      return messages.map((newMsg) => {
        const id = newMsg._id || newMsg.id;
        const existing = prevMap.get(id);
        
        let dbTranslation = null;
        if (newMsg.content && newMsg.content.translations && targetLang !== 'none') {
           dbTranslation = newMsg.content.translations[targetLang];
        }

        if (existing) {
          const isSameLang = existing._translatedLang === targetLang;
          return {
            ...newMsg,
            isRead: newMsg.isRead !== undefined ? newMsg.isRead : existing.isRead,
            textTranslated: dbTranslation || (isSameLang ? existing.textTranslated : null),
            audioTranslated: isSameLang ? existing.audioTranslated : null, 
            _translatedLang: dbTranslation ? targetLang : (isSameLang ? existing._translatedLang : null),
            _translatingText: isSameLang ? existing._translatingText : false,
            _translatingAudio: isSameLang ? existing._translatingAudio : false,
            audioOriginal: newMsg.audioOriginal || existing.audioOriginal,
            attachmentUrl: newMsg.attachmentUrl || existing.attachmentUrl, // Preserve attachment URL
            attachmentType: newMsg.attachmentType || existing.attachmentType
          };
        }
        return {
            ...newMsg,
            textTranslated: dbTranslation || null,
            _translatedLang: dbTranslation ? targetLang : null
        };
      });
    });
  }, [messages, targetLang]);

  // --- AUTO SCROLL ---
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [localMessages]);

  const updateMessageById = (id, patch) => {
    setLocalMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  // --- TRANSLATION LOGIC ---
  useEffect(() => {
    if (!localMessages || localMessages.length === 0) return;

    localMessages.forEach(async (m) => {
      if (!targetLang || targetLang === "none") return;

      const sessionKey = `${m.id}-${targetLang}`;
      if (m._translatedLang === targetLang && (m.textTranslated || m.audioTranslated)) return; 
      if (processedIds.current.has(sessionKey)) return;

      // 1. Text Translation
      // Skip if it's a placeholder text like "📷 Image"
      const originalText = m.content?.original || m.textOriginal;
      const isMediaPlaceholder = ["📷 Image", "🎥 Video", "🎤 Voice Message", "📁 Attachment"].includes(originalText);
      
      if (originalText && !isMediaPlaceholder && !m.textTranslated && !m._translatingText) {
        processedIds.current.add(sessionKey);
        updateMessageById(m.id, { _translatingText: true });
        
        try {
          const res = await fetch("http://127.0.0.1:7861/translate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: originalText, target_lang: targetLang }),
          });
          const data = await res.json();
          const translatedResult = data.translation || data.translation_text;

          updateMessageById(m.id, {
            textTranslated: translatedResult || null,
            _translatedLang: targetLang,
            _translatingText: false,
          });

          if (translatedResult) saveTranslationToDB(m.id, targetLang, translatedResult);

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
            const formData = new FormData();
            formData.append("audio", m.audioOriginalBlob, "input.webm");
            formData.append("target_lang", targetLang);

            const resp = await fetch("http://127.0.0.1:7861/translate_voice", { method: "POST", body: formData });
            if (!resp.ok) throw new Error(`Status ${resp.status}`);
            const data = await resp.json();
            
            let translatedURL = null;
            let translatedText = data.translated_text || data.translation || data.transcription;

            if (data.audio_file) translatedURL = `http://127.0.0.1:7861/file/${data.audio_file}`;
            else if (data.translated_audio_base64) translatedURL = base64ToUrl(data.translated_audio_base64);

            updateMessageById(m.id, {
               audioTranslated: translatedURL,
               textTranslated: translatedText || m.textTranslated,
               _translatedLang: targetLang,
               _translatingAudio: false
            });

            if (translatedText) saveTranslationToDB(m.id, targetLang, translatedText);

         } catch (err) {
            updateMessageById(m.id, { _translatingAudio: false });
            processedIds.current.delete(audioKey);
         }
      }
    });
  }, [localMessages, targetLang]);

  // --- RENDER ---
  return (
    <div className="flex flex-col gap-4 w-full px-2 pb-4">
      <AnimatePresence initial={false}>
        {localMessages.map((m) => {
          const own = !!m.fromMe;
          
          const hasAudioOriginal = !!m.audioOriginal;
          const hasAudioTranslated = !!m.audioTranslated;
          const hasImage = m.attachmentType === 'image' && m.attachmentUrl;
          const hasVideo = m.attachmentType === 'video' && m.attachmentUrl;
          const hasFile = m.attachmentType === 'file' && m.attachmentUrl;
          
          const displayOriginal = m.content?.original || m.textOriginal || "";
          // Don't show text if it's just the placeholder for media
          const isMediaPlaceholder = ["📷 Image", "🎥 Video", "🎤 Voice Message", "📁 Attachment"].includes(displayOriginal);
          const showText = !isMediaPlaceholder && displayOriginal;
          
          const currentTranslation = m.textTranslated;

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex w-full group ${own ? 'justify-end' : 'justify-start'}`}
            >
              {own && (
                <button onClick={() => onDeleteMessage(m.id)} className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 mr-2 text-slate-500 hover:text-red-400 self-center hover:bg-white/5 rounded-full" title="Delete Message">
                  <Trash2 size={16} />
                </button>
              )}

              <div className={`relative px-5 py-4 rounded-3xl backdrop-blur-xl border transition-all duration-500 shadow-xl overflow-hidden
                  ${own ? 'bg-brand-600/20 border-brand-500/30 text-white rounded-tr-sm shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'bg-[#050508]/60 border-white/10 text-slate-200 rounded-tl-sm hover:border-white/20'}
                  ${hasAudioOriginal ? 'min-w-[260px]' : 'max-w-[75%] md:max-w-[60%]'}
                `}>
                
                {/* --- 1. IMAGE RENDERING --- */}
                {hasImage && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/10 relative">
                        <img src={m.attachmentUrl} alt="Attachment" className="max-w-full h-auto object-cover max-h-[400px]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                            <a href={m.attachmentUrl} download="image.png" className="p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40"><Download size={16}/></a>
                        </div>
                    </div>
                )}

                {/* --- 2. VIDEO RENDERING --- */}
                {hasVideo && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                        <video src={m.attachmentUrl} controls className="max-w-full h-auto max-h-[400px]" />
                    </div>
                )}

                {/* --- 3. AUDIO CONTENT --- */}
                {(hasAudioOriginal || hasAudioTranslated) ? (
                  <div className="flex flex-col gap-3">
                    {hasAudioOriginal && (own || !hasAudioTranslated) && (
                      <div className="relative">
                         <div className="text-[9px] font-mono uppercase tracking-widest opacity-50 mb-1 ml-1 flex items-center gap-1">
                            <Languages size={10}/> Original Signal
                         </div>
                         <CustomAudioPlayer src={m.audioOriginal} isOwn={own} />
                      </div>
                    )}
                    {!own && hasAudioTranslated && (
                      <div className="relative">
                          {hasAudioOriginal && <div className="h-px w-full bg-white/5 my-2" />}
                          <div className="text-[9px] text-cyan-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1 font-bold animate-pulse"><Sparkles size={10}/> Neural Translation</div>
                          <CustomAudioPlayer src={m.audioTranslated} isOwn={false} />
                      </div>
                    )}
                    {currentTranslation && !own && <div className="mt-1 px-2 py-1.5 rounded bg-black/20 border border-white/5 text-sm italic text-slate-300">"{currentTranslation}"</div>}
                  </div>
                ) : (
                  // --- TEXT CONTENT ---
                  <div className="flex flex-col">
                    {(own || targetLang === "none") ? (
                      showText && <div className="text-[15px] leading-[1.6] tracking-wide font-light whitespace-pre-wrap">{displayOriginal}</div>
                    ) : (
                      <>
                        {currentTranslation ? (
                          <>
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Source</span>
                                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-400">Translated</span>
                            </div>
                            <div className="text-slate-500 text-xs mb-3 opacity-60 line-through decoration-slate-600/50">{displayOriginal}</div>
                            <div className="text-[15px] leading-[1.6] font-medium text-white drop-shadow-sm">{currentTranslation}</div>
                          </>
                        ) : (
                          showText && (
                              <div className="flex flex-col gap-2">
                                  <div className="text-[15px] leading-[1.6] opacity-50 blur-[2px] select-none">{displayOriginal}</div>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 animate-pulse uppercase tracking-[0.2em]"><Loader2 size={10} className="animate-spin"/> Decrypting Language...</div>
                              </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* METADATA FOOTER */}
                <div className={`flex items-center gap-2 mt-2 pt-1 ${own ? 'justify-end border-t border-white/10' : 'justify-start border-t border-white/5'}`}>
                  <span className="text-[9px] font-mono opacity-50 tracking-widest uppercase">{m.ts || new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  {own && <span className="flex items-center" title={m.isRead ? "Read" : "Sent"}>{m.isRead ? <CheckCheck size={14} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" /> : <Check size={14} className="text-slate-500" />}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={endRef} className="h-4" />
    </div>
  );
}