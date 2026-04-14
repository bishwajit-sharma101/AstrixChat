import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, Sparkles, Save, User as UserIcon, Hexagon, X, Plus, 
  Camera, MessageSquare, Zap, Target, Layout, ShieldCheck,
  ChevronLeft, Award, Radio
} from 'lucide-react';
import PublicPost from './PublicPost';
import Loader from '../common/Loader';

const MemberProfile = ({ currentUser, targetUserId, onStartChat, onOpenComments, onAvatarChange, onBack }) => {
  const profileId = String((typeof targetUserId === 'object' && targetUserId !== null) ? (targetUserId._id || targetUserId.id) : (targetUserId || ''));
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuraScanning, setIsAuraScanning] = useState(false);
  const [auraData, setAuraData] = useState(null);
  const [activeTab, setActiveTab] = useState('moments'); // moments, bio, insights

  const isOwnProfile = profileId === String(currentUser?._id || currentUser?.id);
  const token = Cookies.get('token');

  // Edit states
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState([]);
  const [editInterest, setEditInterest] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        // Fetch User Info
        const userRes = await axios.get(`http://localhost:5000/api/v1/users/${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRes.data.success) {
          setProfile(userRes.data.user);
          setEditBio(userRes.data.user.bio || '');
          setEditInterests(userRes.data.user.interests || []);
        }

        // Fetch user's posts
        const postsRes = await axios.get(`http://localhost:5000/api/v1/posts/user/${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (postsRes.data.success) {
            setPosts(postsRes.data.posts.map(p => ({
                ...p,
                id: p._id,
                author: { ...p.author, id: p.author._id },
                timestamp: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })));
        }
      } catch (err) {
        console.error("Failed to fetch profile data", err);
        setProfile({ error: true }); // Prevent infinite loader
      } finally {
        setIsLoading(false);
      }
    };
    if (profileId && profileId !== 'undefined' && profileId !== 'null') fetchProfile();
  }, [profileId, token]);

  const handleSaveProfile = async () => {
    try {
      const res = await axios.put('http://localhost:5000/api/v1/users/profile', {
        bio: editBio,
        interests: editInterests
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProfile(res.data.user);
        setIsEditing(false);
        Cookies.set('user', JSON.stringify({ ...currentUser, bio: editBio, interests: editInterests }));
      }
    } catch(err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleRevealAura = async () => {
     if (isAuraScanning) return;
     setIsAuraScanning(true);
     try {
        const res = await axios.post('http://localhost:5000/api/v1/ai/aura/scan', {
           name: profile.name,
           bio: profile.bio,
           interests: profile.interests,
           targetId: profile._id
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        if (res.data.success) {
           setAuraData(res.data.aura);
           setActiveTab('insights');
        }
     } catch (err) {
        alert(err.response?.data?.message || "Reveal failed. Is your model online?");
     } finally {
        setIsAuraScanning(false);
     }
  };

  const addInterest = () => {
    if (editInterest.trim() && !editInterests.includes(editInterest.trim())) {
      setEditInterests([...editInterests, editInterest.trim()]);
      setEditInterest('');
    }
  };

  const removeInterest = (item) => {
    setEditInterests(editInterests.filter(i => i !== item));
  };

  if (isLoading || !profile || profile.error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050508]">
         {profile?.error ? (
           <>
             <X size={40} className="text-red-500 mb-4" />
             <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Neural Connection Failed</p>
             <button onClick={onBack} className="mt-8 px-6 py-2 bg-white/5 rounded-xl text-[10px] text-white uppercase tracking-widest border border-white/10 italic hover:bg-white/10 transition-colors">Return to Stream</button>
           </>
         ) : (
           <>
             <Loader size={50} />
             <p className="mt-4 text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] animate-pulse">Synchronizing Neural Data...</p>
           </>
         )}
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col relative bg-[#020205] overflow-hidden select-none">
      
      {/* 🔮 PREMIUM BACKGROUND ORCHESTRATION */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={`absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 mix-blend-screen bg-gradient-to-br ${auraData?.auraColor || 'from-brand-600 to-purple-600'}`} 
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-[#020205]" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-4 md:px-10 py-6 md:py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* 🔙 BACK BUTTON */}
          <button onClick={onBack} className="mb-8 flex items-center gap-2 group text-zinc-500 hover:text-white transition-all cursor-pointer">
             <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/20 transition-all">
                <ChevronLeft size={16} />
             </div>
             <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Return to Stream</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* 🏷️ LEFT COLUMN: IDENTITY CARD */}
            <div className="lg:col-span-5 space-y-6">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="relative group box-border"
                >
                    {/* Glowing Ring */}
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${auraData?.auraColor || 'from-brand-500 to-purple-500'} rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 anim-pulse`} />
                    
                    <div className="relative bg-[#080810]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                           <ShieldCheck size={18} className="text-emerald-500/40" />
                        </div>

                        {/* Avatar Hub */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-6">
                               <div className={`absolute -inset-4 bg-gradient-to-tr ${auraData?.auraColor || 'from-brand-500 to-purple-500'} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                               <img 
                                 src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
                                 className="w-32 h-32 rounded-full object-cover border-4 border-white/5 relative z-10 shadow-2xl"
                                 alt={profile.name}
                               />
                               {profile.isOnline && (
                                 <div className="absolute bottom-1 right-3 w-6 h-6 bg-emerald-500 rounded-full border-[4px] border-[#080810] z-20 shadow-lg shadow-emerald-500/20" />
                               )}
                            </div>

                            <motion.h1 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="text-2xl font-black text-white tracking-tight text-center"
                            >
                              {profile.name}
                            </motion.h1>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] mt-1">
                              Neural Rank: {profile.role === 'primeUser' ? 'Prime Apex' : 'Core Node'}
                            </p>

                            {/* Relationship Synergy */}
                            {!isOwnProfile && auraData && (
                               <div className="mt-8 w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                  <div>
                                     <p className="text-[9px] uppercase tracking-[0.1em] text-zinc-500 mb-1">Synergy Index</p>
                                     <p className="text-sm font-bold text-white tracking-widest">{auraData.compatibility}% <span className="text-[10px] text-emerald-400 font-medium">Harmonic</span></p>
                                  </div>
                                  <div className="h-10 w-10 flex items-center justify-center">
                                     <Zap size={20} className="text-brand-400 animate-pulse" />
                                  </div>
                               </div>
                            )}

                            {/* Action Matrix */}
                            <div className="w-full mt-8 grid grid-cols-2 gap-3">
                                {!isOwnProfile ? (
                                   <>
                                      <button 
                                        onClick={() => onStartChat(profile._id)}
                                        className="py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
                                      >
                                        <MessageSquare size={14} /> Message
                                      </button>
                                      <button 
                                        disabled={isAuraScanning}
                                        onClick={handleRevealAura}
                                        className="py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                      >
                                        <Sparkles size={14} className="text-purple-400 group-hover:rotate-12 transition-transform" /> {isAuraScanning ? "Scanning..." : "Aura Scan"}
                                      </button>
                                   </>
                                ) : (
                                   <button 
                                      onClick={() => setIsEditing(!isEditing)}
                                      className="col-span-2 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2"
                                   >
                                      <Edit2 size={14} /> Edit Neural Profile
                                   </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* BIO BOX */}
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                   <div className="flex items-center gap-2 text-zinc-500 uppercase font-mono tracking-widest text-[10px]">
                      <Layout size={12} /> Personality Module
                   </div>
                   {isOwnProfile && isEditing ? (
                      <textarea 
                        value={editBio} 
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none min-h-[100px] leading-relaxed"
                      />
                   ) : (
                      <p className="text-xs text-zinc-400 leading-[1.8] font-medium italic">"{profile.bio || "This user exists in the void without a description..."}"</p>
                   )}
                </div>

                {/* INTERESTS */}
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                   <div className="flex items-center gap-2 text-zinc-500 uppercase font-mono tracking-widest text-[10px]">
                      <Target size={12} /> Frequency Nodes
                   </div>
                   <div className="flex flex-wrap gap-2">
                       {isOwnProfile && isEditing ? (
                          <div className="w-full space-y-2">
                             <div className="flex gap-2">
                                <input value={editInterest} onChange={(e) => setEditInterest(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addInterest()} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="Add node..." />
                                <button onClick={addInterest} className="px-3 bg-brand-500/20 text-brand-300 border border-brand-500/20 rounded-lg">+</button>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {editInterests.map(i => (
                                   <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[9px] text-white flex items-center gap-1 border border-white/5">{i} <X size={10} onClick={() => removeInterest(i)} /></span>
                                ))}
                             </div>
                             <button onClick={handleSaveProfile} className="w-full py-2 bg-brand-600 rounded-lg text-[9px] font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-2"><Save size={12}/> Confirm Changes</button>
                          </div>
                       ) : (
                          (profile.interests && profile.interests.length > 0) ? profile.interests.map((tag, i) => (
                             <span key={i} className="px-4 py-1.5 bg-brand-500/5 border border-brand-500/20 rounded-full text-[10px] font-bold text-brand-300 tracking-wide uppercase">
                                {tag}
                             </span>
                          )) : <p className="text-[10px] text-zinc-600 font-mono italic">No frequencies registered.</p>
                       )}
                   </div>
                </div>
            </div>

            {/* 📊 RIGHT COLUMN: DYNAMIC FEED & AI INSIGHTS */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
                
                {/* TABS Navigation */}
                <nav className="flex items-center p-1.5 bg-white/5 border border-white/5 rounded-[1.5rem] w-fit">
                    {['moments', 'insights'].map(tab => (
                       <button
                         key={tab}
                         onClick={() => setActiveTab(tab)}
                         className={`px-6 py-2.5 rounded-[1.2rem] text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-zinc-500 hover:text-white'}`}
                       >
                         {tab}
                       </button>
                    ))}
                </nav>

                <AnimatePresence mode="wait">
                   {activeTab === 'moments' && (
                      <motion.div key="moments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                         {posts.length === 0 ? (
                            <div className="py-24 text-center">
                               <Radio size={40} className="mx-auto text-zinc-800 mb-6 animate-pulse" />
                               <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">No signals found from this node.</p>
                            </div>
                         ) : (
                            posts.map(post => (
                               <PublicPost 
                                 key={post.id} 
                                 post={post}
                                 onOpenComments={() => onOpenComments(post)}
                                 onStartChat={() => onStartChat(profile._id, post.content.original)}
                               />
                            ))
                         )}
                      </motion.div>
                   )}

                   {activeTab === 'insights' && (
                      <motion.div key="insights" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                         {auraData ? (
                            <div className="space-y-6">
                               <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                                  <div className={`absolute -inset-20 bg-gradient-to-tr ${auraData.auraColor} opacity-5 blur-[100px] group-hover:opacity-10 transition-opacity`} />
                                  <div className="flex items-center gap-3 mb-6">
                                     <Sparkles size={20} className="text-purple-400" />
                                     <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">AI Soul Mirror</h3>
                                  </div>
                                  <p className="text-[15px] text-zinc-100 leading-[1.8] font-light font-serif">
                                     {auraData.vibeCheck}
                                  </p>
                                  {auraData.compReason && (
                                     <div className="mt-8 pt-6 border-t border-white/5 flex items-start gap-3">
                                        <Award size={18} className="text-brand-400 mt-1" />
                                        <div>
                                           <p className="text-[9px] uppercase font-mono text-zinc-500 tracking-widest mb-1">Vibe Match Reason</p>
                                           <p className="text-[11px] text-zinc-300 font-medium">{auraData.compReason}</p>
                                        </div>
                                     </div>
                                  )}
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {auraData.icebreakers.map((starter, i) => (
                                     <div 
                                       key={i} 
                                       onClick={() => onStartChat(profile._id, starter)}
                                       className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                                     >
                                        <p className="text-[9px] uppercase font-mono text-zinc-500 mb-2 group-hover:text-brand-400 transition-colors">Icebreaker #{i+1}</p>
                                        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">"{starter}"</p>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         ) : (
                            <div className="py-24 text-center bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                               <Zap size={40} className="mx-auto text-zinc-800 mb-6" />
                               <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-2">Neural Persona Offline</h4>
                               <p className="text-[10px] text-zinc-500 font-mono tracking-wider max-w-[200px] mx-auto px-4">
                                  {isOwnProfile ? "You can't scan your own aura yet." : "Initiate an Aura Scan to unlock AI-synthesized personality insights."}
                               </p>
                               {!isOwnProfile && (
                                  <button onClick={handleRevealAura} className="mt-8 px-6 py-3 rounded-2xl bg-brand-600 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-brand-500 transition-all">Scan Aura (-5 Units)</button>
                               )}
                            </div>
                         )}
                      </motion.div>
                   )}
                </AnimatePresence>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
