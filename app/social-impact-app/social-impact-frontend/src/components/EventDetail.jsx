import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { getEventStatus, STATUS_STYLES } from '../utils/eventStatus';
import { getEventImageSrc } from '../utils/eventImageHelper';

const TYPE_META = {
  blood_donation:  { icon: '🩸', label: 'Blood Donation',  color: 'bg-red-500/20 text-red-400 border-red-500/20' },
  tree_plantation: { icon: '🌱', label: 'Tree Plantation', color: 'bg-green-500/20 text-green-400 border-green-500/20' },
  volunteering:    { icon: '🙋', label: 'Volunteering',    color: 'bg-[#00ff87]/10 text-[#00ff87] border-[#00ff87]/20' },
  other:           { icon: '📌', label: 'Event',           color: 'bg-[#00b8ff]/10 text-[#00b8ff] border-[#00b8ff]/20' },
};

const EventDetail = ({ event, onClose }) => {
  const [ngo, setNgo] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [localEvent, setLocalEvent] = useState(event);
  const [imgError, setImgError] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    // Fetch NGO that created the event
    const fetchNGO = async () => {
      try {
        const ngoId = event.ngoId || event.createdBy?._id || event.createdBy;
        if (!ngoId) return;
        const res = await API.get(`/ngo/${ngoId}/public`);
        setNgo(res.data);

        // Check if already following this NGO
        try {
          const followRes = await API.get('/social/following');
          const followingList = followRes.data || [];
          const ngoObjId = res.data._id;
          setFollowing(followingList.some(f =>
            (f.ngoId?._id || f.ngoId) === ngoObjId ||
            (f._id) === ngoObjId
          ));
        } catch (_) {}
      } catch (_) {}
    };

    // Check if user already joined
    const checkJoined = () => {
      if (!user || !event.participants) return;
      setJoined(event.participants.some(p =>
        (p._id || p) === (user._id || user.id)
      ));
    };

    fetchNGO();
    checkJoined();
  }, [event]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFollow = async () => {
    if (!ngo || !user) return showToast('Please log in to follow', 'error');
    setFollowLoading(true);
    try {
      if (following) {
        await API.delete(`/social/follow/${ngo._id}`);
        setFollowing(false);
        showToast(`Unfollowed ${ngo.name}`);
      } else {
        await API.post(`/social/follow/${ngo._id}`);
        setFollowing(true);
        showToast(`Now following ${ngo.name}! 🎉`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update follow', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return showToast('Please log in to join', 'error');
    setJoinLoading(true);
    try {
      await API.post(`/events/${event._id}/join`);
      setJoined(true);
      showToast('Successfully joined the event! 🎉');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join', 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!cancelReason) return showToast('Please select a cancellation reason', 'error');
    if (cancelReason === 'Other' && cancelMessage.length < 20) {
      return showToast('Please provide a detailed reason (min 20 characters)', 'error');
    }

    setCancelLoading(true);
    try {
      await API.put(`/events/${localEvent._id}/cancel`, {
        cancellationReason: cancelReason,
        cancellationMessage: cancelMessage
      });
      showToast('Event cancelled successfully. Volunteers notified.', 'success');
      setLocalEvent(prev => ({ ...prev, status: 'cancelled' }));
      setShowCancelModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel event', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const meta = TYPE_META[localEvent.activityType] || TYPE_META.other;
  const eventDate = localEvent.date ? new Date(localEvent.date) : null;
  const status = getEventStatus(localEvent);          // 'upcoming' | 'active' | 'completed' | 'cancelled' | 'rejected' | 'pending_approval'
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.upcoming;
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending_approval';
  const isActive   = status === 'active';
  const spotsLeft = localEvent.volunteersNeeded ? localEvent.volunteersNeeded - (localEvent.participants?.length || 0) : null;
  const isCreator = user && ((localEvent.createdBy?._id || localEvent.createdBy) === user._id);
  const canCancel = isCreator && ['upcoming', 'active', 'pending_approval'].includes(status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-white dark:bg-surface rounded-t-[2rem] sm:rounded-[2rem] border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-2xl ${
            toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary-container text-on-primary-container'
          }`}>
            <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
            {toast.msg}
          </div>
        )}

        {/* Banner */}
        <div className="relative h-52 flex-shrink-0 overflow-hidden">
          <img
            src={getEventImageSrc(localEvent, imgError)}
            onError={() => setImgError(true)}
            alt={localEvent.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-surface via-white/30 dark:via-surface/40 to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors shadow-lg"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>

          {/* Type Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-md ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
          </div>

          <div className="absolute bottom-4 right-4">
            <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md flex items-center gap-1 shadow-md ${statusStyle.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Title + Coins */}
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight leading-tight flex-1 text-slate-900 dark:text-on-surface">{localEvent.title}</h2>
              {localEvent.coinsReward > 0 && (
                <div className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-50 dark:bg-primary-container/10 border border-emerald-300/80 dark:border-primary-container/20 px-3.5 py-1.5 rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-primary-container">+{event.coinsReward}</span>
                </div>
              )}
            </div>

            {/* Meta Info Grid with Distinct Depth Tiles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'calendar_today', label: 'Date', value: eventDate?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) },
                { icon: 'schedule', label: 'Time', value: eventDate?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
                { icon: 'location_on', label: 'Location', value: event.address },
                { icon: 'timer', label: 'Duration', value: event.duration ? `${event.duration} hrs` : 'TBD' },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="bg-slate-100/90 dark:bg-surface-container-low p-3.5 rounded-2xl flex items-start gap-2.5 border border-slate-200/90 dark:border-white/5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] dark:shadow-inner transition-all">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-primary-container text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">{item.label}</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Volunteers progress */}
            {event.volunteersNeeded > 0 && (
              <div className="bg-slate-100/90 dark:bg-surface-container-low p-4 rounded-2xl border border-slate-200/90 dark:border-white/5 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Volunteers</p>
                  <p className="text-xs font-black text-emerald-700 dark:text-primary-container">
                    {event.participants?.length || 0} / {event.volunteersNeeded} joined
                  </p>
                </div>
                <div className="w-full bg-slate-200/90 dark:bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full gradient-button transition-all duration-700"
                    style={{ width: `${Math.min(((event.participants?.length || 0) / event.volunteersNeeded) * 100, 100)}%` }}
                  />
                </div>
                {spotsLeft !== null && spotsLeft > 0 && (
                  <p className="text-xs text-slate-600 dark:text-on-surface-variant mt-2 font-medium">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining</p>
                )}
                {spotsLeft === 0 && (
                  <p className="text-xs text-amber-600 dark:text-[#ff9f00] font-bold mt-2">Event is full</p>
                )}
              </div>
            )}

            {/* Certificate badge */}
            {event.certificateAvailable && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-[#c77dff]/10 border border-purple-200 dark:border-[#c77dff]/20 rounded-2xl w-fit shadow-sm">
                <span className="text-sm">📜</span>
                <span className="text-xs font-black text-purple-700 dark:text-[#c77dff]">Completion Certificate Available</span>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-on-surface-variant mb-2">About This Event</p>
              <p className="text-sm text-slate-700 dark:text-on-surface-variant leading-relaxed font-medium">{event.description}</p>
            </div>

            {/* ── NGO / Creator Card ── */}
            {(ngo || event.createdBy) && (
              <div className="bg-slate-100/90 dark:bg-surface-container-low rounded-2xl p-4 border border-slate-200/90 dark:border-white/5 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-on-surface-variant mb-3">Organized By</p>
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white dark:bg-primary-container/20 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-white/10 shadow-sm">
                    {ngo?.logo || event.createdBy?.profilePhoto ? (
                      <img src={ngo?.logo || event.createdBy?.profilePhoto} alt={ngo?.name || event.createdBy?.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-emerald-600 dark:text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {ngo ? 'domain' : 'person'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-sm text-slate-900 dark:text-white">
                        {ngo?.name || event.createdBy?.name || 'Community Organizer'}
                      </p>
                      {ngo?.isVerified ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700 dark:text-[#00ff87] bg-emerald-50 dark:bg-[#00ff87]/10 border border-emerald-200 dark:border-[#00ff87]/20 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Verified NGO
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black text-slate-600 dark:text-zinc-400 bg-slate-200/80 dark:bg-zinc-800/50 border border-slate-300 dark:border-white/10 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                          Community Organizer
                        </span>
                      )}
                    </div>
                    {(ngo?.description || event.createdBy?.bio) && (
                      <p className="text-xs text-slate-600 dark:text-on-surface-variant mt-0.5 line-clamp-2">
                        {ngo?.description || event.createdBy?.bio}
                      </p>
                    )}
                  </div>

                  {/* Follow Button */}
                  {ngo && (
                    <button
                      onClick={handleFollow}
                      disabled={following || followLoading}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        following
                          ? 'bg-slate-200 dark:bg-surface-container-highest text-slate-700 dark:text-on-surface-variant cursor-default'
                          : 'bg-emerald-50 dark:bg-primary-container/10 border border-emerald-300 dark:border-primary-container/30 text-emerald-700 dark:text-primary-container hover:bg-emerald-600 dark:hover:bg-primary-container hover:text-white dark:hover:text-on-primary-container'
                      }`}
                    >
                      {followLoading ? (
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: following ? "'FILL' 1" : "'FILL' 0" }}>
                          {following ? 'how_to_reg' : 'person_add'}
                        </span>
                      )}
                      {following ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-slate-200/80 dark:border-white/5 flex-shrink-0 bg-slate-50/80 dark:bg-surface flex flex-col gap-2 backdrop-blur-md">
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-4 rounded-2xl font-black text-sm text-rose-600 dark:text-red-500 bg-rose-50 dark:bg-red-500/10 hover:bg-rose-100 dark:hover:bg-red-500/20 transition-all border border-rose-200 dark:border-red-500/20"
            >
              Cancel Event
            </button>
          )}

          {!isCreator && (
            !isCompleted && !isCancelled && !isRejected && spotsLeft !== 0 ? (
              <button
                onClick={handleJoin}
                disabled={joined || joinLoading}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                  joined
                    ? 'bg-slate-200 dark:bg-surface-container-highest text-slate-700 dark:text-on-surface-variant cursor-default'
                    : 'gradient-button shadow-lg'
                }`}
              >
                {joinLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </span>
                ) : joined ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    You're Registered!
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                    {isActive ? 'Join Now — Event is Live!' : 'Join This Event'}
                  </span>
                )}
              </button>
            ) : (
              <div className="w-full py-4 rounded-2xl bg-slate-200/90 dark:bg-surface-container-low text-slate-700 dark:text-on-surface-variant font-black text-sm text-center border border-slate-300 dark:border-white/5 shadow-inner">
                {isCompleted ? 'This event has ended' : (isCancelled || isRejected) ? 'This event is no longer available' : 'Event is full'}
              </div>
            )
          )}
        </div>
      </div>

      {/* Cancel Event Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-surface w-full max-w-md rounded-[32px] border border-white/10 shadow-2xl overflow-hidden p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-red-500 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Cancel Event
            </h3>
            <p className="text-on-surface-variant text-sm mb-6">Are you sure you want to cancel "{localEvent.title}"? This action cannot be undone.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Reason for cancellation *</label>
                <select 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-red-500 focus:outline-none"
                >
                  <option value="" disabled>Select a reason ▼</option>
                  <option value="Personal emergency">Personal emergency</option>
                  <option value="Insufficient volunteers">Insufficient volunteers</option>
                  <option value="Weather conditions">Weather conditions</option>
                  <option value="Venue unavailable">Venue unavailable</option>
                  <option value="Scheduling conflict">Scheduling conflict</option>
                  <option value="Lack of resources">Lack of resources</option>
                  <option value="Health reasons">Health reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Additional message (optional)</label>
                <textarea 
                  value={cancelMessage}
                  onChange={(e) => setCancelMessage(e.target.value)}
                  placeholder="Add a note for your volunteers"
                  className="w-full bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-red-500 focus:outline-none min-h-[100px] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Keep Event
              </button>
              <button 
                onClick={handleCancelEvent}
                disabled={cancelLoading}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {cancelLoading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
