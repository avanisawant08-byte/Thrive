import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import Loader from '../components/Loader';
import EventDetail from '../components/EventDetail';
import UserAvatar from '../components/UserAvatar';
import { getEventImageSrc } from '../utils/eventImageHelper';
import { useToast } from '../context/ToastContext';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTab, setEventTab] = useState('created');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSelf, setIsSelf] = useState(true);
  const [relationship, setRelationship] = useState('none');
  const [followLoading, setFollowLoading] = useState(false);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending_approval': return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">⏳ Pending Approval</span>;
      case 'upcoming': return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🚀 Launched</span>;
      case 'ongoing': return <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>Live</span>;
      case 'completed': return <span className="px-3 py-1 bg-zinc-500/20 text-zinc-300 border border-zinc-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🏁 Completed</span>;
      case 'cancelled': return <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🚫 Cancelled</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">❌ Rejected</span>;
      default: return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;

      if (userId && (!currentUser || currentUser._id !== userId)) {
        // Viewing someone else's public profile
        setIsSelf(false);
        try {
          const res = await API.get(`/social/user/${userId}`);
          setUser(res.data.profile);
          setRelationship(res.data.relationship || 'none');
          setUserPosts(res.data.posts || []);
        } catch (err) {
          console.error('Failed to load public profile:', err);
          toast.error('Could not load user profile');
        } finally {
          setLoading(false);
        }
      } else {
        // Viewing own profile
        setIsSelf(true);
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }
        try {
          const [userRes, actRes, createdEventsRes, joinedEventsRes] = await Promise.all([
            API.get('/auth/profile'),
            API.get('/activities/me'),
            API.get('/events/user/created'),
            API.get('/events/user/joined')
          ]);
          setUser(userRes.data);
          setActivities(actRes.data || []);
          setCreatedEvents(createdEventsRes.data || []);
          setJoinedEvents(joinedEventsRes.data || []);
          localStorage.setItem('user', JSON.stringify(userRes.data));
        } catch (err) {
          console.error('Failed to fetch profile data:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!userId || isSelf) return;
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
        setUser(u => u ? { ...u, followerCount: Math.max(0, (u.followerCount || 1) - 1) } : null);
        toast.info('Unfollowed');
      } else {
        const res = await API.post(`/social/follow/${userId}`);
        const newStatus = res.data.status || 'active';
        setRelationship(newStatus);
        if (newStatus === 'active') {
          setUser(u => u ? { ...u, followerCount: (u.followerCount || 0) + 1 } : null);
        }
        toast.success(res.data.message || (newStatus === 'pending' ? 'Request sent' : 'Following!'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Follow action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) return <Loader loading={true} message="Accessing Neural Profile..." />;

  // Unauthenticated view for personal profile
  if (!user && isSelf) {
    return (
      <main className="max-w-xl mx-auto px-6 pt-16 pb-32 text-center relative z-10">
        <div className="glass-card bg-surface-container-high/60 border border-white/10 rounded-3xl p-10 shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 rounded-2xl bg-primary-container/20 text-primary-container flex items-center justify-center mx-auto mb-6 border border-primary-container/30">
            <span className="material-symbols-outlined text-4xl">account_circle</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Sign in to view your Profile</h2>
          <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
            Create an account or sign in to track your Thrive impact points, manage volunteer activities, and customize your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 rounded-full gradient-button text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3.5 rounded-full glass-button text-sm transition-all"
            >
              Create Account
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Profile not found for other users
  if (!user) {
    return (
      <main className="max-w-md mx-auto px-6 pt-20 pb-32 text-center relative z-10">
        <div className="glass-card p-8 rounded-3xl border border-white/10">
          <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-zinc-500 mb-4 block">person_off</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">User Not Found</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6">The user profile you are looking for does not exist or has been removed.</p>
          <button
            onClick={() => navigate('/social-feed')}
            className="px-6 py-3 rounded-full gradient-button font-bold text-sm"
          >
            Explore Impact Feed
          </button>
        </div>
      </main>
    );
  }

  const approvedImpact = activities.filter(a => a.status === 'approved').length;
  const globalRank = user.rank || '---';

  return (
    <main className="max-w-screen-xl mx-auto px-8 pt-8 pb-32 relative z-10">
      {/* Profile Header */}
      <section className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-16">
        <div className="relative">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full p-1.5 bg-gradient-to-tr from-primary to-transparent glow-green" style={{boxShadow: '0 0 30px var(--glow-color)'}}>
            <UserAvatar 
              src={user?.profilePhoto} 
              name={user?.name} 
              size="w-full h-full" 
              iconSize="text-7xl md:text-8xl" 
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary-container text-on-primary-container w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left pt-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-on-surface">{user?.name || 'Unknown User'}</h1>
          
          <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed mb-8">
            {user?.bio || "No bio yet. Tell the world about your impact journey!"}
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            {user?.city && (
              <span className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {user.city}
              </span>
            )}
            {user?.institute && (
              <span className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">school</span>
                {user.institute}
              </span>
            )}
            {user?.occupation && (
              <span className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">work</span>
                {user.occupation}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
        <div className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02] duration-300 shadow-sm border border-white/5">
          <span className="text-label text-primary uppercase tracking-widest font-bold text-[10px] mb-1">Followers</span>
          <span className="text-3xl font-black text-on-surface mb-0.5">{user?.followerCount || 0}</span>
          <span className="text-on-surface-variant text-xs">Community</span>
        </div>
        <div className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02] duration-300 shadow-sm border border-white/5">
          <span className="text-label text-primary uppercase tracking-widest font-bold text-[10px] mb-1">Following</span>
          <span className="text-3xl font-black text-on-surface mb-0.5">{user?.followingCount || 0}</span>
          <span className="text-on-surface-variant text-xs">Connected</span>
        </div>
        <div className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02] duration-300 shadow-sm border border-white/5">
          <span className="text-label text-primary uppercase tracking-widest font-bold text-[10px] mb-1">Impact Posts</span>
          <span className="text-3xl font-black text-on-surface mb-0.5">{user?.postCount || 0}</span>
          <span className="text-on-surface-variant text-xs">Stories</span>
        </div>
        <div className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02] duration-300 shadow-sm border border-white/5">
          <span className="text-label text-primary uppercase tracking-widest font-bold text-[10px] mb-1">Total Balance</span>
          <span className="text-3xl font-black text-on-surface mb-0.5">{user?.coinBalance || 0}</span>
          <span className="text-on-surface-variant text-xs">Coins Earned</span>
        </div>
        <div className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02] duration-300 shadow-sm border border-white/5 col-span-2 md:col-span-1">
          <span className="text-label text-primary uppercase tracking-widest font-bold text-[10px] mb-1">Global Standing</span>
          <span className="text-3xl font-black text-on-surface mb-0.5">#{globalRank}</span>
          <span className="text-on-surface-variant text-xs">Rank</span>
        </div>
      </section>

      {/* Asymmetric Layout: Interests & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Interests & Actions */}
        <div className="lg:col-span-4 space-y-12">
          <div>
            <h3 className="text-label text-on-surface-variant uppercase tracking-widest font-bold text-[10px] mb-6 opacity-60">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user?.interests && user.interests.length > 0 ? user.interests.map((interest, index) => (
                <span key={index} className="px-4 py-2 bg-surface-container-highest rounded-xl text-xs font-bold text-on-surface">
                  {interest}
                </span>
              )) : (
                <p className="text-on-surface-variant text-xs italic">No interests selected yet.</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {isSelf ? (
              <>
                <Link to="/edit-profile" className="text-center block gradient-button py-4 rounded-2xl active:scale-95 transition-transform duration-200 shadow-lg">
                  Edit Profile
                </Link>
                {user?.role !== 'ngo' && (
                  <Link to="/apply-ngo" className="text-center block bg-surface-container-high border border-primary/30 text-primary hover:bg-primary hover:text-on-primary font-black py-4 rounded-2xl active:scale-95 transition-all duration-200">
                    Apply as NGO
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="bg-surface-container-high text-on-surface font-bold py-4 rounded-2xl active:scale-95 transition-transform duration-200 hover:bg-red-500/10 hover:text-red-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                  relationship === 'active'
                    ? 'bg-surface-container-highest text-on-surface hover:bg-red-500/20 hover:text-red-400'
                    : relationship === 'pending'
                    ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                    : 'gradient-button'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {relationship === 'active' ? 'check' : relationship === 'pending' ? 'hourglass_top' : 'person_add'}
                </span>
                {relationship === 'active' ? 'Following' : relationship === 'pending' ? 'Requested' : 'Follow Creator'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activities */}
        <div className="lg:col-span-8">
          <h3 className="text-label text-on-surface-variant uppercase tracking-widest font-bold text-[10px] mb-6 opacity-60">Recent Impact Activities</h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.slice(0, 3).map(activity => (
                <div key={activity._id} className="bg-surface-container-low p-6 rounded-3xl flex items-center justify-between hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-primary">
                        {activity.activityType === 'volunteer' ? 'volunteer_activism' : 'eco'}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{activity.description}</p>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{new Date(activity.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">+{activity.coinsAwarded}</p>
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Credits</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col items-center justify-center text-center text-on-surface-variant py-16 border border-dashed border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">history</span>
                <p className="font-bold mb-4">No recent activities yet.</p>
                <Link to="/events" className="px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all">Explore Events</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Events Section */}
      <section className="mt-16 border-t border-surface-container-high pt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-black text-on-surface">My Events</h2>
          <div className="flex bg-surface-container-low rounded-xl p-1 w-fit">
            <button 
              onClick={() => setEventTab('created')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${eventTab === 'created' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Created By Me
            </button>
            <button 
              onClick={() => setEventTab('joined')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${eventTab === 'joined' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Joined
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(eventTab === 'created' ? createdEvents : joinedEvents).length > 0 ? (
            (eventTab === 'created' ? createdEvents : joinedEvents).map(event => (
              <div 
                key={event._id} 
                onClick={() => setSelectedEvent(event)}
                className="bg-surface-container-low rounded-2xl overflow-hidden border border-surface-container-high hover:border-primary/50 transition-colors flex flex-col cursor-pointer group"
              >
                <div className="h-32 bg-surface-container-high relative overflow-hidden">
                  <img src={getEventImageSrc(event)} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 shadow-lg">
                    {getStatusBadge(event.status || (event.isApproved ? 'upcoming' : 'pending_approval'))}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-2 text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {new Date(event.startDate || event.date).toLocaleDateString()}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                      className="flex-1 text-center py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">event_busy</span>
              <p className="font-bold">No {eventTab} events found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetail 
          event={selectedEvent} 
          onClose={() => {
            setSelectedEvent(null);
            // Refresh events list to show updated status (e.g. cancelled)
            API.get('/events/user/created').then(res => setCreatedEvents(res.data)).catch(() => {});
            API.get('/events/user/joined').then(res => setJoinedEvents(res.data)).catch(() => {});
          }} 
        />
      )}
    </main>
  );
};

export default UserProfile;
