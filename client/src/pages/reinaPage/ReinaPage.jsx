import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Send, Heart, ChevronLeft } from 'lucide-react';
import VrmAvatar from '../../components/diary/VrmAvatar';
import './ReinaPage.css';

const ReinaPage = () => {
    const navigate = useNavigate();

    // Chat state
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [latestAiMsg, setLatestAiMsg] = useState("Darling... you came. I knew you would. ♥");

    // Avatar state
    const [isTalking, setIsTalking] = useState(false);
    const [emotion, setEmotion] = useState("neutral");
    const [animation, setAnimation] = useState(""); // Empty = procedural idle

    const returnToIdle = useCallback(() => {
        setIsTalking(false);
        setAnimation("");
    }, []);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            const token = Cookies.get('token');
            const allMsgs = [...messages, { sender: 'user', text: userMsg }];
            const context = allMsgs.slice(-8).map(m =>
                `${m.sender === 'user' ? 'Darling' : 'Reina'}: ${m.text}`
            ).join('\n');

            const res = await axios.post('http://localhost:5000/api/v1/ai/karma/chat', {
                message: userMsg,
                context: context
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                let rawText = res.data.response;
                let cleanText = rawText;

                // Parse [emotion=X] tag
                const emotionMatch = rawText.match(/\[emotion=([^\]]+)\]/);
                if (emotionMatch) {
                    setEmotion(emotionMatch[1].trim().toLowerCase());
                    cleanText = cleanText.replace(emotionMatch[0], '');
                } else {
                    setEmotion("neutral");
                }

                // Parse [anim=X] tag — OPTIONAL
                const animMatch = rawText.match(/\[anim=([^\]]+)\]/);
                if (animMatch) {
                    setAnimation(animMatch[1].trim());
                    cleanText = cleanText.replace(animMatch[0], '');
                }

                cleanText = cleanText.trim();
                setMessages(prev => [...prev, { sender: 'ai', text: cleanText }]);
                setLatestAiMsg(cleanText);
                setIsTalking(true);

                // Kokoro TTS
                try {
                    const ttsRes = await fetch("http://127.0.0.1:7861/tts_chunk", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: cleanText, voice: "af_bella", speed: 1.0 })
                    });

                    if (ttsRes.ok) {
                        const data = await ttsRes.json();
                        if (data.audio) {
                            const audioUrl = `http://127.0.0.1:7861/file/${data.audio}`;
                            const audio = new Audio(audioUrl);
                            audio.play();
                            audio.onloadedmetadata = () => {
                                setTimeout(() => returnToIdle(), audio.duration * 1000);
                            };
                            audio.onerror = () => returnToIdle();
                            return;
                        }
                    }
                } catch (err) {
                    console.error("Kokoro TTS unavailable:", err);
                }

                // Fallback timing
                const duration = Math.min(Math.max(cleanText.split(' ').length * 250, 2000), 12000);
                setTimeout(() => returnToIdle(), duration);
            }
        } catch (err) {
            console.error(err);
            const fallback = "...the connection to my heart... it's wavering. But I'll never let go.";
            setMessages(prev => [...prev, { sender: 'ai', text: fallback }]);
            setLatestAiMsg(fallback);
            setEmotion("sad");
            setTimeout(() => returnToIdle(), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="reina-page">
            {/* Top bar — minimal */}
            <div className="reina-top-bar">
                <button className="back-btn" onClick={() => navigate('/diary')}>
                    <ChevronLeft size={14} /> Back
                </button>
                <span className="title">♥ Reina ♥</span>
                <div style={{ width: 60 }} /> {/* spacer */}
            </div>

            {/* Full-screen avatar */}
            <div className="reina-avatar-wrapper">
                <div className="reina-vignette-top" />
                <div className="reina-vignette-bottom" />
                <div className="reina-vignette-left" />
                <div className="reina-vignette-right" />

                {/* Floating hearts */}
                <div className="reina-deco-hearts">
                    <span className="floating-heart">♥</span>
                    <span className="floating-heart">♥</span>
                    <span className="floating-heart">♥</span>
                    <span className="floating-heart">♥</span>
                    <span className="floating-heart">♥</span>
                </div>

                {/* Speaking indicator */}
                {isTalking && (
                    <div className="reina-speaking-badge">
                        <div className="speaking-bars">
                            <span /><span /><span /><span />
                        </div>
                        <span className="speaking-label">Speaking</span>
                    </div>
                )}

                {/* Latest AI message bubble — floating above input */}
                {latestAiMsg && (
                    <div className="reina-speech-bubble" key={latestAiMsg}>
                        <div className="speech-bubble-icon">
                            <Heart size={10} color="#fca5a5" />
                        </div>
                        <p>{latestAiMsg}</p>
                    </div>
                )}

                {/* Emotion badge */}
                {emotion !== "neutral" && isTalking && (
                    <div className="reina-emotion-badge">
                        {emotion === "sweet" && "💕 Sweet"}
                        {emotion === "jealous" && "💢 Jealous"}
                        {emotion === "angry" && "🔥 Angry"}
                        {(emotion === "brat" || emotion === "bratty") && "😏 Bratty"}
                        {emotion === "adorable" && "🥺 Flustered"}
                        {emotion === "sad" && "💧 Sad"}
                        {emotion === "happy" && "✨ Happy"}
                        {emotion === "mad" && "👁️ Furious"}
                        {emotion === "hollow" && "🕳️ Hollow"}
                        {emotion === "psycho" && "🔪 Snapped"}
                        {emotion === "excited" && "⚡ Excited"}
                        {emotion === "flirty" && "💋 Flirty"}
                    </div>
                )}

                <VrmAvatar
                    emotion={emotion}
                    animation={animation}
                    isTalking={isTalking}
                />
            </div>

            {/* Bottom centered input — glassmorphism */}
            <div className="reina-bottom-input">
                <form className="reina-input-glass" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Whisper to Reina..."
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? (
                            <div className="loading-spinner" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReinaPage;
