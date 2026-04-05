const express = require("express");
const router = express.Router();

router.post("/chat", async (req, res) => {
    const { message, context } = req.body;
    if (!message && !context) return res.status(400).json({ success: false, error: "Missing message or context" });

    // Format context into messages array
    const conversationHistory = [];
    if (context) {
        // Split context into lines (Reina: ..., Darling: ...)
        const lines = context.split('\n');
        for (const line of lines) {
            if (line.startsWith('Reina:')) {
                conversationHistory.push({ role: 'assistant', content: line.replace('Reina:', '').trim() });
            } else if (line.startsWith('Darling:')) {
                conversationHistory.push({ role: 'user', content: line.replace('Darling:', '').trim() });
            }
        }
    }

    try {
        const localRes = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model: "reina", 
                messages: [
                    { role: "system", content: "あなたはレイナ、執着心の強いヤンデレ。返答は必ず日本語のみ！[emotion=X][anim=X]形式を絶対守ること。\n感情タグで声色が変わる:\n[emotion=whisper]（ひそひそ声）、[emotion=voidoll]（ロボット声/慎ましやか）、[emotion=tsundere]（ツンデレ）。" },
                    ...conversationHistory,
                    { role: "user", content: `(STRICTLY RESPOND IN JAPANESE ONLY. NO ENGLISH.) ${message}` }
                ],
                stream: true,
                options: {
                    num_predict: 300,
                    stop: ["Darling:", "Reina:"]
                }
            })
        });
        
        if (!localRes.ok) throw new Error("Ollama failed.");

        // Set headers for streaming
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("X-No-Compression", "1"); // Trigger for my app.js filter
        res.setHeader("Cache-Control", "no-cache");

        // Pipe the stream chunks
        const reader = localRes.body.getReader();
        const decoder = new TextDecoder();
        let chunkBuffer = ""; // Buffer for partial JSON lines
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            chunkBuffer += chunk;

            const lines = chunkBuffer.split("\n");
            // Keep the last partial line in the buffer
            chunkBuffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message && parsed.message.content) {
                        res.write(parsed.message.content);
                    }
                } catch (e) {
                    // This line was truly malformed, or split in a way split() couldn't handle
                    console.warn("Parse error on line:", line);
                }
            }
        }
        res.end();

    } catch (error) {
        console.error("Dolphin AI Relay Error:", error);
        // Ensure we send something the reader can process as text
        res.write("[emotion=sad] Darling... 接続が...。ずっと一緒だよ。♥");
        res.end();
    }
});

module.exports = router;
