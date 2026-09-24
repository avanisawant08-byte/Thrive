import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import UserAvatar from '../components/UserAvatar';
import UserProfileModal from '../components/UserProfileModal';
import Loader from '../components/Loader';

const IMPACT_CATEGORIES = [
  { id: 'tree_plantation', label: 'Tree Plantation', icon: '🌱' },
  { id: 'blood_donation', label: 'Blood Donation', icon: '🩸' },
  { id: 'clean_up', label: 'City Clean-Up', icon: '🏖️' },
  { id: 'food_drive', label: 'Food Drive', icon: '🍛' },
  { id: 'volunteering', label: 'Volunteering', icon: '📖' },
  { id: 'story', label: 'Impact Story', icon: '✨' },
];

const EMOJI_REACTIONS = ['❤️', '🙌', '🌱', '👏', '🔥', '💪'];

const SocialFeed = () => {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('for_you'); // 'for_you' | 'following' | 'ngo' | 'discover'

  // Post creation state
  const [postContent, setPostContent] = useState('');
  const [postVisibility, setPostVisibility] = useState('public');
  const [locationTag, setLocationTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('story');
  const [postFile, setPostFile] = useState(null);
  const [postPreview, setPostPreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Comments state
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentTextMap, setCommentTextMap] = useState({});
  const [commentLoading, setCommentLoading] = useState(false);

  // Double-tap heart animation state { [postId]: boolean }
  const [likeAnimations, setLikeAnimations] = useState({});

  // Profile Preview Modal state
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);

  // Discover & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], ngos: [] });
  const [suggestions, setSuggestions] = useState({ users: [], ngos: [] });
  const [followingState, setFollowingState] = useState({}); // { [id]: 'active' | 'pending' | 'none' }

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (_) {}
    }

    const loadInitialData = async () => {
      const token = localStorage.getItem('token');
      const promises = [fetchFeed()];
      if (token) {
        promises.push(fetchSuggestions());
        promises.push(fetchFollowingList());
      }
      await Promise.allSettled(promises);
    };

    loadInitialData();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await API.get('/social/feed');
      setPosts(response.data || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await API.get('/social/follow/suggestions');
      setSuggestions(res.data || { users: [], ngos: [] });
    } catch (_) {}
  };

  const fetchFollowingList = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await API.get('/social/following');
      const stateObj = {};
      (res.data?.users || []).forEach(u => {
        stateObj[u._id || u] = 'active';
      });
      (res.data?.ngos || []).forEach(n => {
        stateObj[n._id || n] = 'active';
      });
      setFollowingState(stateObj);
    } catch (_) {}
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostFile(file);
      setPostPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setPostFile(null);
    setPostPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePostSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to share impact stories');
      return;
    }
    if (!postContent.trim() && !postFile) return;
    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      formData.append('visibility', postVisibility);
      if (locationTag) formData.append('locationTag', locationTag);
      if (selectedCategory) formData.append('category', selectedCategory);
      if (postFile) formData.append('image', postFile);

      await API.post('/social/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Impact story posted! 🚀');
      setPostContent('');
      setLocationTag('');
      setPostFile(null);
      setPostPreview(null);
      setPostVisibility('public');
      setIsComposerOpen(false);
      fetchFeed();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const triggerLikeAnimation = (postId) => {
    setLikeAnimations(prev => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setLikeAnimations(prev => ({ ...prev, [postId]: false }));
    }, 900);
  };

  const handleLike = async (postId, triggerDoubleTap = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to like posts');
      return;
    }
    if (triggerDoubleTap) {
      triggerLikeAnimation(postId);
    }
    try {
      const res = await API.post(`/social/posts/${postId}/like`);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const likesList = res.data.likes || [];
          return {
            ...post,
            likes: likesList,
            likeCount: likesList.length
          };
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const toggleComments = async (postId) => {
    if (commentingOn === postId) {
      setCommentingOn(null);
      return;
    }
    setCommentingOn(postId);
    try {
      const res = await API.get(`/social/posts/${postId}/comments`);
      setCommentsMap(prev => ({ ...prev, [postId]: res.data }));
    } catch (_) {}
  };

  const handleCommentSubmit = async (postId, textOverride = null) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to comment');
      return;
    }
    const text = textOverride || commentTextMap[postId];
    if (!text || !text.trim()) return;
    setCommentLoading(true);
    try {
      await API.post(`/social/posts/${postId}/comment`, { text });
      setCommentTextMap(prev => ({ ...prev, [postId]: '' }));
      // Refetch comments for this post
      const res = await API.get(`/social/posts/${postId}/comments`);
      setCommentsMap(prev => ({ ...prev, [postId]: res.data }));
      // Increment comment count locally
      setPosts(posts.map(p => p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
      toast.success('Comment shared');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleFollowToggle = async (targetId, e = null) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to follow users and NGOs');
      return;
    }
    const currentState = followingState[targetId] || 'none';
    try {
      if (currentState === 'active' || currentState === 'pending') {
        await API.delete(`/social/follow/${targetId}`);
        setFollowingState(prev => ({ ...prev, [targetId]: 'none' }));
        setUser(u => u ? { ...u, followingCount: Math.max(0, (u.followingCount || 1) - 1) } : null);
        toast.info('Unfollowed');
      } else {
        const res = await API.post(`/social/follow/${targetId}`);
        const newStatus = res.data.status || 'active';
        setFollowingState(prev => ({ ...prev, [targetId]: newStatus }));
        if (newStatus === 'active') {
          setUser(u => u ? { ...u, followingCount: (u.followingCount || 0) + 1 } : null);
        }
        toast.success(res.data.message || (newStatus === 'pending' ? 'Request sent' : 'Following!'));
      }
      fetchFeed();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  // Filter out users/NGOs that are already followed or is self
  const availableUserSuggestions = (suggestions.users || []).filter(u => 
    u._id !== user?._id && followingState[u._id] !== 'active'
  );
  const availableNgoSuggestions = (suggestions.ngos || []).filter(n => 
    n._id !== user?._id && followingState[n._id] !== 'active'
  );

  const handleShare = (post) => {
    navigator.clipboard.writeText(`${window.location.origin}/social-feed#${post._id}`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.85 } });
    toast.success('Story link copied to clipboard! 📋');
  };

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults({ users: [], ngos: [] });
      return;
    }
    try {
      const res = await API.get(`/social/search?q=${encodeURIComponent(val)}`);
      setSearchResults(res.data);
    } catch (_) {}
  };

  // Filter posts based on active tab
  const filteredPosts = posts.filter(post => {
    if (tab === 'following') {
      const authorId = post.authorId?._id || post.authorId || post.ngoId?._id || post.ngoId;
      return followingState[authorId] === 'active' || (user && (authorId === user._id));
    }
    if (tab === 'ngo') {
      return post.authorType === 'ngo' || !!post.ngoId;
    }
    return true; // 'for_you'
  });

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-32 relative">
      
      {/* Top Stories / Changemaker Spotlight Bar */}
      <section className="mb-8">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-2 scrollbar-none">
          {/* User Own Spotlight / Add Story */}
          <div 
            onClick={() => setIsComposerOpen(true)}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
          >
            <div className="w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-primary-container group-hover:border-primary transition-all flex items-center justify-center relative flex-shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
                <UserAvatar 
                  src={user?.profilePhoto} 
                  name={user?.name || 'Me'} 
                  size="w-full h-full"
                  iconSize="text-2xl"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xs font-black">add</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-on-surface-variant group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
              Share Story
            </span>
          </div>

          {/* Suggested Changemakers Stories */}
          {[...(suggestions.users || []), ...(suggestions.ngos || [])].map((item, idx) => {
            const isNgo = !!item.description || !item.username;
            const photo = item.profilePhoto || item.logo;
            const name = item.name || 'Member';

            return (
              <div 
                key={item._id || idx}
                onClick={() => setSelectedProfileUserId(item._id)}
                className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
              >
                <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-primary-container via-[#60efff] to-primary group-hover:shadow-[0_0_15px_rgba(0,255,135,0.4)] transition-all duration-300 flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center">
                    <UserAvatar 
                      src={photo} 
                      name={name} 
                      size="w-full h-full"
                      iconSize="text-2xl"
                    />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant group-hover:text-primary-container transition-colors max-w-[72px] truncate text-center">
                  {name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Grid: Feed on Left / Sticky Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Feed Stream */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Smart Streamlined Tabs */}
          <div className="glass-card p-1.5 sm:p-2 rounded-2xl border border-white/10 flex items-center justify-between shadow-xl">
            {[
              { id: 'for_you', label: 'For You', icon: 'auto_awesome' },
              { id: 'following', label: 'Following', icon: 'group' },
              { id: 'ngo', label: 'NGO Missions', icon: 'campaign' },
              { id: 'discover', label: 'Discover', icon: 'explore' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3.5 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tab === t.id 
                    ? 'gradient-button shadow-lg scale-[1.02]' 
                    : 'text-on-surface-variant hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
                title={t.label}
              >
                <span className="material-symbols-outlined text-2xl sm:text-xl">{t.icon}</span>
                <span className="hidden sm:inline text-xs">{t.label}</span>
              </button>
            ))}
          </div>

          {tab !== 'discover' ? (
            <>
              {/* Modern Post Creator Composer Card */}
              {user && (
                <section className="glass-card rounded-[2.5rem] p-6 border border-white/10 shadow-2xl transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div 
                      onClick={() => setSelectedProfileUserId(user._id)}
                      className="w-12 h-12 rounded-2xl overflow-hidden cursor-pointer p-0.5 bg-gradient-to-tr from-primary-container to-[#60efff] flex-shrink-0"
                    >
                      <UserAvatar 
                        src={user?.profilePhoto} 
                        name={user?.name} 
                        size="w-full h-full rounded-[0.9rem]"
                        iconSize="text-2xl"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <textarea 
                        rows={isComposerOpen ? 3 : 2}
                        onFocus={() => setIsComposerOpen(true)}
                        placeholder={`What impact did you create today, ${user?.name?.split(' ')[0]}?`}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 font-medium focus:ring-1 focus:ring-primary-container outline-none resize-none transition-all"
                      />

                      {/* Photo Preview */}
                      {postPreview && (
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/40 border border-white/10 group">
                          <img src={postPreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            onClick={handleRemoveFile}
                            className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-md transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      )}

                      {/* Expanding Options */}
                      {isComposerOpen && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3 pt-2"
                        >
                          {/* Category Tag Pills */}
                          <div className="flex flex-wrap gap-2">
                            {IMPACT_CATEGORIES.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  selectedCategory === cat.id
                                    ? 'bg-primary-container text-on-primary-container shadow-md'
                                    : 'bg-surface-container-high text-on-surface-variant hover:text-white'
                                }`}
                              >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                              </button>
                            ))}
                          </div>

                          {/* Extra Metadata Inputs */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex items-center gap-3">
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/*"
                              />
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-xs font-bold text-on-surface-variant hover:text-primary-container transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm text-primary-container">photo_library</span>
                                <span>Add Photo</span>
                              </button>

                              <div className="flex items-center bg-surface-container-high rounded-xl px-3 py-1.5">
                                <span className="material-symbols-outlined text-sm text-primary-container mr-1">location_on</span>
                                <input 
                                  type="text" 
                                  placeholder="Location" 
                                  value={locationTag}
                                  onChange={(e) => setLocationTag(e.target.value)}
                                  className="bg-transparent text-xs text-white placeholder:text-on-surface-variant/50 focus:outline-none w-24 sm:w-32"
                                />
                              </div>

                              <select 
                                value={postVisibility}
                                onChange={(e) => setPostVisibility(e.target.value)}
                                className="bg-surface-container-high text-xs font-bold text-primary-container px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer"
                              >
                                <option value="public">🌐 Public</option>
                                <option value="followers_only">🔒 Followers Only</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setIsComposerOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handlePostSubmit}
                                disabled={isPosting || (!postContent.trim() && !postFile)}
                                className="gradient-button text-on-primary px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-lg"
                              >
                                {isPosting ? 'Posting...' : 'Publish Story 🚀'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Feed Stream Cards */}
              <div className="space-y-8">
                {loading ? (
                  <div className="py-20 text-center">
                    <Loader loading={true} message="Loading unified impact stream..." />
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center text-on-surface-variant py-20 glass-card rounded-[2.5rem] p-8 border border-white/5 space-y-4">
                    <span className="material-symbols-outlined text-6xl text-primary-container opacity-40">dynamic_feed</span>
                    <h3 className="text-2xl font-black text-on-surface">No Impact Stories Yet</h3>
                    <p className="text-sm max-w-md mx-auto">
                      {tab === 'following' 
                        ? "You aren't following anyone who has posted yet. Discover inspiring changemakers and follow them!"
                        : "Be the first to share an impact story or connect with friends!"}
                    </p>
                    <button 
                      onClick={() => setTab('discover')}
                      className="px-8 py-3 bg-primary-container text-on-primary-container rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      Discover People & NGOs
                    </button>
                  </div>
                ) : (
                  filteredPosts.map(post => {
                    const author = post.authorId || post.ngoId || {};
                    const authorId = author._id || author;
                    const isNgo = post.authorType === 'ngo' || !!post.ngoId;
                    const authorName = author.name || 'Community Member';
                    const authorPhoto = author.profilePhoto || author.logo;
                    const authorUsername = author.username ? `@${author.username}` : (isNgo ? 'Verified Partner' : '');
                    const isLiked = post.likes?.some(id => (id._id || id) === user?._id);
                    const isFollowed = followingState[authorId] === 'active';
                    const isSelfPost = user && authorId === user._id;

                    return (
                      <article 
                        key={post._id} 
                        id={post._id}
                        className="glass-card rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl hover:border-primary-container/20 transition-all duration-300 flex flex-col"
                      >
                        {/* Post Author Header */}
                        <div className="p-6 flex items-center justify-between">
                          <div 
                            onClick={() => setSelectedProfileUserId(authorId)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-primary-container to-[#60efff] group-hover:scale-105 transition-transform flex-shrink-0">
                              <UserAvatar 
                                src={authorPhoto}
                                name={authorName}
                                size="w-full h-full rounded-[0.9rem]"
                                iconSize="text-2xl"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-primary-container transition-colors">
                                  {authorName}
                                </h3>
                                {isNgo && (
                                  <span className="material-symbols-outlined text-primary-container text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    verified
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-medium">
                                {authorUsername && <span className="font-bold text-primary-container/80">{authorUsername}</span>}
                                <span>•</span>
                                <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Inline Quick Follow Button & Options */}
                          <div className="flex items-center gap-3">
                            {!isSelfPost && (
                              <button
                                onClick={(e) => handleFollowToggle(authorId, e)}
                                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm group/flw ${
                                  isFollowed
                                    ? 'bg-surface-container-highest text-on-surface-variant hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                                    : 'bg-primary-container/20 text-primary-container hover:bg-primary-container hover:text-on-primary-container border border-primary-container/30'
                                }`}
                              >
                                {isFollowed ? (
                                  <>
                                    <span className="group-hover/flw:hidden">Following</span>
                                    <span className="hidden group-hover/flw:inline">Unfollow</span>
                                  </>
                                ) : (
                                  '+ Follow'
                                )}
                              </button>
                            )}

                            <button 
                              onClick={() => handleShare(post)}
                              className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-white flex items-center justify-center transition-all cursor-pointer"
                              title="Share Story"
                            >
                              <span className="material-symbols-outlined text-base">share</span>
                            </button>
                          </div>
                        </div>

                        {/* Post Caption & Location */}
                        <div className="px-6 pb-4">
                          <p className="text-sm text-on-surface/90 leading-relaxed font-medium whitespace-pre-line">
                            {post.content}
                          </p>

                          {post.locationTag && (
                            <div className="flex items-center gap-1 text-xs text-primary-container font-bold mt-2.5">
                              <span className="material-symbols-outlined text-sm">location_on</span>
                              <span>{post.locationTag}</span>
                            </div>
                          )}

                          {post.linkedEventId && (
                            <div className="mt-3 p-3.5 rounded-2xl bg-surface-container-low border border-white/5 flex items-center gap-3">
                              <span className="text-2xl">🌱</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary-container">Associated Mission</p>
                                <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{post.linkedEventId.title}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Post Media with Double-Tap Like Pop */}
                        {(post.imageUrl || (post.mediaUrls && post.mediaUrls[0])) && (
                          <div 
                            onDoubleClick={() => handleLike(post._id, true)}
                            className="relative overflow-hidden aspect-video bg-black/40 cursor-pointer select-none group"
                          >
                            <img 
                              alt="Impact visual" 
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" 
                              src={post.imageUrl || post.mediaUrls[0]} 
                            />
                            
                            {/* Floating Heart Animation */}
                            <AnimatePresence>
                              {likeAnimations[post._id] && (
                                <motion.div 
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1.4, opacity: 1 }}
                                  exit={{ scale: 2, opacity: 0 }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                  <span className="material-symbols-outlined text-red-500 text-8xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    favorite
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Double tap hint overlay */}
                            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] text-white/80 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              Double-tap to ❤️
                            </div>
                          </div>
                        )}

                        {/* Interactive Action Bar */}
                        <div className="p-6 flex items-center justify-between border-t border-white/5 bg-surface-container-low/40">
                          <div className="flex items-center gap-6">
                            {/* Like Button */}
                            <button 
                              onClick={() => handleLike(post._id)} 
                              className="flex items-center gap-2 group cursor-pointer transition-transform active:scale-125"
                            >
                              <span 
                                className={`material-symbols-outlined text-2xl transition-colors ${isLiked ? 'text-red-500' : 'text-on-surface-variant group-hover:text-red-400'}`}
                                style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                favorite
                              </span>
                              <span className={`text-xs font-black ${isLiked ? 'text-red-400' : 'text-on-surface-variant'}`}>
                                {post.likeCount || post.likes?.length || 0}
                              </span>
                            </button>

                            {/* Comment Button */}
                            <button 
                              onClick={() => toggleComments(post._id)} 
                              className="flex items-center gap-2 group cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary-container transition-colors">
                                chat_bubble
                              </span>
                              <span className="text-xs font-black text-on-surface-variant group-hover:text-primary-container">
                                {post.commentCount || post.comments?.length || 0}
                              </span>
                            </button>
                          </div>

                          {/* Impact Category Badge */}
                          <span className="px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary-container text-[10px] font-black uppercase tracking-wider">
                            {post.category || 'Impact Story'}
                          </span>
                        </div>

                        {/* Instagram-Style Expandable Comments Drawer */}
                        {commentingOn === post._id && (
                          <div className="p-6 bg-surface-container-low border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            
                            {/* Fast Emoji Reactions */}
                            <div className="flex items-center gap-2 pb-2 overflow-x-auto">
                              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mr-1">React:</span>
                              {EMOJI_REACTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleCommentSubmit(post._id, emoji)}
                                  className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest hover:scale-110 flex items-center justify-center text-sm transition-all cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            {/* Comments List */}
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                              {(commentsMap[post._id] || post.comments || []).map((c, idx) => {
                                const cAuthor = c.authorId || c.user || {};
                                const cAuthorId = cAuthor._id || cAuthor;
                                return (
                                  <div key={c._id || idx} className="flex gap-3 bg-surface/60 p-3.5 rounded-2xl border border-white/5">
                                    <div 
                                      onClick={() => setSelectedProfileUserId(cAuthorId)}
                                      className="w-8 h-8 rounded-xl overflow-hidden bg-primary-container/20 flex-shrink-0 cursor-pointer"
                                    >
                                      <UserAvatar 
                                        src={cAuthor.profilePhoto || cAuthor.logo}
                                        name={cAuthor.name}
                                        size="w-full h-full"
                                        iconSize="text-base"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <p 
                                          onClick={() => setSelectedProfileUserId(cAuthorId)}
                                          className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-container cursor-pointer"
                                        >
                                          {cAuthor.name || 'Member'}
                                        </p>
                                        <span className="text-[10px] text-on-surface-variant font-medium">
                                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                        </span>
                                      </div>
                                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{c.content || c.text}</p>
                                    </div>
                                  </div>
                                );
                              })}
                              {(!commentsMap[post._id] || commentsMap[post._id].length === 0) && (!post.comments || post.comments.length === 0) && (
                                <p className="text-xs text-on-surface-variant text-center py-4 italic">No comments yet. Share your thoughts!</p>
                              )}
                            </div>

                            {/* Comment Input */}
                            <div className="flex gap-2 pt-2">
                              <input 
                                type="text" 
                                value={commentTextMap[post._id] || ''}
                                onChange={(e) => setCommentTextMap(prev => ({ ...prev, [post._id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post._id); }}
                                placeholder="Add an inspiring comment..."
                                className="flex-1 bg-surface-container-highest rounded-xl px-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-container"
                              />
                              <button 
                                onClick={() => handleCommentSubmit(post._id)}
                                disabled={commentLoading || !commentTextMap[post._id]?.trim()}
                                className="gradient-button text-on-primary rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                              >
                                Post
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Discover & Search Section */
            <div className="space-y-8">
              {/* Search Bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input 
                  type="text"
                  placeholder="Search creators, changemakers, or verified NGOs..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-surface-container-low border border-slate-200/80 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary-container shadow-xl"
                />
              </div>

              {/* Search Results */}
              {searchQuery.trim() && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary-container">Search Results</h3>
                  
                  {/* Users Results */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">People</p>
                    {searchResults.users?.map(u => (
                      <div key={u._id} className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                        <div 
                          onClick={() => setSelectedProfileUserId(u._id)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-primary-container to-[#60efff] flex-shrink-0">
                            <UserAvatar src={u.profilePhoto} name={u.name} size="w-full h-full rounded-[0.9rem]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary-container truncate">{u.name}</p>
                              {u.isPrivate && <span className="text-xs" title="Private Account">🔒</span>}
                            </div>
                            <p className="text-xs text-on-surface-variant truncate">{u.username ? `@${u.username}` : `${u.followerCount || 0} followers`}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleFollowToggle(u._id)}
                          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex-shrink-0 cursor-pointer ${
                            followingState[u._id] === 'active' 
                              ? 'bg-surface-container-highest text-on-surface-variant' 
                              : followingState[u._id] === 'pending'
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                              : 'gradient-button text-on-primary shadow-md'
                          }`}
                        >
                          {followingState[u._id] === 'active' ? 'Following' : followingState[u._id] === 'pending' ? 'Requested' : (u.isPrivate ? 'Request' : 'Follow')}
                        </button>
                      </div>
                    ))}
                    {(!searchResults.users || searchResults.users.length === 0) && <p className="text-xs text-on-surface-variant italic">No people found</p>}
                  </div>

                  {/* NGOs Results */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">NGOs</p>
                    {searchResults.ngos?.map(n => (
                      <div key={n._id} className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                        <div 
                          onClick={() => setSelectedProfileUserId(n._id)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-primary-container to-[#60efff] flex-shrink-0">
                            <UserAvatar src={n.logo} name={n.name} size="w-full h-full rounded-[0.9rem]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-white group-hover:text-primary-container truncate">{n.name}</p>
                            <p className="text-xs text-on-surface-variant truncate">{n.followerCount || 0} followers</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleFollowToggle(n._id)}
                          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex-shrink-0 cursor-pointer ${
                            followingState[n._id] === 'active' 
                              ? 'bg-surface-container-highest text-on-surface-variant' 
                              : 'gradient-button text-on-primary shadow-md'
                          }`}
                        >
                          {followingState[n._id] === 'active' ? 'Following' : '+ Follow'}
                        </button>
                      </div>
                    ))}
                    {(!searchResults.ngos || searchResults.ngos.length === 0) && <p className="text-xs text-on-surface-variant italic">No NGOs found</p>}
                  </div>
                </div>
              )}

              {/* Suggestions List */}
              {!searchQuery.trim() && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary-container">People & NGOs You May Know</h3>

                  {availableUserSuggestions.length === 0 && availableNgoSuggestions.length === 0 ? (
                    <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-white/5">
                      <span className="material-symbols-outlined text-4xl text-primary-container mb-2">done_all</span>
                      <p className="text-xs text-on-surface-variant">You are all caught up! You are following all suggested changemakers.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableUserSuggestions.map(u => (
                        <div key={u._id} className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                          <div 
                            onClick={() => setSelectedProfileUserId(u._id)}
                            className="flex items-center gap-3 min-w-0 cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-primary-container to-[#60efff] flex-shrink-0">
                              <UserAvatar src={u.profilePhoto} name={u.name} size="w-full h-full rounded-[0.9rem]" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-white group-hover:text-primary-container truncate">{u.name}</p>
                                {u.isPrivate && <span className="text-xs" title="Private Account">🔒</span>}
                              </div>
                              <p className="text-xs text-on-surface-variant truncate">{u.city || (u.username ? `@${u.username}` : 'Community member')}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleFollowToggle(u._id)}
                            className="gradient-button text-on-primary px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex-shrink-0 cursor-pointer shadow-md"
                          >
                            {u.isPrivate ? 'Request' : '+ Follow'}
                          </button>
                        </div>
                      ))}

                      {availableNgoSuggestions.map(n => (
                        <div key={n._id} className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                          <div 
                            onClick={() => setSelectedProfileUserId(n._id)}
                            className="flex items-center gap-3 min-w-0 cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-primary-container to-[#60efff] flex-shrink-0">
                              <UserAvatar src={n.logo} name={n.name} size="w-full h-full rounded-[0.9rem]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-white group-hover:text-primary-container truncate">{n.name}</p>
                              <p className="text-xs text-on-surface-variant truncate">Verified NGO • {n.followerCount || 0} followers</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleFollowToggle(n._id)}
                            className="gradient-button text-on-primary px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex-shrink-0 cursor-pointer shadow-md"
                          >
                            + Follow
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sticky Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6">
          
          {/* User Mini Profile Card */}
          {user && (
            <div className="glass-card rounded-[2.5rem] p-6 border border-white/10 shadow-2xl">
              <div 
                onClick={() => setSelectedProfileUserId(user._id)}
                className="flex items-center gap-4 cursor-pointer group mb-6"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-primary-container to-[#60efff]">
                  <UserAvatar src={user?.profilePhoto} name={user?.name} size="w-full h-full rounded-[0.9rem]" iconSize="text-3xl" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-base text-slate-900 dark:text-white group-hover:text-primary-container transition-colors truncate">
                    {user?.name}
                  </h4>
                  <p className="text-xs font-bold text-primary-container">
                    @{user?.username || (user?.name || 'user').toLowerCase().replace(/\s+/g, '_')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest/80 border border-slate-200/60 dark:border-white/5 rounded-2xl p-3 text-center">
                <div>
                  <p className="text-base font-black text-slate-900 dark:text-white">{user?.followerCount || 0}</p>
                  <p className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant">Followers</p>
                </div>
                <div>
                  <p className="text-base font-black text-slate-900 dark:text-white">{user?.followingCount || 0}</p>
                  <p className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant">Following</p>
                </div>
                <div>
                  <p className="text-base font-black text-primary-container">{user?.coinBalance || 0}</p>
                  <p className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant">Coins</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Changemakers */}
          <div className="glass-card rounded-[2.5rem] p-6 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Suggested For You</h4>
              <button onClick={() => setTab('discover')} className="text-xs font-bold text-primary-container hover:underline cursor-pointer">
                See All
              </button>
            </div>

            <div className="space-y-3">
              {[...availableUserSuggestions.slice(0, 3), ...availableNgoSuggestions.slice(0, 2)].map((item, idx) => (
                <div key={item._id || idx} className="flex items-center justify-between gap-3">
                  <div 
                    onClick={() => setSelectedProfileUserId(item._id)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary-container/20 flex-shrink-0">
                      <UserAvatar src={item.profilePhoto || item.logo} name={item.name} size="w-full h-full" iconSize="text-xl" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-primary-container truncate">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant truncate">{item.username ? `@${item.username}` : (item.city || 'Changemaker')}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleFollowToggle(item._id, e)}
                    className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer bg-primary-container/20 text-primary-container hover:bg-primary-container hover:text-on-primary-container border border-primary-container/30 active:scale-95"
                  >
                    + Follow
                  </button>
                </div>
              ))}

              {availableUserSuggestions.length === 0 && availableNgoSuggestions.length === 0 && (
                <p className="text-xs text-on-surface-variant italic py-2 text-center">
                  All caught up! No new suggestions.
                </p>
              )}
            </div>
          </div>

          {/* Trending Causes Tags */}
          <div className="glass-card rounded-[2.5rem] p-6 border border-white/10 shadow-2xl space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Trending Impact Causes</h4>
            <div className="flex flex-wrap gap-2">
              {['#TreePlantation', '#BeachCleanup', '#FoodDrive', '#BloodDonation', '#ZeroHunger', '#CleanEnergy', '#AnimalRescue'].map(tag => (
                <span 
                  key={tag} 
                  onClick={() => handleSearch(tag.replace('#', ''))}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-white/5 hover:border-primary-container/40 text-[11px] font-bold text-on-surface-variant hover:text-primary-container cursor-pointer transition-all"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Interactive User Profile Preview Modal ("Know XYZ Person") */}
      <UserProfileModal 
        userId={selectedProfileUserId}
        isOpen={!!selectedProfileUserId}
        onClose={() => setSelectedProfileUserId(null)}
        onFollowChange={(id, status) => {
          setFollowingState(prev => ({ ...prev, [id]: status }));
          fetchFeed();
        }}
      />

    </main>
  );
};

export default SocialFeed;
