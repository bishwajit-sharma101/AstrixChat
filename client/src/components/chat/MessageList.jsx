import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";

export default function MessageList({ messages = [], currentUser = null, targetLang = "none" }) {
  const endRef = useRef(null);
  const [localMessages, setLocalMessages] = useState([]);

  useEffect(() => {
    setLocalMessages((prev) => {
      if (!prev || prev.length === 0) return messages.slice();
      if (messages.length >= prev.length) {
        if (messages.length > prev.length) {
          const appended = messages.slice(prev.length);
          return [...prev, ...appended];
        }
        return messages.slice();
      }
      return messages.slice();
    });
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const updateMessageById = (id, patch) => {
    setLocalMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  // -----------------------------------------
  // Convert base64 → Blob → URL
  // -----------------------------------------
  function base64ToUrl(base64, mime = "audio/wav") { // Changed default mime to audio/wav for TTS
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


  // Receiver-side translation logic
  useEffect(() => {
    if (!localMessages || localMessages.length === 0) return;

    localMessages.forEach(async (m) => {
      if (m.fromMe) return;
      if (!targetLang || targetLang === "none") return;

      // -----------------------------
      // TEXT TRANSLATION
      // -----------------------------
      if (m.textOriginal && !m.textTranslated && !m._translatingText) {
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
          console.error("Receiver text translation failed:", err);
          updateMessageById(m.id, { _translatingText: false });
        }
      }

      // -----------------------------
      // AUDIO TRANSLATION (THE FIXED PART)
      // -----------------------------
      // Only trigger if audioOriginalBlob is present (meaning raw audio was received)
      if (m.audioOriginalBlob && !m.audioTranslated && !m._translatingAudio) {
        updateMessageById(m.id, { _translatingAudio: true });

        try {
          const audioBlob = m.audioOriginalBlob;

          if (!audioBlob) {
            updateMessageById(m.id, { _translatingAudio: false });
            return;
          }

          const formData = new FormData();
          
          // 🎯 FIX APPLIED: Changed "audio_file" to "audio" to match backend endpoint parameter
          formData.append("audio", audioBlob, "input.webm"); 
          formData.append("target_lang", targetLang);

          // 🔎 DEBUG LOGS ADDED
          for (let pair of formData.entries()) {
            console.log("--- FormData Entry (Audio Fix) ---", pair[0], pair[1]);
          }
          console.log("--- Sending target_lang ---", targetLang);
          // ------------------------------------

          const resp = await fetch("http://127.0.0.1:7861/translate_voice", {
            method: "POST",
            body: formData,
          });

          if (!resp.ok) {
            const errorBody = await resp.text();
            console.error("Audio translation non-ok response:", resp.status, errorBody);
            throw new Error(`Audio translation failed with status ${resp.status}`);
          }

          const data = await resp.json();

          let translatedURL = null;
          let translatedText = data.translated_text || data.translation || data.transcription || null; // Added transcription fallback

          // Check for server-side generated file URL first, then fallback to base64
          if (data.audio_file) {
            translatedURL = `http://127.0.0.1:7861/file/${data.audio_file}`;
          } else if (data.translated_audio_base64) {
            translatedURL = base64ToUrl(data.translated_audio_base64);
          }

          updateMessageById(m.id, {
            audioTranslated: translatedURL,
            textTranslated: translatedText || m.textTranslated || null,
            audioOriginal: null,
            audioOriginalBlob: null,
            _translatingAudio: false,
          });
        } catch (err) {
          console.error("Receiver audio translation error:", err);
          updateMessageById(m.id, { _translatingAudio: false });
        }
      }
    });
  }, [localMessages, targetLang]);

  // -----------------------------------------
  // RENDER UI (UNCHANGED)
  // -----------------------------------------
  return (
    <div className="flex flex-col gap-6 w-full">
      <AnimatePresence initial={false}>
        {localMessages.map((m) => {
          const own = !!m.fromMe;

          const hasAudioOriginal = !!m.audioOriginal;
          const hasAudioTranslated = !!m.audioTranslated;
          const hasTextOriginal = !!m.textOriginal;
          const hasTextTranslated = !!m.textTranslated;

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={`flex w-full ${own ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  relative max-w-[75%] p-4 rounded-3xl backdrop-blur-sm border
                  ${own 
                    ? 'bg-gradient-to-br from-brand-600 to-indigo-700 border-white/10 text-white rounded-tr-sm' 
                    : 'bg-white/5 border-white/5 text-slate-200 rounded-tl-sm'
                  }
                `}
              >
                {(hasAudioOriginal || hasAudioTranslated) ? (
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    {own && hasAudioOriginal && (
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-white/20">
                          <Play size={20} className="fill-current" />
                        </div>
                        <audio controls className="w-full h-8 opacity-90">
                          <source src={m.audioOriginal} />
                        </audio>
                      </div>
                    )}

                    {!own && hasAudioTranslated && (
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-indigo-600/20">
                          <Play size={20} className="fill-current" />
                        </div>
                        <audio controls className="w-full h-8 opacity-95">
                          <source src={m.audioTranslated} />
                        </audio>
                      </div>
                    )}

                    {!own && !hasAudioTranslated && hasAudioOriginal && (
                      <div className="text-xs text-slate-400 italic">Translating audio...</div>
                    )}

                    {hasTextTranslated && (
                      <div className="text-[14px] mt-1 opacity-90 text-slate-200">
                        {m.textTranslated}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[15px]">
                    {own && hasTextOriginal && <div>{m.textOriginal}</div>}

                    {!own && hasTextOriginal && hasTextTranslated && (
                      <>
                        <div className="text-slate-400 text-sm mb-1 opacity-60">{m.textOriginal}</div>
                        <div className="font-medium">{m.textTranslated}</div>
                      </>
                    )}

                    {!own && hasTextOriginal && !hasTextTranslated && (
                      <>
                        <div className="text-slate-400 text-sm mb-1 opacity-60">{m.textOriginal}</div>
                        <div className="italic text-sm opacity-70">Translating...</div>
                      </>
                    )}
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