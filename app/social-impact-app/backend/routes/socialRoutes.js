const express = require('express');
const router = express.Router();
const {
  followTarget,
  unfollowTarget,
  approveFollowRequest,
  rejectFollowRequest,
  removeFollower,
  blockUser,
  unblockUser,
  getPendingRequests,
  getFollowing,
  createPost,
  getFeed,
  getUserPosts,
  likePost,
  commentOnPost,
  getPostComments,
  deletePost,
  updatePrivacySettings,
  searchUsersAndNGOs,
  getFollowSuggestions,
  getUserPublicProfile,
  getNGOPosts
} = require('../controllers/socialController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Follow & Relationship Endpoints
router.post('/follow/:targetId', protect, followTarget);
router.delete('/follow/:targetId', protect, unfollowTarget);
router.put('/follow/requests/:requesterId/approve', protect, approveFollowRequest);
router.put('/follow/requests/:requesterId/reject', protect, rejectFollowRequest);
router.delete('/followers/:followerId', protect, removeFollower);
router.post('/block/:userId', protect, blockUser);
router.delete('/block/:userId', protect, unblockUser);
router.get('/follow/requests', protect, getPendingRequests);
router.get('/following', protect, getFollowing);
router.get('/follow/suggestions', protect, getFollowSuggestions);
router.get('/search', protect, searchUsersAndNGOs);
router.get('/user/:targetId', optionalAuth || protect, getUserPublicProfile);

// Post & Unified Feed Endpoints
router.post('/posts', protect, upload.single('image'), createPost);
router.get('/feed', protect, getFeed);
router.get('/posts/user/:userId', optionalAuth || protect, getUserPosts);
router.get('/posts/:ngoId', getNGOPosts);
router.delete('/posts/:postId', protect, deletePost);
router.post('/posts/:postId/like', protect, likePost);
router.post('/posts/:postId/comment', protect, commentOnPost);
router.get('/posts/:postId/comments', getPostComments);

// Privacy Settings Endpoint
router.put('/user/privacy', protect, updatePrivacySettings);

module.exports = router;
