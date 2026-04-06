const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const { TRANSLATION_SYSTEM_PROMPT } = require("../../../utils/geminiPrompt");

// 1. ADD THIS: Import the Message model to save translations
const Message = require("../../../modules/chat/models/message.model"); 

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/", async (req, res) => {
  // 2. Extract context from body
  const { text, target_lang, messageId, context } = req.body;

  if (!text || !target_lang) {
    return res.status(400).json({
      success: false,
      error: "text and target_lang are required",
    });
  }

  try {
    const startTime = Date.now();
    
    // --- Format Context for Prompt ---
    const historyText = context && context.length > 0 
      ? context.map(c => `[${c.role}]: "${c.text}"`).join("\n")
      : "No prior conversation history.";

    console.log(`[Gemini Translator] 🚀 Calling gemini-2.5-flash with Context (${context?.length || 0} msgs)...`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      systemInstruction: TRANSLATION_SYSTEM_PROMPT,
      contents: [
        { 
          role: "user",
          parts: [{ text: `target_lang=${target_lang}\n\nConversation Context:\n${historyText}\n\nMessage to transform: "${text}"` }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const translatedText = response.text.trim();

    if (!translatedText) {
      throw new Error("Empty Gemini response");
    }

    const endTime = Date.now();
    console.log(`[Gemini Translator] ✅ SUCCESS in ${endTime - startTime}ms`);

    // 3. ADD THIS: Save the translation to MongoDB Map
    if (messageId) {
      try {
        await Message.findByIdAndUpdate(
          messageId,
          { 
            $set: { [`content.translations.${target_lang}`]: translatedText } 
          }
        );
        console.log(`✅ Cached [${target_lang}] for message: ${messageId}`);
      } catch (dbErr) {
        console.error("❌ Cache failed:", dbErr.message);
      }
    }

    res.json({
      success: true,
      translation: translatedText,
    });
  } catch (err) {
    console.warn("❌ Gemini SDK error, switching to local model...", err.message);
    try {
        const localRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "ash-translate", // Or "dolphin3" depending on user's models
                prompt: `Translate this: "${text}" to ${target_lang}. Output ONLY the translated text.`,
                stream: false
            })
        });
        const localData = await localRes.json();
        const translatedText = localData.response?.trim();
        
        if (messageId && translatedText) {
            await Message.findByIdAndUpdate(
              messageId,
              { $set: { [`content.translations.${target_lang}`]: translatedText } }
            );
        }
        res.json({ success: true, translation: translatedText });
    } catch (localErr) {
        console.error("Local fallback also failed:", localErr.message);
        res.status(500).json({ success: false, error: "Both Gemini and Local translation failed" });
    }
  }
});

module.exports = router;