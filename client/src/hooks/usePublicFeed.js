import { useState, useEffect } from 'react';

export const usePublicFeed = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Discovery Data for Sidebar
  const [discoveryData] = useState({
    publicRooms: [
      { id: 'g1', name: 'Global Tech', members: 128, active: true },
      { id: 'g2', name: 'Art & Design', members: 45, active: false },
      { id: 'g3', name: 'Neural Research', members: 89, active: true },
    ],
    publicChats: [
      { id: 'c1', user: 'Sato Kenji', topic: 'Modern Architecture', status: 'Live' },
      { id: 'c2', user: 'Elena Rossi', topic: 'Neural Networks', status: 'Active' },
    ]
  });

  // --- 1. CREATE POST ---
  const createPost = (newPostData) => {
    const post = {
      id: Date.now(),
      author: { 
        name: 'You', 
        id: 'me', 
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 
        isOnline: true 
      },
      content: { original: newPostData.content, translated: null },
      mediaType: newPostData.media ? 'image' : 'text',
      mediaUrl: newPostData.media ? URL.createObjectURL(newPostData.media) : null,
      timestamp: 'Just now',
      originLanguage: 'English',
      likes: 0,
      comments: 0,
      commentsList: [] // Local storage for comments
    };

    setPosts(prev => [post, ...prev]);
  };

  // --- 2. ADD COMMENT ---
  const addComment = (postId, commentText) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: Date.now(),
          user: 'You',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
          text: commentText,
          time: 'Just now'
        };
        return { 
          ...post, 
          comments: post.comments + 1,
          commentsList: [...(post.commentsList || []), newComment] 
        };
      }
      return post;
    }));
  };

  const fetchMorePosts = async () => {
    setIsLoading(true);
    setTimeout(() => {
      const mock = [
        { 
          id: 1, 
          author: { name: 'Sarah Jenkins', id: 'u7', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', isOnline: true }, 
          content: { original: 'Check out this sunset in California!', translated: 'कैलिफोर्निया में इस सूर्यास्त को देखें!' },
          mediaType: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          timestamp: '2m ago',
          originLanguage: 'English',
          likes: 42,
          comments: 1,
          commentsList: [
             { id: 101, user: 'Tom', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom', text: 'Stunning view!', time: '1m ago' }
          ]
        },
        { 
          id: 2, 
          author: { name: 'Sato Kenji', id: 'u2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kenji' }, 
          content: { original: '東京の夜。', translated: 'Night in Tokyo.' },
          mediaType: 'video',
          mediaUrl: '/night.mp4',
          timestamp: '8m ago',
          originLanguage: 'Japanese',
          likes: 128,
          comments: 0,
          commentsList: []
        },
        { 
          id: 3, 
          author: { name: 'Elena Rossi', id: 'u3', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' }, 
          content: { original: 'Qualcuno vuole parlare di architettura moderna?', translated: 'Does anyone want to talk about modern architecture?' },
          mediaType: 'text',
          timestamp: '15m ago',
          originLanguage: 'Italian',
          likes: 15,
          comments: 0,
          commentsList: []
        }
      ];
      setPosts(mock);
      setIsLoading(false);
    }, 800);
  };

  useEffect(() => { fetchMorePosts(); }, []);

  return { posts, isLoading, discoveryData, fetchMorePosts, createPost, addComment };
};