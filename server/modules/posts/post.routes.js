const express = require('express');
const router = express.Router();
const postController = require('./post.controller');
const { protect } = require('../auth/auth.middleware');

router.route('/')
  .get(protect, postController.getPosts)
  .post(protect, postController.createPost);

router.route('/user/:userId')
  .get(protect, postController.getUserPosts);

router.route('/:postId')
  .delete(protect, postController.deletePost);

router.post('/:postId/like', protect, postController.toggleLike);
router.post('/:postId/comment', protect, postController.addComment);

module.exports = router;
