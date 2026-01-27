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
  // 2. ADD 'messageId' to the destructured body
  const { text, target_lang, messageId } = req.body;

  if (!text || !target_lang) {
    return res.status(400).json({
      success: false,
      error: "text and target_lang are required",
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Corrected model name if needed
      systemInstruction: TRANSLATION_SYSTEM_PROMPT,
      contents: [
        { 
          role: "user",
          parts: [{ text: `Translate this: "${text}" to ${target_lang}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });

    const translatedText = response.text?.trim();

    if (!translatedText) {
      throw new Error("Empty Gemini response");
    }

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
    console.error("❌ Gemini SDK error:", err.message);
    res.status(500).json({
      success: false,
      error: "Gemini translation failed",
    });
  }
});

module.exports = router;