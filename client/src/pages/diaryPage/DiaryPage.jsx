import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { Book, Edit3, Settings, Save, ShieldAlert, Eye, EyeOff, FileText } from 'lucide-react';
import { useActivityTracker } from '../../contexts/ActivityTrackerContext';
import { useNavigate } from 'react-router-dom';

const DiaryPage = () => {
    const { settings, setSettings } = useActivityTracker();
    const [diary, setDiary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const navigate = useNavigate();

    const personas = [
        { id: 'detective', name: 'Detective 🕵️', desc: 'Clinical, analytical case file of your data trail.' },
        { id: 'yandere', name: 'Yandere 🔪', desc: 'Overly obsessive, overly attached stalker notes.' },
        { id: 'therapist', name: 'Therapist 🛋️', desc: 'Emotional observation and well-being notes.' },
        { id: 'analyst', name: 'Analyst 📊', desc: 'Cold statistical metric profiling.' },
        { id: 'gossip', name: 'Gossip Girl 💅', desc: 'Juicy, sassy rumor-styled column about your chats.' },
        { id: 'sci-fi', name: 'Rogue AI 🤖', desc: 'Cybernetic assessment of human operational patterns.' },
        { id: 'mom', name: 'Overprotective Mom 👵', desc: 'Embarrassing, worried diary entries about your life.' }
    ];

    useEffect(() => {
        const fetchDiary = async () => {
            const token = Cookies.get('token');
            if(!token) return navigate('/signin');
            try {
                const res = await axios.get('http://localhost:5000/api/v1/diary/today', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if(res.data.success) setDiary(res.data.diary);
            } catch (err) {
                console.error("Failed to load diary");
            } finally {
                setLoading(false);
            }
        };
        fetchDiary();
    }, [navigate]);

    const handleSaveSettings = async (updates) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        try {
            const token = Cookies.get('token');
            await axios.post('http://localhost:5000/api/v1/diary/settings', newSettings, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Failed to update settings");
        }
    };

    if (loading) return <div className="h-screen bg-[#020202] text-white flex items-center justify-center">Loading Data Link...</div>;

    // Theming System based on Persona
    let themeBg = "bg-[#020202]";
    let themeText = "text-white";
    let themeAccent = "text-brand-500";
    let fontStyle = "font-sans";

    if (settings.persona === 'yandere') { themeBg = "bg-red-950/20"; themeAccent = "text-red-500"; fontStyle = "font-serif italic"; }
    else if (settings.persona === 'detective') { themeBg = "bg-yellow-900/10"; themeAccent = "text-yellow-600"; fontStyle = "font-mono"; }
    else if (settings.persona === 'mom') { themeBg = "bg-pink-900/10"; themeAccent = "text-pink-400"; fontStyle = "font-sans text-xl leading-relaxed"; }
    else if (settings.persona === 'gossip') { themeBg = "bg-fuchsia-900/10"; themeAccent = "text-fuchsia-400"; fontStyle = "font-sans font-medium tracking-wide"; }

    return (
        <div className={`min-h-screen ${themeBg} text-white p-8 transition-colors duration-1000`}>
            
            {/* Header */}
            <div className="max-w-4xl mx-auto flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                <button onClick={() => navigate('/chat')} className="text-slate-400 hover:text-white transition uppercase text-xs tracking-widest flex items-center gap-2">
                    &larr; Back to Nexus
                </button>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleSaveSettings({ enabled: !settings.enabled })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${settings.enabled ? 'border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'border-brand-500/50 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20'}`}
                    >
                        {settings.enabled ? <><EyeOff size={14}/> Stop Observing</> : <><Eye size={14}/> Start Observing</>}
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-white/5 text-slate-400">
                        <Settings size={20}/>
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto relative">
                {/* SETTINGS PANEL OVERLAY */}
                {showSettings && (
                    <motion.div initial={{ opacity:0, y:-10 }} animate={{opacity:1, y:0}} className="bg-[#050508] border border-white/10 p-6 rounded-2xl mb-8 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-brand-400"><ShieldAlert size={18}/> Observer Configuration</h3>
                        
                        <div className="mb-6">
                            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Tracking Frequency (Minutes)</label>
                            <input 
                                type="range" min="1" max="60" value={settings.cycleMinutes || 1} 
                                onChange={(e) => handleSaveSettings({ cycleMinutes: parseInt(e.target.value) })}
                                className="w-full accent-brand-500"
                            />
                            <div className="text-right text-xs text-brand-400 font-bold mt-1">Updates every {settings.cycleMinutes} min</div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-3">AI Personality Matrix</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {personas.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => handleSaveSettings({ persona: p.id })}
                                        className={`p-4 rounded-xl border text-left transition-all ${settings.persona === p.id ? 'border-brand-500 bg-brand-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                    >
                                        <div className={`font-bold ${settings.persona === p.id ? 'text-brand-400' : 'text-white'}`}>{p.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* THE DIARY ENTRY */}
                <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                        <Book size={28} className={themeAccent} />
                        <h1 className="text-3xl font-bold tracking-tight">Observer Log: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
                    </div>

                    {!settings.enabled && (!diary || diary.trackedEventsCount === 0) ? (
                        <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.02]">
                            <EyeOff size={48} className="mx-auto text-slate-600 mb-4" />
                            <h2 className="text-xl font-bold text-slate-300">Observation is Offline</h2>
                            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Toggle the observer ON in the top right to allow the AI to begin constructing your behavioral profile.</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-8 md:p-12 border rounded-2xl shadow-2xl backdrop-blur-sm min-h-[40vh] ${settings.persona === 'detective' ? 'bg-[#f4e4bc] text-black border-yellow-900 shadow-yellow-900/20' : 'bg-[#0a0a0c] border-white/10'}`}>
                            
                            {/* Decorative header based on persona */}
                            {settings.persona === 'detective' && <div className="text-center text-xs font-bold uppercase tracking-[0.4em] text-yellow-900/50 mb-8 border-b-2 border-yellow-900/20 pb-4">Confidential Dossier - Subject #442</div>}
                            {settings.persona === 'yandere' && <div className="text-right text-xs italic text-red-500/50 mb-8 pb-4">My heart beats for you...</div>}
                            
                            <div className={`whitespace-pre-wrap leading-[2] text-lg ${fontStyle} ${settings.persona === 'detective' ? 'text-neutral-800' : 'text-slate-200'}`}>
                                {diary?.summaryText || "Waiting for initial data ingestion..."}
                            </div>
                            
                            <div className={`mt-12 pt-6 border-t flex justify-between items-center text-xs uppercase tracking-widest ${settings.persona === 'detective' ? 'text-yellow-900/50 border-yellow-900/20' : 'text-slate-500 border-white/10'}`}>
                                <span>{diary?.trackedEventsCount || 0} Telemetry Events Processed</span>
                                <span>Last Sync: {diary?.updatedAt ? new Date(diary.updatedAt).toLocaleTimeString() : 'N/A'}</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiaryPage;
