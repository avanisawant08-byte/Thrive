import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';
import LogActivityModal from './LogActivityModal';
import { useToast } from '../context/ToastContext';
import UserAvatar from './UserAvatar';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const path = location.pathname;
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [presetEvent, setPresetEvent] = useState(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const container = document.getElementById('navbar-notifications-container');
      if (container && !container.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    fetchUser();
    window.addEventListener('userUpdated', fetchUser);
    return () => window.removeEventListener('userUpdated', fetchUser);
  }, [location]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { name: 'Dashboard', path: user?.role === 'ngo' ? '/ngo-command' : '/dashboard' },
    { name: 'Find Nearby', path: '/map' },
    { name: 'Events', path: '/events' },
    { name: 'Donations', path: '/donations' },
    { name: 'Impact', path: '/social-feed' },
    { name: 'Rewards', path: '/reward-store' },
    { name: 'Leaderboard', path: '/leaderboard' },
    ...(user?.role === 'admin' ? [{ name: '⚡ Admin', path: '/admin' }] : []),
    ...(user?.role === 'shopkeeper' ? [{ name: '🏪 Shop Portal', path: '/shopkeeper' }] : []),
  ];


  return (
    <>
      <header className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-[20px] docked full-width top-0 sticky z-50 border-b border-slate-200/80 dark:border-white/5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-colors duration-300">
        <div className="flex justify-between items-center px-4 sm:px-8 h-16 sm:h-20 w-full max-w-screen-2xl mx-auto">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <span className="text-lg sm:text-xl font-black tracking-[-0.05em] text-slate-900 dark:text-[#f1ffef] transition-colors">
              THRIVE
            </span>
            <span className="hidden lg:inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 dark:bg-[#00ff87]/10 text-emerald-700 dark:text-[#00ff87] border border-emerald-500/20 dark:border-[#00ff87]/20">
              Connecting Good Deeds with Great Perks
            </span>
          </Link>
          <nav className="hidden md:flex gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`font-inter text-sm font-semibold tracking-[-0.02em] transition-all px-3 py-1.5 rounded-full ${
                  path === link.path 
                  ? 'text-emerald-700 dark:text-[#00ff87] font-bold bg-emerald-500/10 dark:bg-[#00ff87]/10 shadow-sm' 
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-[#00ff87]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 transition-colors">
                <span className="material-symbols-outlined text-emerald-600 dark:text-[#00ff87] text-sm mr-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{user.coinBalance || 0}</span>
              </div>
            )}
            {user && (
              <div id="navbar-notifications-container" className="relative flex items-center">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 sm:p-2 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-[#00ff87] transition-all relative flex items-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
                  title="Notifications"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">notifications</span>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold shadow-sm">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 top-14 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#12151a] border border-slate-200 dark:border-zinc-700/70 shadow-2xl dark:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_20px_rgba(0,255,135,0.08)] rounded-2xl p-4 z-50 max-h-[480px] overflow-hidden flex flex-col transition-colors">
                    {/* Header */}
                    <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-primary text-base">notifications_active</span>
                        <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Notifications</h4>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-600 dark:bg-primary text-white dark:text-zinc-950 rounded-full">
                            {notifications.filter(n => !n.isRead).length} new
                          </span>
                        )}
                      </div>
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <button
                          onClick={async () => {
                            try {
                              await API.put(`/notifications/read-all`);
                              fetchNotifications();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-[11px] text-emerald-600 dark:text-primary hover:text-emerald-700 dark:hover:text-[#00ff87] font-bold hover:underline transition-all"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      {notifications.length === 0 ? (
                        <div className="text-center py-10 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                          <span className="material-symbols-outlined text-3xl mb-2 text-slate-300 dark:text-zinc-600">notifications_off</span>
                          <p className="text-xs font-medium">You're all caught up!</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n._id}
                            onClick={async () => {
                              if (!n.isRead) {
                                try {
                                  await API.put(`/notifications/${n._id}/read`);
                                  fetchNotifications();
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            }}
                            className={`p-3.5 rounded-xl transition-all cursor-pointer text-left border ${
                              n.isRead 
                                ? 'bg-slate-50/80 dark:bg-zinc-900/90 border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800/80' 
                                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-primary/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                n.type === 'event_proof_request' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                n.type === 'follow_request' ? 'bg-emerald-500/20 text-emerald-600 dark:text-primary' :
                                n.isRead ? 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-primary'
                              }`}>
                                <span className="material-symbols-outlined text-base">
                                  {n.type === 'event_proof_request' ? 'assignment' :
                                   n.type === 'follow_request' ? 'person_add' :
                                   n.type?.includes('cancel') ? 'event_busy' : 'notifications'}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold leading-snug mb-1 ${n.isRead ? 'text-slate-600 dark:text-zinc-300' : 'text-slate-900 dark:text-white'}`}>
                                  {n.message}
                                </p>
                                
                                {n.subMessage && (
                                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-normal leading-relaxed mb-2 bg-slate-100 dark:bg-black/40 border border-slate-200/60 dark:border-white/5 p-2 rounded-lg break-words">
                                    {n.subMessage}
                                  </p>
                                )}

                                {n.type === 'event_proof_request' && (
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        const eventRes = await API.get(`/events/${n.referenceId}`);
                                        setPresetEvent(eventRes.data);
                                        setIsLogModalOpen(true);
                                        setShowNotifications(false);
                                        if (!n.isRead) {
                                          await API.put(`/notifications/${n._id}/read`);
                                          fetchNotifications();
                                        }
                                      } catch (err) {
                                        console.error('Failed to fetch preset event details:', err);
                                        toast.error('Failed to load event details: ' + (err.response?.data?.message || err.message));
                                      }
                                    }}
                                    className="text-[11px] font-bold text-white dark:text-zinc-950 bg-emerald-600 dark:bg-[#00ff87] hover:bg-emerald-700 dark:hover:bg-[#00e077] px-3.5 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 w-fit mt-2 shadow-sm"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">upload_file</span>
                                    Submit Proof
                                  </button>
                                )}

                                {n.type === 'follow_request' && (
                                  <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        try {
                                          const requesterId = n.senderId?._id || n.senderId || n.referenceId;
                                          await API.put(`/social/follow/requests/${requesterId}/approve`);
                                          toast.success('Follow request approved!');
                                          await API.put(`/notifications/${n._id}/read`);
                                          fetchNotifications();
                                        } catch (err) {
                                          toast.error(err.response?.data?.message || 'Failed to approve');
                                        }
                                      }}
                                      className="text-[11px] font-bold text-white dark:text-black bg-emerald-600 dark:bg-[#00ff87] hover:bg-emerald-700 dark:hover:bg-[#00e077] px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                                    >
                                      ✓ Accept
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        try {
                                          const requesterId = n.senderId?._id || n.senderId || n.referenceId;
                                          await API.put(`/social/follow/requests/${requesterId}/reject`);
                                          toast.info('Follow request rejected');
                                          await API.put(`/notifications/${n._id}/read`);
                                          fetchNotifications();
                                        } catch (err) {
                                          toast.error(err.response?.data?.message || 'Failed to reject');
                                        }
                                      }}
                                      className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-all active:scale-95 border border-slate-300 dark:border-zinc-700"
                                    >
                                      ✕ Decline
                                    </button>
                                  </div>
                                )}

                                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2 font-medium">
                                  {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-[#00ff87] hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all flex items-center justify-center" 
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            {user ? (
              <>
                <div 
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer transition-transform hover:scale-105"
                  title="User Profile"
                >
                  <UserAvatar 
                    src={user?.profilePhoto} 
                    name={user?.name} 
                    size="w-8 h-8 sm:w-10 sm:h-10" 
                    iconSize="text-lg sm:text-xl" 
                  />
                </div>
                <button 
                  onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                  className="p-1.5 sm:p-2 text-slate-400 dark:text-on-surface-variant/40 hover:text-rose-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">logout</span>
                </button>
              </>
            ) : !(path === '/login' || path === '/register') ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-extrabold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full gradient-button cursor-pointer transition-all"
                >
                  Sign In
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* BottomNavBar Shell (Mobile Only) */}
      <nav className="md:hidden bg-white/95 dark:bg-zinc-900/90 backdrop-blur-[20px] border-t border-slate-200/80 dark:border-white/5 fixed bottom-0 left-0 w-full flex justify-around items-center px-1.5 py-2.5 pb-safe z-50 rounded-t-[28px] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-colors">
        <Link 
          to={user ? (user.role === 'ngo' ? '/ngo-command' : '/dashboard') : '/'} 
          className={`flex flex-col items-center justify-center py-1 px-1 transition-all ${(user ? (path === '/dashboard' || path === '/ngo-command') : path === '/') ? 'text-emerald-600 dark:text-[#00ff87]' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-[#f1ffef]'}`}
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="font-inter text-[9px] uppercase tracking-wider font-bold">Home</span>
        </Link>

        <Link to="/events" className={`flex flex-col items-center justify-center py-1 px-1 transition-all ${path.startsWith('/events') ? 'text-emerald-600 dark:text-[#00ff87]' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-[#f1ffef]'}`}>
          <span className="material-symbols-outlined text-2xl">event_note</span>
          <span className="font-inter text-[9px] uppercase tracking-wider font-bold">Events</span>
        </Link>
        <Link to="/map" className={`flex flex-col items-center justify-center py-1 px-1 transition-all ${path === '/map' ? 'text-emerald-600 dark:text-[#00ff87]' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-[#f1ffef]'}`}>
          <span className="material-symbols-outlined text-2xl">map</span>
          <span className="font-inter text-[9px] uppercase tracking-wider font-bold">Nearby</span>
        </Link>
        <Link to="/donations" className={`flex flex-col items-center justify-center py-1 px-1 transition-all ${path === '/donations' ? 'text-emerald-600 dark:text-[#00ff87]' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-[#f1ffef]'}`}>
          <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
          <span className="font-inter text-[9px] uppercase tracking-wider font-bold">Donate</span>
        </Link>
        <Link to="/social-feed" className={`flex flex-col items-center justify-center py-1 px-1 transition-all ${path === '/social-feed' ? 'text-emerald-600 dark:text-[#00ff87]' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-[#f1ffef]'}`}>
          <span className="material-symbols-outlined text-2xl">diversity_3</span>
          <span className="font-inter text-[9px] uppercase tracking-wider font-bold">Social</span>
        </Link>
        <Link to="/reward-store" className={`flex flex-col items-center justify-center py-1 px-1 transition-all ${path === '/reward-store' ? 'text-emerald-600 dark:text-[#00ff87]' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-[#f1ffef]'}`}>
          <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          <span className="font-inter text-[9px] uppercase tracking-wider font-bold">Wallet</span>
        </Link>
      </nav>
      <LogActivityModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={(msg) => {
          window.dispatchEvent(new Event('activitySubmitted'));
          toast.success(msg);
        }}
        presetEvent={presetEvent}
      />
    </>
  );
};

export default Navbar;
