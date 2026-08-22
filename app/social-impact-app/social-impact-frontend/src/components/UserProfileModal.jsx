import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import UserAvatar from './UserAvatar';
import Loader from './Loader';
import { useToast } from '../context/ToastContext';
import { getRewardDefaultImage } from '../utils/rewardImageHelper';

const UserProfileModal = ({ userId, isOpen, onClose, onFollowChange }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [relationship, setRelationship] = useState('none'); // 'none' | 'active' | 'pending' | 'self'

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/social/user/${userId}`);
      setData(res.data);
      setRelationship(res.data.relationship || 'none');
    } catch (err) {
      console.error('Failed to load user profile:', err);
      toast.error('Could not load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!userId || relationship === 'self') return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to follow users');
      return;
    }
    setFollowLoading(true);
    try {
      if (relationship === 'active' || relationship === 'pending') {
        await API.delete(`/social/follow/${userId}`);
        setRelationship('none');
        setData(prev => prev ? {
          ...prev,
          profile: {
            ...prev.profile,
            followerCount: Math.max(0, (prev.profile.followerCount || 1) - 1)
          }
        } : null);
        if (onFollowChange) onFollowChange(userId, 'none');
        toast.info('Unfollowed');
      } else {
        const res = await API.post(`/social/follow/${userId}`);
        const newStatus = res.data.status || 'active';
        setRelationship(newStatus);
        if (newStatus === 'active') {
          setData(prev => prev ? {
            ...prev,
            profile: {
              ...prev.profile,
              followerCount: (prev.profile.followerCount || 0) + 1
            }
          } : null);
        }
        if (onFollowChange) onFollowChange(userId, newStatus);
        toast.success(res.data.message || (newStatus === 'pending' ? 'Request sent' : 'Following!'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  if (!isOpen) return null;

  const profile = data?.profile;
  const isNGO = data?.type === 'ngo';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="glass-card bg-white dark:bg-surface-container-high border border-slate-200/90 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-slate-100 dark:bg-surface/60 hover:bg-slate-200 dark:hover:bg-surface text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          {loading ? (
            <div className="py-24 text-center">
              <Loader loading={true} message="Loading creator profile..." />
            </div>
          ) : !profile ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-30">person_off</span>
              <p>User profile could not be found.</p>
            </div>
          ) : (
            <div>
              {/* Header Banner */}
              <div className="h-28 bg-gradient-to-r from-emerald-400/20 via-sky-400/15 to-transparent dark:from-[#00ff87]/20 dark:via-[#60efff]/15 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-surface-container-high to-transparent" />
              </div>

              {/* Profile Main Info */}
              <div className="px-8 pb-8 -mt-14 relative z-10">
                <div className="flex items-end justify-between mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-primary-container to-[#60efff] shadow-2xl overflow-hidden">
                      <UserAvatar 
                        src={profile.profilePhoto || profile.logo}
                        name={profile.name}
                        size="w-full h-full rounded-[1.25rem]"
                        iconSize="text-4xl"
                      />
                    </div>
                    {isNGO && (
                      <div className="absolute -bottom-1 -right-1 bg-primary-container text-on-primary-container w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-xs font-black">verified</span>
                      </div>
                    )}
                  </div>

                  {/* Follow Button Action */}
                  {relationship !== 'self' && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5 ${
                        relationship === 'active'
                          ? 'bg-slate-200 dark:bg-surface-container-highest text-slate-700 dark:text-white hover:bg-red-500/20 hover:text-red-500'
                          : relationship === 'pending'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'gradient-button'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {relationship === 'active' ? 'check' : relationship === 'pending' ? 'hourglass_top' : 'person_add'}
                      </span>
                      {relationship === 'active' ? 'Following' : relationship === 'pending' ? 'Requested' : 'Follow'}
                    </button>
                  )}
                </div>

                {/* Name & Identifiers */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h3>
                    {profile.isVerified && (
                      <span className="material-symbols-outlined text-primary-container text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-primary-container">
                    @{profile.username || (profile.name || 'user').toLowerCase().replace(/\s+/g, '_')}
                  </p>
                </div>

                {/* Bio & Details */}
                <p className="text-sm text-slate-600 dark:text-on-surface-variant leading-relaxed mb-5 font-medium">
                  {profile.bio || profile.description || "Active community contributor driving positive impact on Social Pulse."}
                </p>

                {/* Tags & Badges (Occupation / City / School) */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {profile.occupation && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-surface-container-lowest border border-slate-200/80 dark:border-white/5 text-[11px] font-bold text-slate-700 dark:text-on-surface flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-primary-container text-sm">work</span>
                      {profile.occupation}
                    </span>
                  )}
                  {profile.city && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-surface-container-lowest border border-slate-200/80 dark:border-white/5 text-[11px] font-bold text-slate-700 dark:text-on-surface flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-primary-container text-sm">location_on</span>
                      {profile.city}
                    </span>
                  )}
                  {profile.institute && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-surface-container-lowest border border-slate-200/80 dark:border-white/5 text-[11px] font-bold text-slate-700 dark:text-on-surface flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-primary-container text-sm">school</span>
                      {profile.institute}
                    </span>
                  )}
                </div>

                {/* Stats Matrix */}
                <div className="grid grid-cols-3 gap-2 bg-slate-100/90 dark:bg-surface-container-lowest/80 border border-slate-200/90 dark:border-white/5 rounded-2xl p-4 mb-6 text-center shadow-sm">
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{profile.followerCount || 0}</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 dark:text-on-surface-variant">Followers</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{profile.postCount || data?.posts?.length || 0}</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 dark:text-on-surface-variant">Stories</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-emerald-700 dark:text-primary-container">{profile.coinBalance ? profile.coinBalance.toLocaleString() : (profile.rank ? `#${profile.rank}` : '---')}</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 dark:text-on-surface-variant">{profile.coinBalance ? 'Impact Coins' : 'Rank'}</p>
                  </div>
                </div>

                {/* Interests Chips */}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-on-surface-variant mb-2">Causes & Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((int, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-primary-container/10 border border-emerald-200/80 dark:border-transparent text-emerald-700 dark:text-primary-container text-[10px] font-bold">
                          #{int}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Profile CTA Button */}
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${profile._id}`);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-surface-container-highest dark:hover:bg-surface-container text-slate-900 dark:text-white border border-slate-200/80 dark:border-transparent font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:text-emerald-700 dark:hover:text-primary-container"
                >
                  <span>View Full Profile & Impact History</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfileModal;
