const Follow = require('../models/Follow');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const NGOFollow = require('../models/NGOFollow');
const NGOPost = require('../models/NGOPost');
const Notification = require('../models/Notification');
const NGO = require('../models/NGO');
const User = require('../models/User');
const Event = require('../models/Event');

// Helper to update user counts
const updateUserCounts = async (userId) => {
  try {
    const followerCount = await Follow.countDocuments({ followingId: userId, followingType: 'user', status: 'active' });
    const followingCount = await Follow.countDocuments({ followerId: userId, status: 'active' });
    const postCount = await Post.countDocuments({ authorId: userId, authorType: 'user', isDeleted: false });
    
    await User.findByIdAndUpdate(userId, { followerCount, followingCount, postCount });
  } catch (err) {
    console.error('Error updating user counts:', err.message);
  }
};

// --- Follow & Relationship Controllers ---

// @desc Follow a User or NGO
// @route POST /api/social/follow/:targetId
const followTarget = async (req, res) => {
  try {
    const { targetId } = req.params;
    const currentUserId = req.user._id;

    if (targetId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if target is an NGO first
    let ngo = await NGO.findById(targetId);
    if (!ngo) ngo = await NGO.findOne({ userId: targetId });

    if (ngo) {
      // Follow NGO Flow
      let follow = await Follow.findOne({ followerId: currentUserId, followingId: ngo._id });
      if (follow && follow.status === 'active') {
        return res.json({ status: 'active', message: `Already following ${ngo.name}` });
      }

      if (!follow) {
        follow = await Follow.create({
          followerId: currentUserId,
          followingId: ngo._id,
          followingType: 'ngo',
          status: 'active',
          approvedAt: new Date()
        });
      } else {
        follow.status = 'active';
        follow.approvedAt = new Date();
        await follow.save();
      }

      // Legacy sync
      await NGOFollow.findOneAndUpdate(
        { userId: currentUserId, ngoId: ngo._id },
        { userId: currentUserId, ngoId: ngo._id },
        { upsert: true }
      );

      ngo.followerCount = (ngo.followerCount || 0) + 1;
      await ngo.save();
      await updateUserCounts(currentUserId);

      return res.json({ status: 'active', message: `Now following ${ngo.name}` });
    }

    // Follow User Flow
    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Check block list
    if (req.user.blockedUsers?.includes(targetUser._id) || targetUser.blockedUsers?.includes(currentUserId)) {
      return res.status(400).json({ message: 'Cannot perform this action' });
    }

    let follow = await Follow.findOne({ followerId: currentUserId, followingId: targetUser._id });
    if (follow) {
      if (follow.status === 'active') return res.json({ status: 'active', message: `Already following ${targetUser.name}` });
      if (follow.status === 'pending') return res.json({ status: 'pending', message: 'Follow request already pending' });
    }

    if (targetUser.isPrivate) {
      // Private Account -> Request sent
      if (!follow) {
        follow = await Follow.create({
          followerId: currentUserId,
          followingId: targetUser._id,
          followingType: 'user',
          status: 'pending',
          requestedAt: new Date()
        });
      } else {
        follow.status = 'pending';
        follow.requestedAt = new Date();
        await follow.save();
      }

      // Send follow request notification
      await Notification.create({
        userId: targetUser._id,
        senderId: currentUserId,
        type: 'follow_request',
        referenceId: currentUserId,
        message: `🔔 ${req.user.name} requested to follow you.`
      });

      return res.json({ status: 'pending', message: 'Follow request sent' });
    } else {
      // Public Account -> Instant follow
      if (!follow) {
        follow = await Follow.create({
          followerId: currentUserId,
          followingId: targetUser._id,
          followingType: 'user',
          status: 'active',
          approvedAt: new Date()
        });
      } else {
        follow.status = 'active';
        follow.approvedAt = new Date();
        await follow.save();
      }

      await updateUserCounts(targetUser._id);
      await updateUserCounts(currentUserId);

      // Send new follower notification
      await Notification.create({
        userId: targetUser._id,
        senderId: currentUserId,
        type: 'new_follower',
        referenceId: currentUserId,
        message: `👤 ${req.user.name} started following you.`
      });

      return res.json({ status: 'active', message: `Now following ${targetUser.name}` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Unfollow User or NGO
// @route DELETE /api/social/follow/:targetId
const unfollowTarget = async (req, res) => {
  try {
    const { targetId } = req.params;
    const currentUserId = req.user._id;

    // Check if target is an NGO first
    let ngo = await NGO.findById(targetId);
    if (!ngo) ngo = await NGO.findOne({ userId: targetId });

    if (ngo) {
      await Follow.findOneAndDelete({ followerId: currentUserId, followingId: ngo._id });
      await NGOFollow.findOneAndDelete({ userId: currentUserId, ngoId: ngo._id });

      ngo.followerCount = Math.max(0, (ngo.followerCount || 0) - 1);
      await ngo.save();
      await updateUserCounts(currentUserId);

      return res.json({ message: `Unfollowed ${ngo.name}` });
    }

    // Unfollow User
    const follow = await Follow.findOneAndDelete({ followerId: currentUserId, followingId: targetId });
    if (!follow) return res.status(400).json({ message: 'Not following this user' });

    await updateUserCounts(targetId);
    await updateUserCounts(currentUserId);

    res.json({ message: 'Unfollowed user successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Approve Follow Request (Private Account)
// @route PUT /api/social/follow/requests/:requesterId/approve
const approveFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const currentUserId = req.user._id;

    const follow = await Follow.findOne({ followerId: requesterId, followingId: currentUserId, status: 'pending' });
    if (!follow) return res.status(404).json({ message: 'Follow request not found' });

    follow.status = 'active';
    follow.approvedAt = new Date();
    await follow.save();

    await updateUserCounts(currentUserId);
    await updateUserCounts(requesterId);

    // Send notification to requester
    await Notification.create({
      userId: requesterId,
      senderId: currentUserId,
      type: 'follow_request_approved',
      referenceId: currentUserId,
      message: `✅ ${req.user.name} accepted your follow request.`
    });

    res.json({ message: 'Follow request approved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Reject Follow Request (Private Account)
// @route PUT /api/social/follow/requests/:requesterId/reject
const rejectFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const currentUserId = req.user._id;

    const follow = await Follow.findOneAndDelete({ followerId: requesterId, followingId: currentUserId, status: 'pending' });
    if (!follow) return res.status(404).json({ message: 'Follow request not found' });

    res.json({ message: 'Follow request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Remove Follower (Private Account)
// @route DELETE /api/social/followers/:followerId
const removeFollower = async (req, res) => {
  try {
    const { followerId } = req.params;
    const currentUserId = req.user._id;

    const follow = await Follow.findOneAndDelete({ followerId: followerId, followingId: currentUserId, status: 'active' });
    if (!follow) return res.status(404).json({ message: 'Follower not found' });

    await updateUserCounts(currentUserId);
    await updateUserCounts(followerId);

    res.json({ message: 'Follower removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Block User
// @route POST /api/social/block/:userId
const blockUser = async (req, res) => {
  try {
    const { userId: targetId } = req.params;
    const currentUserId = req.user._id;

    if (targetId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    await User.findByIdAndUpdate(currentUserId, { $addToSet: { blockedUsers: targetId } });

    // Remove active or pending follows in both directions
    await Follow.deleteMany({
      $or: [
        { followerId: currentUserId, followingId: targetId },
        { followerId: targetId, followingId: currentUserId }
      ]
    });

    await updateUserCounts(currentUserId);
    await updateUserCounts(targetId);

    res.json({ message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Unblock User
// @route DELETE /api/social/block/:userId
const unblockUser = async (req, res) => {
  try {
    const { userId: targetId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: targetId } });
    res.json({ message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get pending follow requests
// @route GET /api/social/follow/requests
const getPendingRequests = async (req, res) => {
  try {
    const requests = await Follow.find({ followingId: req.user._id, status: 'pending' })
      .populate('followerId', 'name username profilePhoto bio isPrivate')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get my following list
// @route GET /api/social/following
const getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ followerId: req.user._id, status: 'active' });
    
    // Also include legacy NGOFollow
    const legacyNgoFollows = await NGOFollow.find({ userId: req.user._id }).populate('ngoId', 'name logo description followerCount');

    const userFollows = await Follow.find({ followerId: req.user._id, status: 'active', followingType: 'user' })
      .populate('followingId', 'name username profilePhoto bio isPrivate');

    const ngoFollows = await Follow.find({ followerId: req.user._id, status: 'active', followingType: 'ngo' })
      .populate('followingId', 'name logo description followerCount');

    const combinedNgos = [
      ...ngoFollows.map(f => f.followingId).filter(Boolean),
      ...legacyNgoFollows.map(f => f.ngoId).filter(Boolean)
    ];

    res.json({
      users: userFollows.map(f => f.followingId).filter(Boolean),
      ngos: Array.from(new Map(combinedNgos.map(n => [n._id.toString(), n])).values())
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Post & Unified Feed Controllers ---

// @desc Create a post (User or NGO)
// @route POST /api/social/posts
const createPost = async (req, res) => {
  try {
    const { content, visibility = 'public', linkedEventId, locationTag } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }
    if (content.trim().length > 5000) {
      return res.status(400).json({ message: 'Post content cannot exceed 5000 characters' });
    }

    let mediaUrls = [];
    let imageUrl = req.body.imageUrl || "";

    if (req.file) {
      imageUrl = req.file.path;
      mediaUrls.push(req.file.path);
    } else if (req.files && Array.isArray(req.files)) {
      mediaUrls = req.files.map(f => f.path);
      imageUrl = mediaUrls[0] || "";
    }

    let authorType = 'user';
    let authorId = req.user._id;

    // Check if posted on behalf of an NGO
    if (req.user.role === 'ngo') {
      const ngo = await NGO.findOne({ userId: req.user._id });
      if (ngo && req.body.asNgo !== 'false') {
        authorType = 'ngo';
        authorId = ngo._id;
      }
    }

    const post = await Post.create({
      authorId,
      authorType,
      content,
      mediaUrls,
      imageUrl,
      locationTag: locationTag || '',
      visibility,
      linkedEventId: linkedEventId || null
    });

    if (authorType === 'user') {
      await updateUserCounts(req.user._id);
    }

    // Populate post author details
    const populatedPost = await Post.findById(post._id)
      .populate('authorId', 'name username profilePhoto logo isPrivate')
      .populate('linkedEventId', 'title startDate endDate address');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get Unified Social Feed
// @route GET /api/social/feed
const getFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);
    const blockedUserIds = currentUser?.blockedUsers || [];

    // Get active follows
    const activeFollows = await Follow.find({ followerId: currentUserId, status: 'active' });
    const followedUserIds = activeFollows.filter(f => f.followingType === 'user').map(f => f.followingId);
    const followedNgoIds = activeFollows.filter(f => f.followingType === 'ngo').map(f => f.followingId);

    // Add legacy NGO follows
    const legacyNgoFollows = await NGOFollow.find({ userId: currentUserId }).select('ngoId');
    legacyNgoFollows.forEach(f => {
      if (!followedNgoIds.some(id => id.toString() === f.ngoId.toString())) {
        followedNgoIds.push(f.ngoId);
      }
    });

    // Unified Post Query
    const posts = await Post.find({
      isDeleted: false,
      $or: [
        // 1. Own posts
        { authorId: currentUserId, authorType: 'user' },
        // 2. Posts from followed NGOs
        { authorId: { $in: followedNgoIds }, authorType: 'ngo' },
        // 3. Posts from followed users (public or followers_only)
        { authorId: { $in: followedUserIds, $nin: blockedUserIds }, authorType: 'user' },
        // 4. Public posts from non-private users
        {
          authorType: 'user',
          visibility: 'public',
          authorId: { $nin: blockedUserIds }
        }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('authorId', 'name username profilePhoto logo isPrivate')
    .populate('linkedEventId', 'title startDate endDate address coinsReward')
    .populate('likes', 'name profilePhoto');

    // Also fetch legacy NGOPost items if any and merge
    const legacyNgoPosts = await NGOPost.find({ ngoId: { $in: followedNgoIds } })
      .populate('ngoId', 'name logo')
      .populate('eventId', 'title startDate endDate coinsReward address description')
      .sort({ createdAt: -1 })
      .limit(20);

    // Normalize legacy NGO posts format
    const formattedLegacyPosts = legacyNgoPosts.map(p => ({
      _id: p._id,
      authorId: p.ngoId,
      authorType: 'ngo',
      content: p.content,
      imageUrl: p.imageUrl,
      visibility: 'public',
      linkedEventId: p.eventId,
      likes: p.likes,
      likeCount: p.likes?.length || 0,
      commentCount: p.comments?.length || 0,
      comments: p.comments,
      createdAt: p.createdAt,
      isLegacy: true
    }));

    // Combine & Sort by newest
    const combinedFeed = [...posts, ...formattedLegacyPosts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(combinedFeed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get User Posts
// @route GET /api/social/posts/user/:userId
const getUserPosts = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user?._id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const isSelf = currentUserId && currentUserId.toString() === targetUserId.toString();
    let isFollower = false;

    if (currentUserId && !isSelf) {
      const follow = await Follow.findOne({ followerId: currentUserId, followingId: targetUserId, status: 'active' });
      if (follow) isFollower = true;
    }

    if (targetUser.isPrivate && !isSelf && !isFollower) {
      return res.json([]); // Return empty list for private accounts if not an approved follower
    }

    let query = { authorId: targetUserId, authorType: 'user', isDeleted: false };
    if (!isSelf && !isFollower) {
      query.visibility = 'public';
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate('authorId', 'name username profilePhoto isPrivate')
      .populate('linkedEventId', 'title startDate endDate address');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Like a Post
// @route POST /api/social/posts/:postId/like
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user._id;

    let post = await Post.findById(postId);
    if (!post) {
      // Check legacy NGOPost
      post = await NGOPost.findById(postId);
      if (!post) return res.status(404).json({ message: 'Post not found' });

      if (post.likes.includes(currentUserId)) {
        post.likes = post.likes.filter(id => id.toString() !== currentUserId.toString());
      } else {
        post.likes.push(currentUserId);
      }
      await post.save();
      return res.json(post);
    }

    const alreadyLiked = post.likes.some(id => id.toString() === currentUserId.toString());
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== currentUserId.toString());
    } else {
      post.likes.push(currentUserId);

      // Create notification for author if not self
      if (post.authorId.toString() !== currentUserId.toString()) {
        await Notification.create({
          userId: post.authorId,
          senderId: currentUserId,
          type: 'post_liked',
          referenceId: post._id,
          message: `❤️ ${req.user.name} liked your post.`
        });
      }
    }

    post.likeCount = post.likes.length;
    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Comment on a Post
// @route POST /api/social/posts/:postId/comment
const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, content } = req.body;
    const commentText = text || content;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    if (commentText.trim().length > 1000) {
      return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' });
    }

    let post = await Post.findById(postId);
    if (!post) {
      // Legacy NGOPost fallback
      const legacyPost = await NGOPost.findById(postId);
      if (!legacyPost) return res.status(404).json({ message: 'Post not found' });

      legacyPost.comments.push({ user: req.user._id, text: commentText });
      await legacyPost.save();

      const updatedLegacy = await NGOPost.findById(postId)
        .populate('ngoId', 'name logo')
        .populate('comments.user', 'name profilePhoto profilePicture');
      return res.json(updatedLegacy);
    }

    const comment = await Comment.create({
      postId: post._id,
      authorId: req.user._id,
      content: commentText
    });

    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    // Create notification if author is not self
    if (post.authorId.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: post.authorId,
        senderId: req.user._id,
        type: 'post_commented',
        referenceId: post._id,
        message: `💬 ${req.user.name} commented on your post: "${commentText.slice(0, 30)}..."`
      });
    }

    const populatedPost = await Post.findById(post._id)
      .populate('authorId', 'name username profilePhoto logo isPrivate')
      .populate('linkedEventId', 'title startDate endDate address');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get comments for a post
// @route GET /api/social/posts/:postId/comments
const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId, isDeleted: false })
      .populate('authorId', 'name username profilePhoto')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete Post
// @route DELETE /api/social/posts/:postId
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    post.isDeleted = true;
    await post.save();

    if (post.authorType === 'user') {
      await updateUserCounts(req.user._id);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Privacy Settings & Search Controllers ---

// @desc Update user privacy settings & username
// @route PUT /api/social/user/privacy
const updatePrivacySettings = async (req, res) => {
  try {
    const { isPrivate, username } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof isPrivate === 'boolean') {
      user.isPrivate = isPrivate;
    }

    if (username && username !== user.username) {
      const cleanUsername = username.toLowerCase().trim();
      const existing = await User.findOne({ username: cleanUsername });
      if (existing && existing._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = cleanUsername;
    }

    await user.save();
    res.json({ message: 'Privacy settings updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Search Users and NGOs
// @route GET /api/social/search
const searchUsersAndNGOs = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json({ users: [], ngos: [] });

    const regex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      $or: [{ name: regex }, { username: regex }]
    })
    .select('name username profilePhoto bio isPrivate followerCount')
    .limit(10);

    const ngos = await NGO.find({
      name: regex
    })
    .select('name logo description followerCount isVerified')
    .limit(10);

    res.json({ users, ngos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get follow suggestions
// @route GET /api/social/follow/suggestions
const getFollowSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const existingFollows = await Follow.find({ followerId: currentUserId }).select('followingId');
    const ngoFollows = await NGOFollow.find({ userId: currentUserId }).select('ngoId');
    const myNGOs = await NGO.find({ userId: currentUserId }).select('_id');

    const followedIds = [
      ...existingFollows.map(f => f.followingId),
      ...ngoFollows.map(nf => nf.ngoId),
      ...myNGOs.map(m => m._id)
    ];

    const users = await User.find({
      _id: { $nin: [...followedIds, currentUserId] }
    })
    .select('name username profilePhoto bio isPrivate followerCount city')
    .limit(10);

    const ngos = await NGO.find({
      _id: { $nin: [...followedIds] },
      userId: { $ne: currentUserId }
    })
    .select('name logo description followerCount isVerified')
    .limit(10);

    res.json({ users, ngos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get public profile of a user or NGO
// @route GET /api/social/user/:targetId
const getUserPublicProfile = async (req, res) => {
  try {
    const { targetId } = req.params;
    const currentUserId = req.user?._id;

    // Check if target is User
    let targetUser = await User.findById(targetId).select('-password');
    let isNGO = false;
    let targetNGO = null;

    if (!targetUser) {
      targetNGO = await NGO.findById(targetId).populate('userId', 'name email profilePhoto');
      if (targetNGO) isNGO = true;
      else {
        targetNGO = await NGO.findOne({ userId: targetId }).populate('userId', 'name email profilePhoto');
        if (targetNGO) isNGO = true;
      }
    }

    if (!targetUser && !targetNGO) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Determine relationship
    let relationship = 'none';
    if (currentUserId) {
      if (targetUser && currentUserId.toString() === targetUser._id.toString()) {
        relationship = 'self';
      } else {
        const follow = await Follow.findOne({
          followerId: currentUserId,
          followingId: isNGO ? targetNGO._id : targetUser._id
        });
        if (follow) {
          relationship = follow.status; // 'active' or 'pending'
        }
      }
    }

    if (isNGO) {
      const posts = await Post.find({ authorId: targetNGO._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(10);

      return res.json({
        type: 'ngo',
        profile: {
          _id: targetNGO._id,
          name: targetNGO.name,
          logo: targetNGO.logo,
          description: targetNGO.description,
          phone: targetNGO.phone,
          email: targetNGO.email,
          registrationNumber: targetNGO.registrationNumber,
          isVerified: targetNGO.isVerified,
          followerCount: targetNGO.followerCount || 0
        },
        relationship,
        posts
      });
    }

    // Fetch user public posts
    let posts = [];
    if (!targetUser.isPrivate || relationship === 'active' || relationship === 'self') {
      posts = await Post.find({ authorId: targetUser._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    return res.json({
      type: 'user',
      profile: {
        _id: targetUser._id,
        name: targetUser.name,
        username: targetUser.username || targetUser.name.toLowerCase().replace(/\s+/g, '_'),
        profilePhoto: targetUser.profilePhoto,
        bio: targetUser.bio || '',
        occupation: targetUser.occupation || '',
        city: targetUser.city || '',
        institute: targetUser.institute || '',
        interests: targetUser.interests || [],
        rank: targetUser.rank || '---',
        coinBalance: targetUser.coinBalance || 0,
        followerCount: targetUser.followerCount || 0,
        followingCount: targetUser.followingCount || 0,
        postCount: targetUser.postCount || 0,
        isPrivate: targetUser.isPrivate || false,
        createdAt: targetUser.createdAt
      },
      relationship,
      posts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Backward Compatibility Aliases
const followNGO = followTarget;
const unfollowNGO = unfollowTarget;
const getNGOPosts = async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.params.ngoId, isDeleted: false })
      .populate('authorId', 'name logo')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
  followNGO,
  unfollowNGO,
  getNGOPosts
};
