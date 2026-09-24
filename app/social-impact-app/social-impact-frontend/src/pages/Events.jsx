import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import EventDetail from '../components/EventDetail';
import CreateEvent from './ngo/CreateEvent';
import CustomSelect from '../components/CustomSelect';
import { getEventImageSrc } from '../utils/eventImageHelper';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'soonest', label: 'Soonest' },
  { value: 'popular', label: 'Popular' },
  { value: 'reward', label: 'Highest Reward' }
];

const getCategoryBadgeStyle = (type) => {
  switch (type) {
    case 'Blood Donation':
    case 'blood_donation':
      return {
        dot: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
        text: 'text-red-300',
        label: 'Blood Donation'
      };
    case 'Tree Plant':
    case 'tree_plantation':
      return {
        dot: 'bg-[#00ff87] shadow-[0_0_8px_#00ff87]',
        text: 'text-[#00ff87]',
        label: 'Tree Plantation'
      };
    case 'Beach Clean':
    case 'beach_cleanup':
      return {
        dot: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
        text: 'text-cyan-300',
        label: 'Beach Cleanup'
      };
    case 'Food Drive':
    case 'food_drive':
      return {
        dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
        text: 'text-amber-300',
        label: 'Food Drive'
      };
    case 'Education':
    case 'education':
      return {
        dot: 'bg-purple-400 shadow-[0_0_8px_#c084fc]',
        text: 'text-purple-300',
        label: 'Education'
      };
    default:
      return {
        dot: 'bg-[#00ff87] shadow-[0_0_8px_#00ff87]',
        text: 'text-[#00ff87]',
        label: type || 'Volunteering'
      };
  }
};

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [toast, setToast] = useState(null);

  const categories = ['All', 'Blood Donation', 'Tree Plant', 'Beach Clean', 'Food Drive', 'Education'];

  const fetchEvents = async () => {
    try {
      const response = await API.get(`/events?sort=${sort}`);
      setEvents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [sort]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreateClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please log in to create an event', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    setShowCreateEvent(true);
  };

  const handleEventCreated = () => {
    setShowCreateEvent(false);
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (user && user.role === 'ngo') {
      showToast('Event created successfully! 🚀');
    } else {
      showToast('Community event created! Awaiting admin approval. 🕒');
    }
    fetchEvents();
  };


  const [brokenImages, setBrokenImages] = useState({});

  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(event => event.activityType === filter);

  // Dynamic layout calculation for "Host Your Own Event" card in 3-column grid
  const remainder = filteredEvents.length % 3;
  let ctaColSpan = 'lg:col-span-1';
  if (remainder === 0) {
    ctaColSpan = 'lg:col-span-3';
  } else if (remainder === 1) {
    ctaColSpan = 'lg:col-span-2';
  } else if (remainder === 2) {
    ctaColSpan = 'lg:col-span-1';
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-8 pt-4 sm:pt-12 pb-28 md:pb-24 relative">
      {/* Toast Notification */}
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
          onClose={() => setShowCreateEvent(false)}
          onSuccess={handleEventCreated}
        />
      )}
      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      {/* Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-12">
        <div>
          <span className="text-[0.75rem] uppercase tracking-[0.1em] font-bold text-primary-container mb-2 block">Social Mobilization</span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-slate-900 dark:text-primary transition-colors">Events</h1>
        </div>
        <button 
          onClick={handleCreateClick}
          className="gradient-button font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all w-full sm:w-fit cursor-pointer text-sm"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Create Event</span>
        </button>
      </div>

      {/* Filter & Sort Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-10">
        <div className="flex flex-nowrap sm:flex-wrap gap-2 sm:gap-3 overflow-x-auto py-2 px-1 scrollbar-hide items-center w-full md:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex-shrink-0 active:scale-95 ${
                filter === cat 
                ? 'gradient-button shadow-md' 
                : 'glass-button text-on-surface-variant hover:text-slate-900 dark:hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="self-end md:self-auto">
          <CustomSelect
            value={sort}
            onChange={(val) => setSort(val)}
            options={sortOptions}
            icon="sort"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {filteredEvents.map(event => (
          <div 
            key={event._id} 
            onClick={() => setSelectedEvent(event)}
            className="glass-card rounded-[28px] sm:rounded-[32px] overflow-hidden group flex flex-col justify-between cursor-pointer hover:border-emerald-500/40 dark:hover:border-[#00ff87]/30 transition-all active:scale-[0.99]"
          >
            <div className="h-48 sm:h-56 relative overflow-hidden bg-slate-100 dark:bg-white/5">
              <img 
                alt={event.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                src={getEventImageSrc(event, brokenImages[event._id])} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getEventImageSrc(event, true);
                  setBrokenImages(prev => ({ ...prev, [event._id]: true }));
                }}
              />
              <div className="absolute top-3.5 left-3.5 z-10">
                {(() => {
                  const badge = getCategoryBadgeStyle(event.activityType);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/65 backdrop-blur-xl border border-white/20 shadow-md ${badge.text}`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${badge.dot}`} />
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="p-5 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-primary mb-2.5 leading-tight group-hover:text-emerald-600 dark:group-hover:text-[#00ff87] transition-colors">{event.title}</h3>
                <p className="text-on-surface-variant text-xs sm:text-sm line-clamp-2 mb-5 font-medium leading-relaxed">{event.description}</p>
                <div className="space-y-2 sm:space-y-3 mb-6">
                  <div className="flex items-center gap-2.5 text-on-surface-variant/80">
                    <span className="material-symbols-outlined text-primary-container text-base sm:text-lg">event</span>
                    <span className="text-xs font-medium">{new Date(event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-on-surface-variant/80">
                    <span className="material-symbols-outlined text-primary-container text-base sm:text-lg">location_on</span>
                    <span className="text-xs font-medium truncate">{event.address}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
                className="w-full py-3 sm:py-3.5 rounded-2xl glass-button text-slate-900 dark:text-primary font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer hover:bg-emerald-500/10 dark:hover:bg-[#00ff87]/10"
              >
                View Details
              </button>
            </div>
          </div>
        ))}

        {/* Dynamic Scalable Host Your Event Bento CTA */}
        <div className={`${ctaColSpan} glass-card rounded-[32px] p-1 min-h-[360px]`}>
          <div className="h-full flex flex-col justify-center items-center text-center p-8 glass-card rounded-[30px]">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 dark:bg-primary-container/20 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-emerald-600 dark:text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-primary mb-4">Host Your Own Event?</h3>
            <p className="text-on-surface-variant text-sm mb-8 max-w-md">Empower your community. Create an impact event today and start earning Pulsar Rewards.</p>
            <button 
              onClick={handleCreateClick}
              className="gradient-button text-on-primary font-black px-10 py-4 rounded-2xl shadow-xl w-full max-w-sm active:scale-95 transition-all cursor-pointer"
            >
              GET STARTED
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Events;
