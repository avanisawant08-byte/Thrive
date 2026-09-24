import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import NGODashboard from './ngo/NGODashboard';
import CreateEvent from './ngo/CreateEvent';
import VolunteerManagement from './ngo/VolunteerManagement';
import NGOActivityVerification from './ngo/NGOActivityVerification';
import NGODonations from './ngo/NGODonations';
import NGOAnalytics from './ngo/NGOAnalytics';
import NGOSocial from './ngo/NGOSocial';

const NAV_TABS = [
  { key: 'dashboard',  icon: 'dashboard',        label: 'Dashboard' },
  { key: 'verification', icon: 'verified',       label: 'Verification' },
  { key: 'volunteers', icon: 'manage_accounts',   label: 'Volunteers' },
  { key: 'donations',  icon: 'favorite',          label: 'Donations' },
  { key: 'social',     icon: 'campaign',          label: 'Social' },
  { key: 'analytics',  icon: 'monitoring',        label: 'Analytics' },
];

const NGOCommandCenter = () => {
  const navigate = useNavigate();
  const [ngo, setNgo] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, dashRes, evRes] = await Promise.allSettled([
        API.get('/ngo/profile'),
        API.get('/ngo/dashboard'),
        API.get('/ngo/events'),
      ]);
      if (profileRes.status === 'fulfilled') setNgo(profileRes.value.data);
      if (dashRes.status === 'fulfilled') setAnalytics(dashRes.value.data);
      if (evRes.status === 'fulfilled') setEvents(evRes.value.data || []);
    } catch (err) {
      console.error('NGO data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleEventCreated = () => {
    setShowCreateEvent(false);
    showToast('Event created successfully! 🚀');
    fetchAll();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-container/20 border-t-primary-container rounded-full animate-spin" />
        <p className="text-primary-container font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
          Loading Command Center...
        </p>
      </div>
    </div>
  );

  if (!ngo) {
    const isGuest = !localStorage.getItem('token');
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div className="glass-card bg-surface-container-high/60 border border-white/10 rounded-3xl p-10 max-w-md w-full shadow-2xl">
          <span className="material-symbols-outlined text-6xl text-primary mb-4 block">domain</span>
          <h2 className="text-2xl font-black text-white mb-2">
            {isGuest ? 'NGO Portal Access' : 'No NGO Profile Found'}
          </h2>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
            {isGuest 
              ? 'Please sign in with your registered NGO account to access the Command Center.'
              : 'You are logged in as a volunteer. Apply for an organization account to manage events.'}
          </p>
          <button 
            onClick={() => navigate(isGuest ? '/login' : '/apply-ngo')} 
            className="w-full px-6 py-3.5 bg-primary-container text-on-primary-container rounded-xl font-black text-sm shadow-lg shadow-primary-container/20 hover:scale-105 active:scale-95 transition-all"
          >
            {isGuest ? 'Sign In as NGO' : 'Apply as NGO'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Global Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 transition-all ${
          toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary-container text-on-primary-container'
        }`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateEvent
          onClose={() => { setShowCreateEvent(false); setEventToEdit(null); }}
          onSuccess={handleEventCreated}
          eventToEdit={eventToEdit}
        />
      )}

      {/* Top Header */}
      <header className="border-b border-white/5 bg-surface/80 backdrop-blur-xl sticky top-0 z-40 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          {/* NGO Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high overflow-hidden border border-white/10">
              {ngo.logo
                ? <img src={ngo.logo} alt="NGO Logo" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-primary-container/20 text-primary-container font-black">
                    {ngo.name?.substring(0, 2).toUpperCase()}
                  </div>
              }
            </div>
            {ngo.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-container rounded-full flex items-center justify-center border-2 border-surface">
                <span className="material-symbols-outlined text-[10px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            )}
          </div>

          {/* NGO Name + Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight truncate">{ngo.name}</h1>
              {ngo.isPremier && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary-container/10 text-primary-container border border-primary-container/20 rounded-full flex-shrink-0">
                  ⭐ Premier Organization
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant">{ngo.phone || 'NGO Command Center'}</p>
          </div>

          {/* Impact Score + Settings */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-xl border border-white/5 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
              <span className="text-sm font-black text-primary-container">{ngo.impactScore ?? 0}</span>
              <span className="text-[10px] text-on-surface-variant">Impact Score</span>
            </button>
            <button className="p-2.5 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">settings</span>
            </button>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {NAV_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-black border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-primary-container text-primary-container'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <NGODashboard
            ngo={ngo}
            analytics={analytics}
            events={events}
            onCreateEvent={() => setShowCreateEvent(true)}
            onEditEvent={(ev) => { setEventToEdit(ev); setShowCreateEvent(true); }}
            onTabChange={setActiveTab}
            onRefresh={fetchAll}
          />
        )}
        {activeTab === 'verification' && <NGOActivityVerification />}
        {activeTab === 'volunteers' && <VolunteerManagement events={events} />}
        {activeTab === 'donations' && <NGODonations />}
        {activeTab === 'social' && <NGOSocial ngo={ngo} />}
        {activeTab === 'analytics' && <NGOAnalytics analytics={analytics} events={events} />}
      </main>
    </div>
  );
};

export default NGOCommandCenter;
