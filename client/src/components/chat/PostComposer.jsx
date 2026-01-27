import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Sparkles, Globe, X } from 'lucide-react';

const PostComposer = ({ onPost }) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsExpanded(true);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    onPost({ 
      content, 
      media: selectedFile
    });

    setContent('');
    clearFile();
    setIsExpanded(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-10">
      <motion.div 
        layout
        className={`bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${isExpanded ? 'ring-2 ring-purple-500/50' : 'hover:border-purple-500/30'}`}
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <textarea
                placeholder="Share with the world..."
                className="w-full bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none min-h-[50px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                rows={isExpanded ? 3 : 1}
              />
            </div>
          </div>

          {/* Image Preview */}
          <AnimatePresence>
            {previewUrl && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative mt-2 rounded-lg overflow-hidden w-fit max-h-60"
              >
                <img src={previewUrl} alt="Preview" className="h-full max-h-60 rounded-lg object-contain border border-white/10" />
                <button type="button" onClick={clearFile} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between mt-4 pt-4 border-t border-white/5"
              >
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*,video/*"
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-purple-400">
                    <ImageIcon size={20} />
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full text-xs text-purple-300 border border-purple-500/20">
                    <Globe size={12} />
                    <span>Global Translate Active</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!content.trim() && !selectedFile}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                >
                  <Sparkles size={16} />
                  <span>Post</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
};

export default PostComposer;