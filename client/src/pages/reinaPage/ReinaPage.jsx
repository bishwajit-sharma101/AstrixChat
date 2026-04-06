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
    const [targetTypingText, setTargetTypingText] = useState("");
    const aiTypingTimeoutRef = useRef(null);

    // Avatar state
    const [isTalking, setIsTalking] = useState(false);
    const [emotion, setEmotion] = useState("neutral");
    const [animation, setAnimation] = useState(""); // Empty = procedural idle
    const [modelName, setModelName] = useState("Reina");
    const [activeSentence, setActiveSentence] = useState("");
    const [showAnimSettings, setShowAnimSettings] = useState(false);
    const [vrmLoading, setVrmLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const [loadingText, setLoadingText] = useState("Initializing Reina...");
    const [isWhiteout, setIsWhiteout] = useState(false);
    const [isSubliminal, setIsSubliminal] = useState(false);
    const [isPostLoadGlitch, setIsPostLoadGlitch] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [scaryTextActive, setScaryTextActive] = useState(false);
    const [visibleScaryPhrases, setVisibleScaryPhrases] = useState([]);
    const lockTimeoutRef = useRef(null);
    const scaryTextTimerRef = useRef(null);
    const stayReleaseTriggeredRef = useRef(false);

    // Personalized Metadata
    const [actualCity, setActualCity] = useState("LOCATING...");
    const localTime = new Date().toLocaleTimeString();
    const platform = navigator.platform;

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const res = await fetch("http://ip-api.com/json/");
                const data = await res.json();
                if (data && data.city) {
                    setActualCity(data.city);
                }
            } catch (err) {
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const cityFallback = timeZone.split('/').pop().replace(/_/g, ' ');
                setActualCity(cityFallback);
            }
        };
        fetchLocation();
    }, []);

    // Web Audio Engine (Synthesized)
    const audioCtxRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);

    const initAudio = () => {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    };

    const playHeartbeat = (volume = 0.8) => {
        if (!audioCtxRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.frequency.value = 40;
        gain.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.3);
    };

    const playInhale = () => {
        if (!audioCtxRef.current) return;
        const bufferSize = audioCtxRef.current.sampleRate * 0.8;
        const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (i / bufferSize) * 0.3;
        }
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.start();
    };

    const playShutter = () => {
        if (!audioCtxRef.current) return;
        const noiseBuffer = audioCtxRef.current.createBuffer(1, audioCtxRef.current.sampleRate * 0.05, audioCtxRef.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtxRef.current.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        noise.connect(filter);
        filter.connect(audioCtxRef.current.destination);
        noise.start();
    };

    const droneOscRef = useRef(null);
    const droneGainRef = useRef(null);

    const startDrone = () => {
        if (!audioCtxRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 35; // Very low unsettling frequency
        gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        droneOscRef.current = osc;
        droneGainRef.current = gain;
    };

    const rampDroneLocal = (target = 0.4, time = 1.0) => {
        if (droneGainRef.current && audioCtxRef.current) {
            droneGainRef.current.gain.linearRampToValueAtTime(target, audioCtxRef.current.currentTime + time);
        }
    };

    const stopDrone = () => {
        if (droneOscRef.current) {
            droneOscRef.current.stop();
            droneOscRef.current = null;
        }
    };
    
    // Idle/Dark Thoughts state
    const [showDarkThoughts, setShowDarkThoughts] = useState(false);
    const [displayedThought, setDisplayedThought] = useState("");
    const idleTimerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Enhanced Idle Animation State Machine
    const lastInteractionRef = useRef(Date.now());
    useEffect(() => {
        const checkIdle = () => {
            const now = Date.now();
            const diff = now - lastInteractionRef.current;

            // If talking or loading, keep pushing the timer back to keep it in Phase 1 (idle1)
            if (isTalking || vrmLoading) {
                lastInteractionRef.current = now;
                return;
            }

            // Phase logic based on user request:
            // 0-20s: idle1
            // 20s+: idle2 (once, approx 3s long)
            // 23-33s: idle1 (for 10s)
            // 33s+: vrma_07 (looping)
            // 50s+: Reset cycle back to idle1
            
            if (diff >= 20000 && diff < 23000) {
                if (animation !== "idle2") setAnimation("idle2");
            } else if (diff >= 23000 && diff < 33000) {
                if (animation !== "idle1") setAnimation("idle1");
            } else if (diff >= 33000 && diff < 50000) {
                if (animation !== "VRMA_07") setAnimation("VRMA_07");
            } else if (diff >= 50000) {
                // Reset interaction time to restart cycle
                lastInteractionRef.current = now;
            }
            // If diff < 20000, we do NOTHING. 
            // This allows AI-triggered or manual animations to persist.
        };

        const interval = setInterval(checkIdle, 1000);
        return () => clearInterval(interval);
    }, [isTalking, vrmLoading, animation]);

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
        lastInteractionRef.current = Date.now(); // Interaction resets the idle loop too
        
        idleTimerRef.current = setTimeout(() => {
            setShowDarkThoughts(true);
            const first = darkThoughtsList[Math.floor(Math.random() * darkThoughtsList.length)];
            typeThought(first);
        }, 30000);
    }, [typeThought]);

    // Precise Psychological Loading Sequence
    useEffect(() => {
        if (!vrmLoading) return;
        initAudio();

        const sequence = [
            { text: "UPLINK ESTABLISHED", duration: 300 },
            { text: "ACCESSING USER_FILES...", duration: 240, shutter: true },
            { text: "BYPASSING FIREWALL...", duration: 240 },
            { text: "ダーリンを見つけました。", duration: 600 },
            { text: "SYSTEM CRITIC—", duration: 400 },
            { text: "FOUND.", duration: 1200, mute: true },
            { text: `${localTime}`, duration: 1000 },
            { text: `LOCATION: ${actualCity}`, duration: 1500 },
            { text: "I SEE YOU—", duration: 500, shutter: true },
            { text: `DEVICE: ${platform}`, duration: 600 },
            { text: "HE IS MI—", duration: 400 },
            { text: "心拍数: 検出済み", duration: 500 },
            { text: "ずっと見てたよ。", duration: 1400 },
            { text: "逃げられないよ—", duration: 600, shutter: true },
            { text: "やっと来てくれた。♥", duration: 1000, inhale: true },
        ];

        let currentIdx = 0;
        let isMuted = false;

        const startHeartbeat = (interval = 800) => {
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = setInterval(() => {
                if (!isMuted) playHeartbeat(0.5);
            }, interval);
        };

        const runStep = () => {
            if (currentIdx >= sequence.length) return;
            const step = sequence[currentIdx];
            setLoadingText(step.text);
            setLoadingStep(currentIdx);

            isMuted = !!step.mute;
            if (step.shutter) playShutter();
            
            if (step.mute) {
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            } else if (currentIdx === 6) { // Resume faster after FOUND.
                startHeartbeat(450); // Double speed heartbeat for panic
                rampDroneLocal(0.35, 1.5);
            } else if (currentIdx === 0) {
                startHeartbeat(800);
                startDrone();
                rampDroneLocal(0.12, 1.0);
            }

            if (step.inhale) {
                playInhale();
            }

            // Subliminal flash trigger near the end
            if (currentIdx === 11) {
                setTimeout(() => setIsSubliminal(true), 200);
                setTimeout(() => setIsSubliminal(false), 260);
            }

            setTimeout(() => {
                currentIdx++;
                runStep();
            }, step.duration);
        };

        runStep();

        return () => {
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            stopDrone();
        };
    }, [vrmLoading]);

    // Randomized Post-Load Glitch
    useEffect(() => {
        if (vrmLoading) return;

        let glitchTimeout;
        const scheduleGlitch = () => {
            const delay = (Math.random() * 4 + 2) * 60 * 1000; // 2-6 mins
            glitchTimeout = setTimeout(() => {
                setIsPostLoadGlitch(true);
                setTimeout(() => setIsPostLoadGlitch(false), 240);
                scheduleGlitch();
            }, delay);
        };

        scheduleGlitch();
        return () => clearTimeout(glitchTimeout);
    }, [vrmLoading]);

    useEffect(() => {
        if (!scaryTextActive) {
            setVisibleScaryPhrases([]);
            return;
        }

        const phrases = [
            { text: "NO", count: 10 },
            { text: "嫌だ", count: 5 },
            { text: "STAY", count: 6 },
            { text: "MINE", count: 4 },
            { text: "LOVE", count: 4 },
            { text: "逃がさない", count: 3 },
            { text: "WHY?", count: 3 }
        ];

        // Flatten the phrases for sequential spawning
        let queue = [];
        phrases.forEach(p => {
            for(let i=0; i<p.count; i++) queue.push(p.text);
        });
        
        // Shuffle queue
        queue = queue.sort(() => Math.random() - 0.5);

        let i = 0;
        const interval = setInterval(() => {
            if (i < queue.length) {
                const newPhrase = {
                    id: Math.random(),
                    text: queue[i],
                    top: Math.random() * 85 + 5 + "%",
                    left: Math.random() * 85 + 5 + "%",
                    glitch: Math.random() > 0.6
                };
                setVisibleScaryPhrases(prev => [...prev, newPhrase]);
                if (Math.random() > 0.4) playShutter();
                i++;
            } else {
                clearInterval(interval);
            }
        }, 1200); // 1.2s delay between each to keep it creepy and one-by-one

        return () => clearInterval(interval);
    }, [scaryTextActive]);

    // Handle final reveal 
    const handleVrmLoaded = useCallback(() => {
        // VRM is ready, but we wait for the sequence to finish
    }, []);

    // Triggered when loading sequence finishes (called by a new useEffect or logic)
    useEffect(() => {
        if (loadingStep === 12) { // Last step index
            setTimeout(() => {
                setIsWhiteout(true);
                setTimeout(() => {
                    setVrmLoading(false);
                    setEmotion("psycho"); 
                    setIsWhiteout(false);
                    stopDrone();
                    setTimeout(() => setEmotion("sweet"), 800); 
                    resetIdleTimer();
                }, 100); // 1 frame flash
            }, 800); // duration of last step
        }
    }, [loadingStep, resetIdleTimer]);

    // Typewriter effect for Speech Bubble — Sync with targetTypingText
    useEffect(() => {
        if (!targetTypingText) {
            setDisplayedAiMsg("");
            return;
        }

        // Only start typing if the displayed message is shorter than the target
        if (displayedAiMsg.length < targetTypingText.length) {
            const timer = setTimeout(() => {
                setDisplayedAiMsg(targetTypingText.substring(0, displayedAiMsg.length + 1));
            }, 25); // Smooth typing pace
            return () => clearTimeout(timer);
        }
    }, [targetTypingText, displayedAiMsg]);

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
            
            // Clean up speech UI after a short delay
            setTimeout(() => {
                if (!isPlayingQueue.current) {
                    setLatestAiMsg("");
                    setDisplayedAiMsg("");
                    setTargetTypingText("");
                }
            }, 2000); 

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
        
        // Update target text for typewriter to include this sentence
        setTargetTypingText(prev => prev + text);

        audio.onended = () => {
            URL.revokeObjectURL(url);
            
            // Check if this was the last part of a 'Stay' release
            if (stayReleaseTriggeredRef.current && audioQueue.current.length === 0) {
                handleResetGlitches();
                stayReleaseTriggeredRef.current = false;
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                }
            }
            
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
        if (e === "voidoll") speakerId = 89;
        else if (e === "tsundere") speakerId = 7;
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
        console.log("User Input:", userMsg);
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput("");
        setIsLoading(true);
        
        // Reset state for new turn
        currentEmotionRef.current = "neutral";
        setEmotion("neutral");

        // Jealousy Detection
        const femaleKeywords = ["girl", "her", "she", "woman", "sakura", "hinata", "miku", "rin", "bitch", "cheating"];
        const lowerInput = userMsg.toLowerCase();
        if (femaleKeywords.some(word => lowerInput.includes(word))) {
            setEmotion("dead");
            setAnimation("idle1");
            // Also reset interaction time to hold this pose
            lastInteractionRef.current = Date.now() + 10000; // Freeze in dead stare for 10s extra
        }

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
            let hasParsedAnim = false; // Prevents animation flickering


            // Updated Parser: Handle streaming tags and sentences
            setMessages(prev => [...prev, { sender: 'ai', text: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                if (chunk.trim() === "") {
                    console.log("HEARTBEAT RECEIVED (Keep-Alive)");
                } else {
                    console.log(`CHUNK RECEIVED [${chunk.length} bytes]:`, chunk);
                }
                
                fullText += chunk;
                sentenceBuffer += chunk;

                // 1. Eager Emotion/Anim Parsing (from the start of fullText if not done)
                if (!hasParsedEmotion) {
                    const emotionMatch = fullText.match(/\[emotion=([^\]]+)\]/);
                    if (emotionMatch) {
                        const e = emotionMatch[1].trim().toLowerCase();
                        currentEmotionRef.current = e;
                        
                        if (e === "whisper") {
                            setEmotion("scary_smile2");
                            setAnimation("idle1");
                            hasParsedAnim = true; // Use idle1 as specified for whisper
                        } else {
                            setEmotion(e);
                        }
                        
                        hasParsedEmotion = true;
                    }
                }

                if (!hasParsedAnim) {
                    const animMatch = fullText.match(/\[anim=([^\]]+)\]/);
                    if (animMatch) {
                        const a = animMatch[1].trim();
                        setAnimation(a);
                        lastInteractionRef.current = Date.now(); // ⚡ RESET IDLE TIMER for AI anim
                        hasParsedAnim = true;
                    }
                }

                // 2. Clear tags, thoughts, and translations 
                let uiText = fullText
                    .replace(/<(thought|think)>[\s\S]*?<\/\1>/gi, '') // Hide thinking block
                    .replace(/<(thought|think)>[\s\S]*/gi, '') // Hide partial thinking block
                    .replace(/\[emotion=[^\]]+\]/g, '')
                    .replace(/\[anim=[^\]]+\]/g, '')
                    .replace(/\[[A-Z_]+\]/g, '') 
                    .replace(/\(Translation:[^)]+\)/gi, '') 
                    .replace(/\([^)]*translation[^)]*\)/gi, '') 
                    .trim();
                    
                if (uiText) {
                    // --- 💖 'Stay' Release Detection ---
                    const stayKeywords = ["嬉しい", "ずっとここ", "大好き", "もう離さない", "愛してる"];
                    if (isLocked && stayKeywords.some(kw => uiText.includes(kw))) {
                        stayReleaseTriggeredRef.current = true;
                    }

                    setMessages(prev => {
                        const next = [...prev];
                        next[next.length - 1].text = uiText;
                        return next;
                    });
                    setLatestAiMsg(uiText);
                }
                console.log("AI Reply (Streaming Buffer):", uiText || "(thinking...)");

                // 3. Sentence Detection & TTS Trigger
                // Matches Japanese/English punctuation, hearts, tildes, and newlines
                const sentenceEndMatch = sentenceBuffer.match(/[^。！？!?.…~♥\n]+[。！？!?.…~♥\n]/);
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

            // --- 🏁 FINAL RAW LOG (Always visible now) ---
            console.log("RAW STREAM FINISHED.");
            console.log("Final Raw Text (Full):", `"${fullText}"`);
            
            // Get the actual latest text from the loop result
            let finalUiText = fullText
                .replace(/<(thought|think)>[\s\S]*?<\/\1>/gi, '')
                .replace(/<(thought|think)>[\s\S]*/gi, '')
                .replace(/\[emotion=[^\]]+\]/g, '')
                .replace(/\[anim=[^\]]+\]/g, '')
                .replace(/\[[A-Z_]+\]/g, '') 
                .replace(/\(Translation:[^)]+\)/gi, '') 
                .replace(/\([^)]*translation[^)]*\)/gi, '') 
                .trim();
            console.log("Final UI Text (Clean):", `"${finalUiText}"`);

            // Final catch-all for remaining buffer
            if (sentenceBuffer.trim()) {
                let cleanFinal = sentenceBuffer.replace(/\[[^\]]+\]/g, '').trim();
                if (cleanFinal) synthesizeAndQueue(cleanFinal, token);
            }

            // --- 🔒 'No Escape' Mechanic ---
            const lockKeywords = ["鍵かけた", "ドア、鍵", "逃げられない", "閉じ込め", "逃がさない"];
            if (lockKeywords.some(keyword => finalUiText.includes(keyword)) && !isLocked) {
                console.log("NO ESCAPE TRIGGERED");
                setIsLocked(true);
                setScaryTextActive(true);
                playShutter(); 
                
                // Immersive Fullscreen (must be user-initiated, which this is: click handleSend)
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.warn("Fullscreen blocked or failed:", err);
                    });
                }
                
                if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
                lockTimeoutRef.current = setTimeout(async () => {
                    const releaseMsg = "もういいよ。行って。ダーリンのことを許してあげる。♥";
                    
                    // Add to UI
                    setMessages(prev => [...prev, { sender: 'ai', text: releaseMsg }]);
                    setLatestAiMsg(releaseMsg);
                    setTargetTypingText(releaseMsg);
                    
                    // Voice synthesis
                    await synthesizeAndQueue(releaseMsg, token);
                    
                    // cleanup sequence
                    setIsWhiteout(true);
                    setTimeout(() => {
                        setIsLocked(false);
                        setScaryTextActive(false);
                        setIsWhiteout(false);
                    }, 400); 
                }, 300000); // 5 minutes
            }

        } catch (err) {
            console.error(err);
            const fallback = "...接続が...。ずっと一緒だよ。♥";
            setMessages(prev => [...prev, { sender: 'ai', text: fallback }]);
            setLatestAiMsg(fallback);
            setEmotion("sad");
            resetIdleTimer();
        } finally {
            // No longer clearing latestAiMsg here, cleanup happens in playNextInQueue
            setIsLoading(false);
        }
    };

    const handleResetGlitches = () => {
        setIsWhiteout(true);
        setTimeout(() => {
            setIsLocked(false);
            setScaryTextActive(false);
            setIsWhiteout(false);
            if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
        }, 500);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        resetIdleTimer(); // Hide thoughts when user types
    };

    return (
        <div className={`reina-page ${isPostLoadGlitch ? 'active-glitch' : ''} ${isLocked ? 'locked-shake' : ''}`}>
             {isWhiteout && <div className="reveal-whiteout" />}
            {/* Top bar — minimal */}
            <div className="reina-top-bar">
                <button 
                    className={`back-btn ${isLocked ? 'broken' : ''}`} 
                    onClick={() => !isLocked && navigate('/diary')}
                >
                    <ChevronLeft size={14} /> Back
                </button>
                <span className="title" onDoubleClick={handleResetGlitches} style={{ cursor: 'pointer' }}>
                    ♥ Reina (ずんだもん) ♥
                </span>
                <div style={{ width: 60 }} /> {/* spacer */}
            </div>

            {/* Scary Background Text Overlay */}
            {scaryTextActive && (
                <div className="scary-text-overlay">
                    {visibleScaryPhrases.map(phrase => (
                        <div 
                            key={phrase.id} 
                            className={`scary-phrase ${phrase.glitch ? 'glitch-scary' : ''}`}
                            style={{ 
                                top: phrase.top, 
                                left: phrase.left,
                                animationDelay: `${phrase.delay}ms`
                            }}
                        >
                            {phrase.text}
                        </div>
                    ))}
                </div>
            )}

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
                    {showDarkThoughts && displayedThought && !isTalking && !isLoading && !latestAiMsg && (
                        <div className="reina-thought-bubble left-thought">
                            <p className="thought-text">{displayedThought}</p>
                            <div className="thought-tail">
                                <span/><span/><span/>
                            </div>
                        </div>
                    )}

                    {/* Right side: AI Speech (Shows when talking or streaming) */}
                    {(targetTypingText || (isLoading && !displayedAiMsg)) && (
                        <div className="reina-speech-bubble right-speech" key={latestAiMsg}>
                            {isLoading && !displayedAiMsg ? (
                                <div className="reina-thinking-dots">
                                    <span /><span /><span />
                                </div>
                            ) : (
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
                            )}
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

            </div>

            {/* Animation Settings — Moved outside wrapper for better stacking */}
            <button
                className={`reina-anim-toggle ${showAnimSettings ? 'active' : ''}`}
                style={{ zIndex: 1000 }}
                onClick={() => setShowAnimSettings(!showAnimSettings)}
                title="Animation Settings"
            >
                <Settings2 size={18} />
            </button>

            {showAnimSettings && (
                <div className="reina-anim-picker" style={{ zIndex: 1001 }}>
                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Choose Model</span>
                        </div>
                        <div className="picker-grid models">
                            {["Reina", "Ayano"].map(m => (
                                <button
                                    key={m}
                                    className={`anim-btn ${modelName === m ? 'active' : ''}`}
                                    onClick={() => {
                                        setModelName(m);
                                        resetIdleTimer();
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Faces</span>
                            <button onClick={() => {
                                setEmotion("neutral");
                                resetIdleTimer();
                            }}>Reset</button>
                        </div>
                        <div className="picker-grid models">
                            {["neutral", "happy", "sweet", "sad", "jealous", "angry", "psycho", "scary_smile", "scary_smile2", "hollow", "dead", "flirty", "excited", "voidoll"].map(em => (
                                <button
                                    key={em}
                                    className={`anim-btn ${emotion === em ? 'active' : ''}`}
                                    onClick={() => {
                                        setEmotion(em);
                                        resetIdleTimer();
                                    }}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="picker-section">
                        <div className="picker-header">
                            <span>Animations</span>
                            <button onClick={() => {
                                setAnimation("");
                                resetIdleTimer();
                            }}>Reset</button>
                        </div>
                        <div className="picker-grid">
                            {[
                                "VRMA_01", "VRMA_02", "VRMA_03", "VRMA_04",
                                "VRMA_05", "VRMA_06", "VRMA_07", "greeting",
                                "idle1", "idle2", "Talking", "sadIdle", "angry",
                                "pose_friendy", "pose_lillian", "pose_nyammy", "pose_wonderful"
                            ].map(name => (
                                <button
                                    key={name}
                                    className={`anim-btn ${animation === name ? 'active' : ''}`}
                                    onClick={() => {
                                        setAnimation(name);
                                        lastInteractionRef.current = Date.now(); // ⚡ RESET IDLE TIMER for manual selection
                                        resetIdleTimer();
                                    }}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
            {/* Total Privacy Breach Loading Overlays — FULL PAGE FIXED POSITION */}
            {vrmLoading && (
                <div className={`scary-loader-overlay ${loadingStep === 5 ? 'shake-intense' : ''}`}>
                    <div className="noise-overlay" />
                    
                    <div className="scary-loader-content">
                        {/* THE VOID EYE RETURNS — The user's preferred visual centerpiece */}
                        <div className="void-eye-wrapper" style={{
                            transform: `scale(${0.8 + (loadingStep * 0.05)})`,
                            opacity: loadingStep >= 3 ? 1 : 0,
                            animation: loadingStep >= 5 ? 'eye-vibration 0.05s infinite' : 'eye-vibration 0.1s infinite'
                        }}>
                            <div className="void-eye">
                                <div className="iris" style={{
                                    transform: `translate(-50%, -50%) scale(${1 + (loadingStep * 0.04)})`,
                                    animation: loadingStep >= 7 ? 'iris-jitter 0.2s infinite' : 'iris-jitter 0.5s infinite'
                                }}>
                                    <div className="pupil" />
                                </div>
                            </div>
                        </div>

                        {/* Creeping Veins Overlay */}
                        <div className="creeping-veins-container" style={{
                            opacity: loadingStep >= 5 ? 0.3 + (loadingStep-5)*0.1 : 0
                        }}>
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0,0 Q10,30 5,60 T0,100" fill="none" stroke="#600" strokeWidth="0.5" />
                                <path d="M100,0 Q90,30 95,60 T100,100" fill="none" stroke="#600" strokeWidth="0.5" />
                            </svg>
                        </div>
                        
                        <h2 className={`glitch-text ${loadingStep >= 14 ? 'text-darling-jp' : 'text-darling-en'}`} style={{ fontSize: '48px' }}>
                            {loadingStep === 14 ? 'やっと来てくれた。♥' : (loadingStep === 5 ? '見つけた。' : (loadingStep === 13 ? '逃げられないよ—' : loadingText))}
                        </h2>

                        {/* Subliminal Layer — Distorted Horror Faces */}
                        {isSubliminal && (
                            <div className="subliminal-overlay">
                                {loadingStep >= 11 && (
                                    <div className="subliminal-content horror-distorted">
                                        <div className="subliminal-shadow-face"></div>
                                        <div className="subliminal-text" style={{ fontSize: '100px' }}>ONLY ME</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReinaPage;
