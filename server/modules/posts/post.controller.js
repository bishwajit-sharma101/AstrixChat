const Post = require('./models/post.model');
const User = require('../user-management/models/user.model');
const { GoogleGenAI } = require("@google/genai");
const { TRANSLATION_SYSTEM_PROMPT } = require("../../utils/geminiPrompt");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatar isOnline email')
      .populate('commentsList.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch posts" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'name avatar isOnline email')
      .populate('commentsList.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user posts" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content, targetLanguages, mediaUrl, mediaType } = req.body;
    const authorId = req.user.id; // from auth middleware

    const post = new Post({
      author: authorId,
      content: { original: content, translations: {} },
      targetLanguages: targetLanguages || [],
      mediaUrl,
      mediaType: mediaType || 'text',
      originLanguage: 'en'
    });

    // Translate synchronously for simplicity and immediate feedback,
    // Alternatively, could be offloaded to background job.
    if (targetLanguages && targetLanguages.length > 0 && content) {
      const promises = targetLanguages.map(async (lang) => {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            systemInstruction: TRANSLATION_SYSTEM_PROMPT,
            contents: [{ role: "user", parts: [{ text: `Translate this: "${content}" to ${lang}` }] }],
            generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 1024 }
          });
          const translatedText = response.text?.trim();
          if (translatedText) {
            post.content.translations.set(lang, translatedText);
          }
        } catch (err) {
          console.warn(`Gemini translation failed for ${lang}, falling back to local model. Error:`, err.message);
          try {
            const localRes = await fetch("http://127.0.0.1:7861/translate_text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: content,
                    target_lang: lang
                })
            });
            const localData = await localRes.json();
            const localTranslated = localData.translation || localData.translation_text;
            if (localTranslated) {
                post.content.translations.set(lang, localTranslated);
                console.log(`Fallback local translation succeeded for ${lang}`);
            }
          } catch (localErr) {
            console.error(`Local fallback also failed for ${lang}:`, localErr.message);
          }
        }
      });
      await Promise.all(promises);
    }

    await post.save();
    const populatedPost = await post.populate('author', 'name avatar isOnline');

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ success: false, error: "Failed to create post" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Check if the user attempting to delete is the author of the post
    if (post.author.toString() !== req.user.id) {
       return res.status(401).json({ success: false, error: "User not authorized to delete this post" });
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ success: false, error: "Failed to delete post" });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    const userId = req.user.id;
    const isLiked = post.likedBy.includes(userId);
    
    if (isLiked) {
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }
    
    await post.save();
    res.status(200).json({ success: true, likes: post.likes, likedBy: post.likedBy });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, error: "Failed to toggle like" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    const currentUser = await User.findById(req.user.id);

    const newComment = {
      user: req.user.id,
      text,
      time: new Date()
    };
    
    post.commentsList.push(newComment);
    post.comments += 1;
    await post.save();
    
    res.status(200).json({ 
      success: true, 
      comment: {
        id: post.commentsList[post.commentsList.length - 1]._id,
        user: currentUser.name,
        avatar: currentUser.avatar,
        text,
        time: 'Just now'
      }
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, error: "Failed to add comment" });
  }
};
