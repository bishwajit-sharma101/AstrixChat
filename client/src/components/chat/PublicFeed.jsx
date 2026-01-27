import React, { useRef } from 'react';
import PostComposer from './PostComposer';
import PublicPost from './PublicPost';
import Loader from '../common/Loader';

const PublicFeed = ({ posts, isLoading, onCreatePost, onStartChat, onOpenComments }) => { 
  const scrollRef = useRef(null);

  const handleStartChat = (userId, contextTopic) => {
    if (onStartChat) {
      onStartChat(userId, `Regarding your post: ${contextTopic}`);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col relative bg-black/90 overflow-hidden" ref={scrollRef}>
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="p-6 border-b border-white/5 relative z-10 backdrop-blur-sm bg-black/20 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Public Signal</h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">Global neural network feed</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          {/* Post Composer wires up to createPost */}
          <PostComposer onPost={onCreatePost} />
          
          <div className="space-y-4 pb-20">
            {posts.map((post) => (
              <PublicPost 
                key={post.id} 
                post={post} 
                onStartChat={() => handleStartChat(post.author.id, post.content.original)} 
                onOpenComments={() => onOpenComments(post)} // Pass specific post to open comments
              />
            ))}

            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader size={40} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFeed;