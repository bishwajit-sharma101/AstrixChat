import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, MoreHorizontal, Zap, Play } from 'lucide-react';

const PublicPost = ({ post, onStartChat, onOpenComments }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 mb-4 hover:bg-zinc-900/60 transition-colors group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center cursor-pointer hover:opacity-80">
          <div className="relative flex-shrink-0 w-10 h-10">
            <img 
              src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name}`} 
              className="w-full h-full rounded-full object-cover ring-2 ring-white/5"
              alt="avatar"
            />
            {post.author.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full animate-pulse" />}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{post.author.name}</h3>
            <p className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase">
              {post.timestamp} • {post.originLanguage}
            </p>
          </div>
        </div>
        <button className="text-zinc-600 hover:text-white transition-colors"><MoreHorizontal size={18} /></button>
      </div>

      {/* Content */}
      <div className="mb-4 space-y-3">
        <p className="text-gray-100 text-base leading-relaxed">
          {post.content.translated || post.content.original}
        </p>

        {post.content.translated && (
          <div className="pl-3 border-l-2 border-brand-500/30">
            <p className="text-zinc-500 text-xs font-mono italic">Original: "{post.content.original}"</p>
          </div>
        )}

        {post.mediaType === 'image' && (
          <div className="relative rounded-xl overflow-hidden border border-white/5">
            <img src={post.mediaUrl} alt="post media" className="w-full h-auto max-h-[400px] object-cover" />
          </div>
        )}

        {post.mediaType === 'video' && (
          <div className="relative rounded-xl overflow-hidden border border-white/5 bg-black aspect-video flex items-center justify-center">
            <video src={post.mediaUrl} className="w-full h-full object-cover" controls muted />
            <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-full backdrop-blur-md">
              <Play size={14} className="text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex gap-4">
          <button onClick={() => setIsLiked(!isLiked)} className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-pink-500' : 'text-zinc-400 hover:text-pink-400'}`}>
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            <span>{post.likes + (isLiked ? 1 : 0)}</span>
          </button>
          
          {/* COMMENT BUTTON WIRED UP */}
          <button 
            onClick={onOpenComments}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-blue-400 transition-colors"
          >
            <MessageCircle size={16} />
            <span>{post.comments}</span>
          </button>
        </div>

        <button 
          onClick={() => onStartChat(post.author.id, post.content.original)}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg text-[11px] font-medium text-brand-300 transition-all active:scale-95"
        >
          <Zap size={12} className="fill-current" />
          <span>Neural Link</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PublicPost;