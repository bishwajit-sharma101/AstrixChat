const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../../../modules/auth/auth.middleware');

router.post('/scan', protect, async (req, res) => {
    try {
        const { bio, interests, name } = req.body;
        
        let promptStr = `Analyze this user's profile and generate their 'Neural Aura'.
Name: ${name || 'Unknown'}
Bio: ${bio || 'No bio available.'}
Interests: ${(interests || []).join(', ') || 'No interests listed.'}

You must return EXACTLY valid JSON, with nothing else before or after.
Format:
{
  "auraColor": "A CSS gradient description representing their vibe, e.g., 'from-cyan-500 to-purple-500'. Only return valid tailwind gradient classes.",
  "hexColors": ["#00ffff", "#800080"],
  "vibeCheck": "A stylish, edgy, 2-sentence poetic but sharp analysis of their personality based on their info. Max 40 words.",
  "icebreakers": ["A custom conversation starter", "Another custom conversation starter"]
}
`;

        const response = await axios.post("http://localhost:11434/api/generate", {
            model: "karma", // or "ash", keeping karma because it's standard local testing here
            prompt: promptStr,
            stream: false
        });

        const rawText = response.data.response;
        
        // Try to parse JSON from the local model's response
        let auraData;
        try {
            // Find JSON boundaries just in case model added extra text
            const jsonStart = rawText.indexOf('{');
            const jsonEnd = rawText.lastIndexOf('}') + 1;
            if(jsonStart !== -1 && jsonEnd !== -1) {
                 auraData = JSON.parse(rawText.slice(jsonStart, jsonEnd));
            } else {
                 throw new Error("No JSON found");
            }
        } catch (parseError) {
            console.error("Local LLM didn't return perfect JSON:", rawText);
            // Fallback aura if parsing fails
            auraData = {
                auraColor: "from-brand-500 to-purple-500",
                hexColors: ["#8b5cf6", "#a855f7"],
                vibeCheck: "A mysterious entity traversing the neural web with unpredictable patterns.",
                icebreakers: ["So, what brings you to this node?", "Share your latest transmission?"]
            };
        }

        res.json({ success: true, aura: auraData });
    } catch (error) {
        console.error("Aura Scan Error:", error);
        res.status(500).json({ success: false, message: "Aura scan failed." });
    }
});

module.exports = router;
