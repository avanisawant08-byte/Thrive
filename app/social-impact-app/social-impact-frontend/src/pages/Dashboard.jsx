import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import LogActivityModal from '../components/LogActivityModal';
import EventDetail from '../components/EventDetail';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      // Parallel fetching for performance
      const [userRes, actRes, eventRes] = await Promise.allSettled([
        API.get('/auth/profile'),
        API.get('/activities/me'),
        API.get('/events')
      ]);

      const storedUser = JSON.parse(localStorage.getItem('user') || '{"name":"Jane Doe","coinBalance":450}');
      const userObj = userRes.status === 'fulfilled' ? userRes.value.data : storedUser;
      const actObj = actRes.status === 'fulfilled' ? (actRes.value.data || []) : [];
      const eventObj = eventRes.status === 'fulfilled' ? (eventRes.value.data || []).slice(0, 3) : [];

      setUser(userObj);
      setActivities(actObj);
      setEvents(eventObj);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.clear();
        navigate('/login', { replace: true });
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    window.addEventListener('activitySubmitted', fetchData);
    return () => window.removeEventListener('activitySubmitted', fetchData);
  }, []);

  const downloadHistoryReport = () => {
    if (activities.length === 0) return;
    const headers = ['Activity Type', 'Description', 'Date', 'Coins Awarded', 'Status'];
    const rows = activities.map(act => [
      act.activityType,
      act.description.replace(/"/g, '""'),
      new Date(act.createdAt).toLocaleString(),
      act.coinsAwarded,
      act.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${user.name}_impact_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast('Activity report downloaded successfully! 📊');
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-primary font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Neural Core...</p>
      </div>
    </div>
  );
  
  if (!user) return null;

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-8 pb-28 md:pb-12 space-y-8 md:space-y-12 relative z-10">
      {/* Welcome Banner & Asymmetric Hero */}
      <header className="relative overflow-hidden rounded-3xl md:rounded-[40px] glass-card p-6 sm:p-8 md:p-14 border border-slate-200/80 dark:border-white/10 shadow-xl transition-colors">
        {/* Subtle Ambient Corner Glow */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-emerald-500/10 dark:bg-[#00ff87]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00ff87] animate-pulse"></span>
              <p className="text-emerald-700 dark:text-[#00ff87] font-label text-[10px] uppercase tracking-[0.18em] font-black">Connecting Good Deeds with Great Perks</p>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.95] sm:leading-[0.9]">
              Welcome back, <br/>
              <span className="text-emerald-600 dark:text-[#00ff87]">{user.name}</span>
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 max-w-md text-base sm:text-lg leading-relaxed font-medium">
              You have completed <span className="text-emerald-600 dark:text-[#00ff87] font-bold">{activities.filter(a => a.status === 'approved').length}</span> verified impact activities.
              {user.coinBalance < 1000 ? " Start your next mission to reach Bronze tier." : " You're on track for the Monthly Impact Award."}
            </p>
          </div>
          
          {/* Large Coin Balance Card */}
          <div className="w-full md:w-[360px] p-6 sm:p-8 rounded-3xl bg-slate-100/90 dark:bg-[#0d1015]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/15 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,255,135,0.1)] relative group overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 dark:bg-[#00ff87]/20 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-400/30 dark:group-hover:bg-[#00ff87]/30 transition-all duration-700"></div>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-zinc-400">Pulse Credit System</span>
              <span className="material-symbols-outlined text-emerald-600 dark:text-[#00ff87] text-3xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 dark:text-white">{user.coinBalance.toLocaleString()}</span>
              <span className="text-emerald-600 dark:text-[#00ff87] font-bold text-base sm:text-lg tracking-tight">Coins</span>
            </div>
            <div className="mt-8 sm:mt-10">
              <button onClick={() => navigate('/reward-store')} className="w-full py-3.5 sm:py-4 rounded-2xl gradient-button dark:bg-[#00ff87] dark:text-black font-black text-xs sm:text-sm tracking-tight cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                REDEEM REWARDS
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div 
          onClick={() => document.getElementById('interaction-log').scrollIntoView({ behavior: 'smooth' })}
          className="glass-card p-8 rounded-[32px] space-y-6 hover:border-emerald-500/40 dark:hover:border-primary/20 transition-all group shadow-md cursor-pointer border border-slate-200/80 dark:border-white/10"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <span className="material-symbols-outlined text-emerald-600 dark:text-primary text-3xl">volunteer_activism</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-on-surface-variant/60 text-[10px] font-black uppercase tracking-[0.2em]">Total Engagements</p>
            <p className="text-5xl font-black text-slate-900 dark:text-on-surface mt-1">{activities.filter(a => a.status === 'approved').length}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 dark:text-primary font-bold text-[10px] uppercase tracking-widest">+ {activities.filter(a => new Date(a.createdAt) > new Date(Date.now() - 7*86400000)).length} this week</span>
          </div>
        </div>

        <div 
          onClick={() => document.getElementById('interaction-log').scrollIntoView({ behavior: 'smooth' })}
          className="glass-card p-8 rounded-[32px] space-y-6 hover:border-sky-500/40 dark:hover:border-secondary/20 transition-all group shadow-md cursor-pointer border border-slate-200/80 dark:border-white/10"
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 dark:bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <span className="material-symbols-outlined text-sky-600 dark:text-secondary text-3xl">pending_actions</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-on-surface-variant/60 text-[10px] font-black uppercase tracking-[0.2em]">Pending Verifications</p>
            <p className="text-5xl font-black text-slate-900 dark:text-on-surface mt-1">{activities.filter(a => a.status === 'pending').length}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sky-700 dark:text-secondary font-bold text-[10px] uppercase tracking-widest">Awaiting Review</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/leaderboard')}
          className="glass-card p-8 rounded-[32px] space-y-6 hover:border-teal-500/40 dark:hover:border-tertiary/20 transition-all group shadow-md cursor-pointer border border-slate-200/80 dark:border-white/10"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 dark:bg-tertiary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <span className="material-symbols-outlined text-teal-600 dark:text-tertiary text-3xl">military_tech</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-on-surface-variant/60 text-[10px] font-black uppercase tracking-[0.2em]">Community Standing</p>
            <p className="text-5xl font-black text-slate-900 dark:text-on-surface mt-1">#{user.rank || '---'}</p>
          </div>
          <p className="text-teal-700 dark:text-tertiary font-bold text-[10px] uppercase tracking-widest">Real-time Leaderboard Position</p>
        </div>
      </section>

      {/* Recommended Missions */}
      {events.length > 0 && (
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-on-surface uppercase">Missions for You</h2>
              <p className="text-slate-600 dark:text-on-surface-variant text-base font-medium">Verified impact opportunities near your location.</p>
            </div>
            <button 
              onClick={() => navigate('/events')}
              className="text-emerald-600 dark:text-primary font-black text-xs uppercase tracking-[0.2em] hover:opacity-70 transition-all flex items-center gap-2"
            >
              Explore All <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide -mx-6 px-6">
            {events.map((event) => (
              <div 
                key={event._id} 
                onClick={() => setSelectedEvent(event)}
                className="flex-shrink-0 w-80 group cursor-pointer glass-card rounded-[32px] overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-lg transition-transform hover:-translate-y-1"
              >
                <div className="relative h-56 rounded-t-[32px] overflow-hidden shadow-md">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={event.eventImage || `https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600`} />
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-black/65 backdrop-blur-xl rounded-full text-[10px] font-black text-emerald-400 dark:text-primary uppercase tracking-[0.2em] border border-white/20 shadow-md">
                    {event.activityType?.replace('_', ' ')}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <p className="text-white font-black text-xl tracking-tight mb-1">{event.title}</p>
                    <p className="text-zinc-300 text-xs font-medium">{event.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Interaction Log */}
      <section id="interaction-log" className="space-y-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-on-surface uppercase">Interaction Log</h2>
        <div className="glass-card rounded-[40px] overflow-hidden shadow-xl border border-slate-200/80 dark:border-white/10 transition-colors">
          <div className="divide-y divide-slate-200/80 dark:divide-white/5">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity._id} className="p-8 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-surface-container-high/50 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-surface-container-highest flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-200/60 dark:border-transparent">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {activity.activityType === 'volunteer' ? 'volunteer_activism' : 
                       activity.activityType === 'donation' ? 'inventory_2' : 'eco'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-900 dark:text-on-surface tracking-tight">{activity.description}</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-on-surface-variant/60 mt-1">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="font-black text-2xl text-emerald-600 dark:text-primary">+{activity.coinsAwarded}</p>
                    <p className="text-[9px] font-black text-slate-400 dark:text-on-surface-variant/40 uppercase tracking-[0.2em]">Impact Credits</p>
                  </div>
                  <span className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border-2 ${
                    activity.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-primary/10 dark:text-primary dark:border-primary/20' :
                    activity.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:border-yellow-500/20' :
                    'bg-rose-50 text-rose-600 border-rose-200 dark:bg-error/10 dark:text-error dark:border-error/20'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center space-y-4">
                <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-on-surface-variant/20">history_edu</span>
                <p className="text-slate-500 dark:text-on-surface-variant font-bold uppercase tracking-widest text-sm">No activity log found</p>
              </div>
            )}
          </div>
          {activities.length > 0 && (
            <div className="p-6 bg-slate-100/70 dark:bg-surface-container-high/20 flex justify-center border-t border-slate-200/80 dark:border-transparent">
              <button 
                onClick={downloadHistoryReport}
                className="text-slate-600 hover:text-emerald-700 dark:text-on-surface-variant/60 dark:hover:text-primary text-[10px] font-black uppercase tracking-[0.3em] transition-all cursor-pointer">
                Download Full History Report
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      <button onClick={() => setIsLogModalOpen(true)} className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-16 h-16 rounded-full gradient-button dark:bg-[#00ff87] dark:text-black flex items-center justify-center shadow-2xl z-40 hover:scale-110 active:scale-95 transition-all cursor-pointer">
        <span className="material-symbols-outlined text-3xl font-black text-white dark:text-black">add</span>
      </button>

      <LogActivityModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        onSuccess={(msg) => {
          setToast(msg);
          setTimeout(() => setToast(null), 3000);
        }}
      />

      {selectedEvent && (
        <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-primary text-on-primary px-6 py-4 rounded-2xl font-bold shadow-2xl transition-all">
          {toast}
        </div>
      )}
    </main>
  );
};

export default Dashboard;
