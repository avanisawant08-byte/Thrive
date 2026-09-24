import React, { useState } from 'react';
import API from '../../services/api';
import EventDetail from '../../components/EventDetail';
import { getEventStatus, STATUS_STYLES } from '../../utils/eventStatus';

const EVENT_TYPE_META = {
  volunteer:       { icon: '🙋', label: 'Volunteer Event', color: 'text-[#00ff87]' },
  donation_drive:  { icon: '🎁', label: 'Donation Drive',  color: 'text-[#00b8ff]' },
  disaster_relief: { icon: '🚨', label: 'Disaster Relief', color: 'text-[#ff4d4d]' },
  medical_camp:    { icon: '🏥', label: 'Medical Camp',    color: 'text-[#ff9f00]' },
  environment:     { icon: '🌱', label: 'Environment',     color: 'text-[#8dff6b]' },
  education:       { icon: '📚', label: 'Education',       color: 'text-[#c77dff]' },
};

const NGODashboard = ({ ngo, analytics, events, onCreateEvent, onEditEvent, onTabChange, onRefresh }) => {
  const [hoveredStat, setHoveredStat] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = async (ev) => {
    setCancelLoading(true);
    try {
      await API.delete(`/ngo/events/${ev._id}`);
      showToast('Event cancelled successfully.');
      setCancelTarget(null);
      onRefresh?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel event', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const stats = [
    {
      key: 'events',
      icon: 'event',
      label: 'Total Events',
      value: analytics?.totalEvents ?? (events?.length || 0),
      badge: null,
      onClick: () => {},
    },
    {
      key: 'volunteers',
      icon: 'volunteer_activism',
      label: 'Active Volunteers',
      value: analytics?.activeVolunteers ?? 0,
      badge: 'Live Now',
      badgeStyle: 'text-[#00b8ff]',
      onClick: () => onTabChange('volunteers'),
    },
    {
      key: 'coins',
      icon: 'token',
      label: 'Impact Coins Distributed',
      value: analytics?.totalCoinsDistributed ?? 0,
      badge: null,
      onClick: () => {},
    },
  ];

  const activeEvents = events?.filter(e => getEventStatus(e) !== 'completed') || [];

  // Reusable Event Card Component
  const EventCard = ({ ev }) => {
    const meta = EVENT_TYPE_META[ev.eventType] || EVENT_TYPE_META.volunteer;
    const status = getEventStatus(ev);
    const style = STATUS_STYLES[status];
    const isCompleted = status === 'completed';

    return (
      <div className={`bg-surface-container-low rounded-2xl p-5 border transition-all group ${isCompleted ? 'border-white/5 opacity-60' : 'border-white/5 hover:bg-surface-container-high'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="text-2xl w-10 h-10 flex items-center justify-center flex-shrink-0">{meta.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-black text-sm truncate">{ev.title}</h4>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border flex items-center gap-1 ${style.chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot} inline-block`} />
                  {style.label}
                </span>
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.color} mb-2`}>{meta.label}</p>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {ev.volunteersNeeded > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">group</span>
                    {ev.joinedCount ?? 0} / {ev.volunteersNeeded} joined
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setViewEvent(ev)}
              className="p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-primary-container"
              title="View details"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
            </button>
            <button
              disabled={isCompleted}
              onClick={(e) => { e.stopPropagation(); onEditEvent?.(ev); }}
              className="p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-primary-container disabled:opacity-30 disabled:cursor-not-allowed"
              title={isCompleted ? 'Cannot edit completed events' : 'Edit event'}
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              disabled={isCompleted}
              onClick={() => !isCompleted && setCancelTarget(ev)}
              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-on-surface-variant hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
              title={isCompleted ? 'Already completed' : 'Cancel event'}
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary-container text-on-primary-container'
        }`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      {/* Event Detail View Modal */}
      {viewEvent && (
        <EventDetail event={viewEvent} onClose={() => setViewEvent(null)} />
      )}

      {/* Cancel Confirm Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">warning</span>
              </div>
              <h3 className="font-black text-base">Cancel Event?</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Are you sure you want to cancel <span className="font-bold text-on-surface">"{cancelTarget.title}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface-variant font-black text-sm hover:bg-surface-container-highest transition-colors"
              >
                Keep It
              </button>
              <button
                onClick={() => handleCancel(cancelTarget)}
                disabled={cancelLoading}
                className="flex-1 py-3 rounded-xl bg-red-500/90 text-white font-black text-sm hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((s) => (
          <button
            key={s.key}
            onClick={s.onClick}
            onMouseEnter={() => setHoveredStat(s.key)}
            onMouseLeave={() => setHoveredStat(null)}
            className="bg-surface-container-low p-7 rounded-3xl border border-white/5 hover:bg-surface-container-high transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              {s.badge && (
                <span className={`text-xs font-black ${s.badgeStyle} flex items-center gap-1`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.15em] mb-2 relative z-10">{s.label}</p>
            <h3 className="text-5xl font-black text-on-surface tracking-tighter leading-none relative z-10">{s.value.toLocaleString()}</h3>
          </button>
        ))}
      </section>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events Section */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* 1. Active & Upcoming Events Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                Active & Upcoming
                <span className="px-2.5 py-0.5 bg-primary-container/10 text-primary-container text-[10px] font-black rounded-full border border-primary-container/20">
                  {activeEvents.length}
                </span>
              </h3>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            {activeEvents.length === 0 ? (
              <div className="bg-surface-container-low/50 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                <p className="text-on-surface-variant text-sm font-medium italic opacity-50">(no active or upcoming events)</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeEvents.map((ev) => (
                  <EventCard key={ev._id} ev={ev} />
                ))}
              </div>
            )}
          </section>

          {/* 2. All Events List Section */}
          <section className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                All Events History
                <span className="px-2.5 py-0.5 bg-primary-container/10 text-primary-container text-[10px] font-black rounded-full border border-primary-container/20">
                  {events?.length ?? 0}
                </span>
              </h3>
              <button
                onClick={onCreateEvent}
                className="flex items-center gap-2 text-sm font-black text-primary-container hover:translate-x-1 transition-transform"
              >
                Create New Event
                <span className="material-symbols-outlined text-lg">add_circle</span>
              </button>
            </div>

            {(!events || events.length === 0) ? (
              <div className="relative bg-surface-container-low rounded-[2rem] p-16 flex flex-col items-center justify-center text-center border border-dashed border-outline-variant/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary-container/5 to-transparent" />
                <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mb-6 shadow-2xl relative z-10">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">rocket_launch</span>
                </div>
                <h4 className="text-xl font-black text-on-surface mb-2 relative z-10">Ready for a new mission?</h4>
                <p className="text-on-surface-variant text-sm max-w-sm mb-8 relative z-10 leading-relaxed">
                  No events yet. Start a campaign and begin tracking real-world impact.
                </p>
                <button
                  onClick={onCreateEvent}
                  className="px-8 py-3 bg-primary-container text-on-primary-container font-black rounded-xl hover:shadow-[0_0_24px_rgba(0,255,135,0.3)] transition-all active:scale-95 relative z-10"
                >
                  Schedule First Event
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((ev) => (
                  <EventCard key={ev._id} ev={ev} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Quick Actions */}
        <aside className="space-y-5">
          <h3 className="text-xl font-black tracking-tight">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { icon: 'manage_accounts', label: 'Manage Volunteers', sub: 'Verify applications', tab: 'volunteers' },
              { icon: 'monitoring', label: 'View Analytics', sub: 'Growth reports', tab: 'analytics' },
              { icon: 'favorite', label: 'Donations', sub: 'Pending confirmations', tab: 'donations' },
            ].map((action) => (
              <button
                key={action.tab}
                onClick={() => onTabChange(action.tab)}
                className="w-full flex items-center justify-between p-5 bg-surface-container-low rounded-2xl border border-white/5 hover:bg-surface-container-high transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                    <span className="material-symbols-outlined text-sm">{action.icon}</span>
                  </div>
                  <div>
                    <p className="font-black text-sm">{action.label}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{action.sub}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            ))}
          </div>

          {/* NGO Info Card */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-white/5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">NGO Info</p>
            {ngo?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">call</span>
                <span className="text-on-surface-variant">{ngo.phone}</span>
              </div>
            )}
            {ngo?.address && (
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">location_on</span>
                <span className="text-on-surface-variant text-xs">{ngo.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${ngo?.isVerified ? 'bg-[#00ff87]' : 'bg-[#ff9f00]'}`} />
              <span className="text-xs font-bold text-on-surface-variant">{ngo?.isVerified ? 'Verified NGO' : 'Pending Verification'}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NGODashboard;
