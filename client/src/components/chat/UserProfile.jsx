import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { Edit2, Sparkles, Save, User as UserIcon, Hexagon, X, Plus, Camera } from 'lucide-react';
import PublicPost from './PublicPost';
import Loader from '../common/Loader';

const UserProfile = ({ currentUser, onStartChat, onOpenComments, onAvatarChange }) => {
  const [profile, setProfile] = useState(currentUser);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [editInterest, setEditInterest] = useState('');
  const [editInterests, setEditInterests] = useState(profile?.interests || []);
  
  const fileInputRef = useRef(null);

  const token = Cookies.get('token');

  useEffect(() => {
    // Fetch user's posts
    const fetchUserPosts = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`http://localhost:5000/api/v1/posts/user/${currentUser._id || currentUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
            setPosts(res.data.posts.map(p => ({
                ...p,
                id: p._id,
                author: { ...p.author, id: p.author._id },
                timestamp: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })));
        }
      } catch (err) {
        console.error("Failed to fetch user posts", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserPosts();
  }, [currentUser, token]);

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
        // Update local cookie
        Cookies.set('user', JSON.stringify({ ...currentUser, bio: editBio, interests: editInterests }));
      }
    } catch(err) {
      console.error("Failed to update profile", err);
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

  const handleDeletePost = async (postId) => {
      try {
          const res = await axios.delete(`http://localhost:5000/api/v1/posts/${postId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
              setPosts(prev => prev.filter(p => p.id !== postId));
          }
      } catch (err) {
          console.error("Failed to delete user post", err);
      }
  };

  const handleLikePost = async (postId) => {
    try {
      const currentUserId = currentUser.id || currentUser._id;
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likedBy?.includes(currentUserId);
          const newLikedBy = isLiked 
            ? (post.likedBy || []).filter(id => id !== currentUserId)
            : [...(post.likedBy || []), currentUserId];
          return {
             ...post,
             likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
             likedBy: newLikedBy
          };
        }
        return post;
      }));

      await axios.post(`http://localhost:5000/api/v1/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  const handleAvatarClick = () => {
     fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
     if (e.target.files?.[0]) {
         onAvatarChange(e.target.files[0]);
         const previewUrl = URL.createObjectURL(e.target.files[0]);
         setProfile(prev => ({...prev, avatar: previewUrl}));
     }
  };

  return (
    <div className="h-full flex-1 flex flex-col relative bg-[#050510] overflow-hidden">
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          
          {/* PROFILE CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 relative overflow-hidden"
          >
            {/* Background design */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-purple-600/20 to-brand-600/20 backdrop-blur-md border-b border-white/5"></div>
            
            <div className="relative pt-12 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 cursor-pointer relative group" onClick={handleAvatarClick}>
                    <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img 
                      src={profile?.avatar || currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name}`} 
                      className="w-28 h-28 object-cover rounded-full ring-4 ring-[#050510] shadow-xl relative z-10 transition-opacity group-hover:opacity-50"
                      alt="Avatar"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20 pointer-events-none">
                        <Camera size={24} className="text-white drop-shadow-md" />
                    </div>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                </div>
                
                <div className="flex-1 w-full space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">{profile?.name}</h1>
                            <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mt-1">Neural ID: {profile?._id?.slice(-6) || profile?.id?.slice(-6)}</p>
                        </div>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors">
                                <Edit2 size={16} />
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="text-xs text-brand-300 uppercase font-mono tracking-widest mb-2 block">Bio Module</label>
                                <textarea 
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    placeholder="Enter your neural bio..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-500/50 outline-none resize-none min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-brand-300 uppercase font-mono tracking-widest mb-2 block">Interests Node</label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        value={editInterest}
                                        onChange={(e) => setEditInterest(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                                        placeholder="Add interest tag..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500/50 outline-none"
                                    />
                                    <button onClick={addInterest} className="px-3 bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/40 rounded-lg flex items-center justify-center">
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {editInterests.map((interest, i) => (
                                        <span key={i} className="flex items-center gap-1 bg-purple-500/10 text-purple-200 border border-purple-500/20 px-3 py-1 rounded-full text-xs">
                                            {interest}
                                            <button onClick={() => removeInterest(interest)} className="hover:text-red-400 ml-1"><X size={12}/></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleSaveProfile} className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-brand-500/20">
                                    <Save size={14} /> Save Profile
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-zinc-300 text-sm leading-relaxed">{profile?.bio || <span className="text-zinc-600 italic">No bio data uploaded.</span>}</p>
                            
                            {profile?.interests?.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {profile.interests.map((interest, i) => (
                                        <span key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-zinc-300 px-3 py-1 rounded-full text-xs font-medium">
                                            <Hexagon size={10} className="text-brand-400" />
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
          </motion.div>

          {/* USER POSTS FEED */}
          <div className="pt-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <UserIcon size={18} className="text-brand-400" />
                </div>
                <div>
                   <h2 className="text-lg font-bold text-white tracking-tight">Personal Feed</h2>
                   <p className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1"><Sparkles size={10}/> Authenticated Logs</p>
                </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                  <div className="flex justify-center py-12"><Loader size={40} /></div>
              ) : posts.length === 0 ? (
                  <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-zinc-500 text-sm">No neural logs found for this user.</p>
                  </div>
              ) : (
                  posts.map((post) => (
                      <PublicPost 
                        key={post.id} 
                        post={post} 
                        onDelete={handleDeletePost}
                        onLike={() => handleLikePost(post.id)}
                        onStartChat={() => onStartChat(post.author.id, post.content.original)} 
                        onOpenComments={() => onOpenComments(post)} 
                      />
                  ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
