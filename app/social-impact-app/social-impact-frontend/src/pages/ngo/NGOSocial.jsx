import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';

const NGOSocial = ({ ngo }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postFile, setPostFile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (ngo?._id) fetchMyPosts();
  }, [ngo]);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      // Assuming there's an endpoint to get posts for a specific NGO
      // If not, we'll use the public one
      const response = await API.get(`/social/posts/${ngo._id || ngo.id}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching NGO posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim() && !postFile) return;
    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      if (postFile) {
        formData.append('image', postFile);
      }
      await API.post('/social/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPostContent('');
      setPostFile(null);
      showToast('Post published to the impact feed! ✨');
      fetchMyPosts(); 
    } catch (error) {
      console.error('Error creating post:', error);
      showToast('Failed to create post', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await API.delete(`/social/posts/${postId}`);
      showToast('Post deleted');
      fetchMyPosts();
    } catch (error) {
      showToast('Failed to delete post', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary-container text-on-primary-container'
        }`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      {/* Post Creator */}
      <section className="glass-card rounded-[2rem] p-6 border border-white/5 bg-surface-container-low shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">Share an Impact Update</h3>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Public updates for your followers</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            placeholder="Tell your community what you've been working on..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full min-h-[120px] bg-surface-container-lowest border border-white/5 rounded-2xl p-5 text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary-container/30 transition-all resize-none font-medium leading-relaxed"
          />

          {postFile && (
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden group">
              <img src={URL.createObjectURL(postFile)} alt="preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setPostFile(null)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => setPostFile(e.target.files[0])} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-container-high rounded-xl text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5 transition-all text-xs font-black uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-sm">add_a_photo</span>
                Add Photo
              </button>
            </div>

            <button 
              onClick={handlePostSubmit}
              disabled={isPosting || (!postContent.trim() && !postFile)}
              className="flex items-center gap-2.5 px-8 py-3 bg-primary-container text-on-primary-container rounded-xl font-black text-sm shadow-[0_4px_20px_rgba(0,255,135,0.2)] hover:shadow-[0_8px_30px_rgba(0,255,135,0.4)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isPosting ? 'Publishing...' : (
                <>
                  <span>Publish Update</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* My Posts History */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight">Your Impact Updates</h3>
          <span className="px-2.5 py-1 bg-surface-container-high rounded-full text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            {posts.length} Posts
          </span>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-on-surface-variant opacity-40">
            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Syncing Feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-surface-container-low rounded-[2rem] p-12 text-center border border-dashed border-white/10">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-4 block">article</span>
            <p className="text-on-surface-variant text-sm font-medium">You haven't posted any updates yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map(post => (
              <article key={post._id} className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5 flex flex-col shadow-sm group">
                {post.imageUrl && (
                  <div className="h-44 overflow-hidden relative">
                    <img src={post.imageUrl} alt="post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-[9px] font-black uppercase tracking-widest text-white/80">
                      {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {!post.imageUrl && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">
                        {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <p className="text-sm text-on-surface/90 leading-relaxed line-clamp-3 mb-4 font-medium italic">
                      "{post.content}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                        <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="p-2 rounded-xl text-on-surface-variant hover:text-red-400 hover:bg-red-400/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default NGOSocial;
