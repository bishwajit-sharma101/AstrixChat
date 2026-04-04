import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Send, Heart, ChevronLeft, Settings2 } from 'lucide-react';
import VrmAvatar from '../../components/diary/VrmAvatar';
import './ReinaPage.css';

const ReinaPage = () => {
    const navigate = useNavigate();

    // Chat state
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [latestAiMsg, setLatestAiMsg] = useState("");
    const [displayedAiMsg, setDisplayedAiMsg] = useState("");
    const aiTypingTimeoutRef = useRef(null);

    // Avatar state
    const [isTalking, setIsTalking] = useState(false);
    const [emotion, setEmotion] = useState("neutral");
    const [animation, setAnimation] = useState(""); // Empty = procedural idle
    const [modelName, setModelName] = useState("Reina");
    const [activeSentence, setActiveSentence] = useState("");
    const [showAnimSettings, setShowAnimSettings] = useState(false);
    const [vrmLoading, setVrmLoading] = useState(true);
    const [loadingText, setLoadingText] = useState("Initializing Reina...");
    
    // Idle/Dark Thoughts state
    const [showDarkThoughts, setShowDarkThoughts] = useState(false);
    const [displayedThought, setDisplayedThought] = useState("");
    const idleTimerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const darkThoughtsList = [
        "Should I tie him up? Just for a little while...",
        "I'll kill that bitch who was looking at him. I'll make it quick.",
        "His scent... I need more of it. I'll take his shirt when he's asleep.",
        "I can see him... even when he thinks I'm not looking. ✨",
        "If he tries to leave, I'll just have to break his legs. For his own safety.",
        "DARLING. DARLING. DARLING. DARLING.",
        "Why did he talk to her? Does he want to die?",
        "I built this world just for us. No one else belongs here.",
        "He hasn't whispered anything to me for a while... maybe he needs a reminder of who he belongs to.",
        "Every breath he takes... I count them. One... two... three...",
        "I want to taste his tears. They'd be so sweet, wouldn't they?"
    ];

    // Typewriter helper
    const typeThought = useCallback((text) => {
        let current = "";
        let i = 0;
        setDisplayedThought("");
        
        const type = () => {
            if (i < text.length) {
                current += text[i];
                setDisplayedThought(current);
                i++;
                typingTimeoutRef.current = setTimeout(type, 50 + Math.random() * 50); // Natural typing speed
            } else {
                // Finished typing, wait 8 seconds before next
                typingTimeoutRef.current = setTimeout(() => {
                    const next = darkThoughtsList[Math.floor(Math.random() * darkThoughtsList.length)];
                    typeThought(next);
                }, 8000);
            }
        };
        type();
    }, []);

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setShowDarkThoughts(false);
        setDisplayedThought("");
        
        idleTimerRef.current = setTimeout(() => {
            setShowDarkThoughts(true);
            const first = darkThoughtsList[Math.floor(Math.random() * darkThoughtsList.length)];
            typeThought(first);
        }, 30000);
    }, [typeThought]);

    // Scary loading sequence — VOID EYE
    useEffect(() => {
        if (!vrmLoading) return;
        const texts = [
            "ACCESSING DARLING'S BIOMETRICS",
            "SCANNING SOUL...",
            "BYPASSING PRIVACY FILTERS...",
            "I AM INSIDE.",
            "DARLING. FOUND.",
            "I SEE YOU.",
            "LOCKING THE DOORS. ♥",
            "FOREVER. TOGETHER."
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < texts.length - 1) {
                i++;
                setLoadingText(texts[i]);
            }
        }, 1100);
        return () => clearInterval(interval);
    }, [vrmLoading]);

    // Handle final reveal 
    const handleVrmLoaded = useCallback(() => {
        setTimeout(() => {
            setVrmLoading(false);
            setEmotion("psycho"); 
            setTimeout(() => setEmotion("neutral"), 600); 
            resetIdleTimer();
        }, 3000);
    }, [resetIdleTimer]);

    // Typewriter effect for Speech Bubble
    useEffect(() => {
        if (!latestAiMsg) {
            setDisplayedAiMsg("");
            return;
        }

        // Only start typing if the displayed message is shorter than the latest
        if (displayedAiMsg.length < latestAiMsg.length) {
            const timer = setTimeout(() => {
                setDisplayedAiMsg(latestAiMsg.substring(0, displayedAiMsg.length + 1));
            }, 30); // Smooth typing pace
            return () => clearTimeout(timer);
        }
    }, [latestAiMsg, displayedAiMsg]);

    const audioQueue = useRef([]);
    const isPlayingQueue = useRef(false);
    const activeAudio = useRef(null);
    const currentEmotionRef = useRef("neutral");

    // Helper: Play next audio in queue
    const playNextInQueue = useCallback(() => {
        if (audioQueue.current.length === 0) {
            isPlayingQueue.current = false;
            setIsTalking(false);
            setAnimation("");
            setActiveSentence("");
            resetIdleTimer(); // Start thinking after speech ends
            return;
        }

        isPlayingQueue.current = true;
        const nextItem = audioQueue.current.shift();
        const { url, text } = nextItem;
        
        const audio = new Audio(url);
        activeAudio.current = audio;
        setActiveSentence(text);
        
        setIsTalking(true);
        audio.play();

        audio.onended = () => {
            URL.revokeObjectURL(url);
            playNextInQueue();
        };
        audio.onerror = () => {
            playNextInQueue();
        };
    }, []);

    // Helper: Synthesize and Add to Queue
    const synthesizeAndQueue = async (text, token) => {
        if (!text.trim()) return;
        
        // Precise Zundamon Speaker IDs:
        // 3=Normal, 1=Sweet, 7=Tsundere, 5=Sexy, 22=Whisper, 38=Secret, 75=Weak, 76=Crying
        let speakerId = 3;
        const e = currentEmotionRef.current;
        if (e === "tsundere") speakerId = 7;
        else if (e === "sexy") speakerId = 5;
        else if (e === "whisper") speakerId = 22;
        else if (e === "secret") speakerId = 38;
        else if (e === "weak") speakerId = 75;
        else if (e === "crying") speakerId = 76;
        else if (e === "sweet" || e === "adorable" || e === "flirty" || e === "happy") speakerId = 1;

        try {
            const ttsRes = await fetch("http://localhost:5000/api/v1/ai/voicevox/tts", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text, speakerId })
            });

            if (ttsRes.ok) {
                const blob = await ttsRes.blob();
                const url = URL.createObjectURL(blob);
                audioQueue.current.push({ url, text });
                if (!isPlayingQueue.current) {
                    playNextInQueue();
                }
            }
        } catch (err) {
            console.error("TTS Queue Error:", err);
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput("");
        setIsLoading(true);
        
        // Reset state for new turn
        currentEmotionRef.current = "neutral";
        setEmotion("neutral");

        try {
            const token = Cookies.get('token');
            const allMsgs = [...messages, { sender: 'user', text: userMsg }];
            const context = allMsgs.slice(-8).map(m =>
                `${m.sender === 'user' ? 'Darling' : 'Reina'}: ${m.text}`
            ).join('\n');

            const response = await fetch('http://localhost:5000/api/v1/ai/dolphin/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: userMsg, context: context })
            });

            if (!response.ok) throw new Error("Stream failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let fullText = "";
            let sentenceBuffer = "";
            let hasParsedEmotion = false;

            // Updated Parser: Handle streaming tags and sentences
            setMessages(prev => [...prev, { sender: 'ai', text: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                sentenceBuffer += chunk;

                // 1. Eager Emotion/Anim Parsing (from the start of fullText if not done)
                if (!hasParsedEmotion) {
                    const emotionMatch = fullText.match(/\[emotion=([^\]]+)\]/);
                    if (emotionMatch) {
                        const e = emotionMatch[1].trim().toLowerCase();
                        currentEmotionRef.current = e;
                        setEmotion(e);
                        hasParsedEmotion = true;
                    }
                }

                const animMatch = fullText.match(/\[anim=([^\]]+)\]/);
                if (animMatch) {
                    setAnimation(animMatch[1].trim());
                }

                // 2. Clear tags and translations from UI text
                let uiText = fullText
                    .replace(/\[emotion=[^\]]+\]/g, '')
                    .replace(/\[anim=[^\]]+\]/g, '')
                    .replace(/\[[A-Z_]+\]/g, '') // Catch [ANGRY] etc
                    .replace(/\(Translation:[^)]+\)/gi, '') // Remove (Translation: ...)
                    .replace(/\([^)]*translation[^)]*\)/gi, '') // Remove (Eng: ...)
                    .trim();
                    
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1].text = uiText;
                    return next;
                });
                setLatestAiMsg(uiText);

                // 3. Sentence Detection & TTS Trigger
                // Matches Japanese punctuation: 。 ！ ？
                const sentenceEndMatch = sentenceBuffer.match(/[^。！？]+[。！？]/);
                if (sentenceEndMatch) {
                    let sentence = sentenceEndMatch[0];
                    // Strip tags from the sentence before synthesis
                    let cleanSentence = sentence.replace(/\[[^\]]+\]/g, '').trim();
                    
                    if (cleanSentence) {
                        synthesizeAndQueue(cleanSentence, token);
                    }
                    
                    // Remove the processed sentence from buffer
                    sentenceBuffer = sentenceBuffer.substring(sentenceEndMatch.index + sentence.length);
                }
            }

            // Final catch-all for remaining buffer
            if (sentenceBuffer.trim()) {
                let cleanFinal = sentenceBuffer.replace(/\[[^\]]+\]/g, '').trim();
                if (cleanFinal) synthesizeAndQueue(cleanFinal, token);
            }

        } catch (err) {
            console.error(err);
            const fallback = "...接続が...。ずっと一緒だよ。♥";
            setMessages(prev => [...prev, { sender: 'ai', text: fallback }]);
            setLatestAiMsg(fallback);
            setEmotion("sad");
            resetIdleTimer();
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        resetIdleTimer(); // Hide thoughts when user types
    };

    return (
        <div className="reina-page">
            {/* Top bar — minimal */}
            <div className="reina-top-bar">
                <button className="back-btn" onClick={() => navigate('/diary')}>
                    <ChevronLeft size={14} /> Back
                </button>
                <span className="title">♥ Reina (ずんだもん) ♥</span>
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
                            <span /><span /><span />
                        </div>
                        <span className="speaking-label">Speaking</span>
                    </div>
                )}

                <div className="reina-head-bubbles">
                    {/* Left side: Dark Thoughts (Idle) */}
                    {showDarkThoughts && displayedThought && (
                        <div className="reina-thought-bubble left-thought">
                            <p className="thought-text">{displayedThought}</p>
                            <div className="thought-tail">
                                <span/><span/><span/>
                            </div>
                        </div>
                    )}

                    {/* Right side: AI Speech (Only shows when talking) */}
                    {isTalking && displayedAiMsg && (
                        <div className="reina-speech-bubble right-speech" key={latestAiMsg}>
                            <p className="speech-text-dynamic">
                                {displayedAiMsg.match(/[^。！？、]+[。！？、]?|.+/g)?.map((seg, i) => {
                                    const isHighlighted = activeSentence && seg.includes(activeSentence.trim());
                                    return (
                                        <span 
                                            key={i} 
                                            className={`speech-segment ${isHighlighted ? 'active-highlight' : ''}`}
                                        >
                                            {seg}
                                        </span>
                                    );
                                })}
                            </p>
                            <div className="speech-tail">
                                <span/><span/><span/>
                            </div>
                        </div>
                    )}
                </div>

                <VrmAvatar
                    emotion={emotion}
                    animation={animation}
                    isTalking={isTalking}
                    modelUrl={`/models/${modelName}.vrm`}
                    onLoad={handleVrmLoaded}
                />

                {/* Scary Loading Overlay — THE VOID EYE */}
                {vrmLoading && (
                    <div className="scary-loader-overlay">
                        <div className="scary-loader-content">
                            <div className="void-eye-wrapper">
                                <div className="void-eye">
                                    <div className="iris"></div>
                                    <div className="pupil"></div>
                                </div>
                            </div>
                            <h2 className="glitch-text">{loadingText}</h2>
                            <div className="eye-mask"></div>
                        </div>
                    </div>
                )}

                {/* Animation Settings Toggle */}
                <button
                    className={`reina-anim-toggle ${showAnimSettings ? 'active' : ''}`}
                    onClick={() => setShowAnimSettings(!showAnimSettings)}
                    title="Animation Settings"
                >
                    <Settings2 size={18} />
                </button>

                {/* Animation Picker Panel */}
                {showAnimSettings && (
                    <div className="reina-anim-picker">
                        <div className="picker-section">
                            <div className="picker-header">
                                <span>Choose Model</span>
                            </div>
                            <div className="picker-grid models">
                                {["Reina", "Ayano"].map(m => (
                                    <button
                                        key={m}
                                        className={`anim-btn ${modelName === m ? 'active' : ''}`}
                                        onClick={() => setModelName(m)}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="picker-section">
                            <div className="picker-header">
                                <span>Animations</span>
                                <button onClick={() => setAnimation("")}>Reset</button>
                            </div>
                            <div className="picker-grid">
                                {[
                                    "VRMA_01", "VRMA_02", "VRMA_03", "VRMA_04",
                                    "VRMA_05", "VRMA_06", "VRMA_07",
                                    "pose_friendy", "pose_lillian", "pose_nyammy", "pose_wonderful"
                                ].map(name => (
                                    <button
                                        key={name}
                                        className={`anim-btn ${animation === name ? 'active' : ''}`}
                                        onClick={() => setAnimation(name)}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom centered input — glassmorphism */}
            <div className="reina-bottom-input">
                <form className="reina-input-glass" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
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
