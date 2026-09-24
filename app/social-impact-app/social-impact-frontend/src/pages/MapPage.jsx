import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';
import 'leaflet/dist/leaflet.css';
import EventDetail from '../components/EventDetail';
import { useToast } from '../context/ToastContext';

// Custom Icons for different event categories
const createCustomIcon = (color, glyph) => {
  return L.divIcon({
    html: `<div class="w-10 h-10 rounded-full bg-white dark:bg-zinc-950 border-2 border-${color} flex items-center justify-center shadow-md dark:shadow-lg shadow-${color}/20 transform transition-transform hover:scale-110">
            <span class="material-symbols-outlined text-${color} text-xl" style="font-variation-settings: 'FILL' 1">${glyph}</span>
           </div>`,
    className: 'custom-leaflet-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const userIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-full h-full rounded-full bg-[#00ff87]/30 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-[#00ff87] border-2 border-white shadow-md"></div>
         </div>`,
  className: 'user-leaflet-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const categoryIcons = {
  blood_donation: createCustomIcon('red-500', 'bloodtype'),
  tree_plantation: createCustomIcon('emerald-500', 'nature_people'),
  volunteering: createCustomIcon('blue-500', 'volunteer_activism'),
  other: createCustomIcon('amber-500', 'star'),
};

// Map Move Listener to update search center on pan/zoom
function MapMoveListener({ onMoveEnd }) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      
      // Calculate radius based on visible bounds
      const bounds = map.getBounds();
      const edge = bounds.getNorthEast();
      const distanceMeters = map.distance(center, edge);
      const radiusKm = Math.ceil(distanceMeters / 1000);
      
      onMoveEnd([center.lat, center.lng], radiusKm);
    }
  });
  return null;
}

const MapPage = () => {
  const toast = useToast();
  const [userLocation, setUserLocation] = useState(null);
  const [searchCenter, setSearchCenter] = useState([28.6139, 77.2090]); // Default to Delhi
  const [mapRadius, setMapRadius] = useState(10); // Dynamic radius based on zoom
  const [mapRef, setMapRef] = useState(null);
  const [events, setEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // Drawer content
  const [selectedType, setSelectedType] = useState('events'); // 'events' or 'activities'
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [radius, setRadius] = useState(10); // in km
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    // 1. Browser Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setSearchCenter(loc);
          if (mapRef) {
            mapRef.setView(loc, 13);
          }
        },
        (error) => {
          console.warn('Geolocation permission denied or error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [mapRef]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const lat = searchCenter[0];
      const lng = searchCenter[1];
      const fetchRadius = Math.max(radius, mapRadius);

      if (selectedType === 'events') {
        const res = await API.get('/events/nearby', {
          params: { latitude: lat, longitude: lng, radius: fetchRadius, category, status, sortBy },
        });
        setEvents(res.data);
      } else {
        const res = await API.get('/activities/nearby', {
          params: { latitude: lat, longitude: lng, radius: fetchRadius, category },
        });
        setActivities(res.data);
      }
    } catch (error) {
      console.error('Error fetching nearby data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce the fetch slightly so it doesn't spam on rapid tiny moves
    const timeoutId = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchCenter, radius, mapRadius, category, status, sortBy, selectedType]);

  const handleJoinEvent = async (eventId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to join events');
      return;
    }
    try {
      const res = await API.post(`/events/${eventId}/join`);
      toast.success(res.data.message || 'Joined event successfully!');
      fetchItems();
      if (selectedItem && selectedItem._id === eventId) {
        setSelectedItem(prev => ({ ...prev, participants: [...(prev.participants || []), 'currentUserPlaceholder'] }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error joining event.');
    }
  };

  const getMarkerIcon = (item) => {
    const isPending = item.status === 'pending';
    if (isPending) {
      const colorMap = {
        blood_donation: 'red-500',
        tree_plantation: 'emerald-500',
        volunteering: 'blue-500',
        other: 'amber-500',
      };
      const color = colorMap[item.activityType] || 'amber-500';
      const glyphMap = {
        blood_donation: 'bloodtype',
        tree_plantation: 'nature_people',
        volunteering: 'volunteer_activism',
        other: 'star',
      };
      const glyph = glyphMap[item.activityType] || 'star';

      return L.divIcon({
        html: `<div class="w-10 h-10 rounded-full bg-zinc-950 border-2 border-dashed border-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 transform transition-transform hover:scale-110 relative opacity-80">
                <span class="material-symbols-outlined text-${color} text-xl" style="font-variation-settings: 'FILL' 1">${glyph}</span>
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border border-zinc-950 flex items-center justify-center text-[9px] font-black text-black">!</span>
               </div>`,
        className: 'custom-leaflet-marker-pending',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });
    }
    return categoryIcons[item.activityType] || categoryIcons['other'];
  };

  return (
    <main className="max-w-screen-2xl mx-auto px-8 pt-6 pb-24 relative z-10 min-h-[calc(100vh-80px)]">
      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-160px)]">
        {/* Filters Side Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-6 bg-white/85 dark:bg-[#0e1116]/90 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200/90 dark:border-white/10 h-fit lg:h-full lg:overflow-y-auto shadow-xl transition-colors">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-[#f1ffef] tracking-tight mb-1">Find Nearby</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Discover local opportunities & impact activities</p>
          </div>

          {/* Toggle Type */}
          <div className="flex bg-slate-100 dark:bg-zinc-950 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/5 transition-colors">
            <button
              onClick={() => { setSelectedType('events'); setSelectedItem(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                selectedType === 'events' 
                  ? 'gradient-button shadow-md dark:bg-[#00ff87] dark:text-black' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => { setSelectedType('activities'); setSelectedItem(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                selectedType === 'activities' 
                  ? 'gradient-button shadow-md dark:bg-[#00ff87] dark:text-black' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Activities
            </button>
          </div>

          <div className="space-y-4">
            {/* Distance Slider */}
            <div>
              <label className="text-xs uppercase font-bold text-slate-600 dark:text-zinc-400 tracking-wider mb-2 block flex justify-between">
                <span>Distance Range</span>
                <span className="text-emerald-600 dark:text-[#00ff87] font-black">{radius} km</span>
              </label>
              <input
                type="range"
                min="2"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full accent-emerald-500 dark:accent-[#00ff87] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-1">
                <span>2 km</span>
                <span>10 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs uppercase font-bold text-slate-600 dark:text-zinc-400 tracking-wider mb-2 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/90 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-[#f1ffef] focus:outline-none focus:border-emerald-500 dark:focus:border-[#00ff87] font-medium transition-colors"
              >
                <option value="All">All Categories</option>
                <option value="Blood Donation">Blood Donation</option>
                <option value="Tree Plant">Tree Plant</option>
                <option value="Volunteering">Volunteering</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Event Specific Filters */}
            {selectedType === 'events' && (
              <>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-600 dark:text-zinc-400 tracking-wider mb-2 block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/90 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-[#f1ffef] focus:outline-none focus:border-emerald-500 dark:focus:border-[#00ff87] font-medium transition-colors"
                  >
                    <option value="All">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-slate-600 dark:text-zinc-400 tracking-wider mb-2 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/90 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-[#f1ffef] focus:outline-none focus:border-emerald-500 dark:focus:border-[#00ff87] font-medium transition-colors"
                  >
                    <option value="distance">Nearest</option>
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              if (userLocation) {
                setSearchCenter([...userLocation]);
                if (mapRef) mapRef.flyTo(userLocation, 13);
              }
            }}
            className="w-full mt-auto py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-950 text-emerald-700 dark:text-[#00ff87] hover:dark:bg-[#00ff87]/10 hover:dark:text-[#00ff87] border border-slate-200/80 dark:border-[#00ff87]/20 rounded-xl text-xs font-black tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">my_location</span>
            RE-CENTER ON ME
          </button>
        </div>

        {/* Interactive Map view */}
        <div className="flex-1 bg-white/80 dark:bg-[#0e1116]/80 backdrop-blur-xl rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/10 relative w-full h-[500px] lg:h-full lg:min-h-[500px] shadow-xl transition-colors">
          <MapContainer
            center={searchCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
            style={{ height: '100%', minHeight: '500px', width: '100%' }}
            ref={setMapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapMoveListener onMoveEnd={(center, newRadius) => {
              setSearchCenter(center);
              if (newRadius > 0) setMapRadius(newRadius);
            }} />

            {/* Render User Marker */}
            {userLocation && (
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  <div className="text-xs font-black text-black">You are here</div>
                </Popup>
              </Marker>
            )}

            {/* Render Event Markers */}
            {selectedType === 'events' && events.map((item) => {
              if (!item.location || !item.location.coordinates || item.location.coordinates.length < 2) return null;
              // GeoJSON format stores coordinates as [lng, lat]
              const position = [item.location.coordinates[1], item.location.coordinates[0]];
              return (
                <Marker
                  key={item._id}
                  position={position}
                  icon={getMarkerIcon(item)}
                  eventHandlers={{
                    click: () => {
                      setSelectedItem(item);
                    },
                  }}
                />
              );
            })}

            {/* Render Activity Markers */}
            {selectedType === 'activities' && activities.map((item) => {
              if (!item.location || !item.location.coordinates || item.location.coordinates.length < 2) return null;
              const position = [item.location.coordinates[1], item.location.coordinates[0]];
              return (
                <Marker
                  key={item._id}
                  position={position}
                  icon={getMarkerIcon(item)}
                  eventHandlers={{
                    click: () => {
                      setSelectedItem(item);
                    },
                  }}
                />
              );
            })}
          </MapContainer>

          {/* Details Drawer */}
          {selectedItem && (
            <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 bg-white/95 dark:bg-[#0c0e12]/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-white/15 p-6 z-[1000] shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_25px_rgba(0,255,135,0.12)] text-slate-900 dark:text-[#f1ffef] animate-slide-up transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    selectedItem.activityType === 'blood_donation' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {selectedItem.activityType?.replace('_', ' ')}
                  </span>
                  <h3 className="text-xl font-bold mt-2 leading-tight text-slate-900 dark:text-white">{selectedItem.title || `Activity by ${selectedItem.userId?.name || 'User'}`}</h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {selectedType === 'events' ? (
                <>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">{selectedItem.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 pt-2 font-medium">
                      <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-[#00ff87]">calendar_month</span>
                      <span>{new Date(selectedItem.startDate || selectedItem.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                      <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-[#00ff87]">location_on</span>
                      <span className="line-clamp-1">{selectedItem.address}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDetailModal(true)}
                      className="flex-1 py-3.5 gradient-button dark:bg-[#00ff87] dark:text-black font-black text-xs uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                      View Details
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-zinc-400">{selectedItem.description}</p>
                  {selectedItem.proofMedia && selectedItem.proofMedia.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {selectedItem.proofMedia.map((imgUrl, i) => (
                        <img key={i} src={imgUrl} alt="Proof" className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-white/10" />
                      ))}
                    </div>
                  )}
                  {selectedItem.status === 'pending' && (
                    <div className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20 w-fit flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                      Pending Review
                    </div>
                  )}
                  <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 pt-1 border-t border-slate-200/80 dark:border-white/5">
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span>Submitted by {selectedItem.userId?.name || 'Anonymous'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDetailModal && selectedItem && (
        <EventDetail event={selectedItem} onClose={() => setShowDetailModal(false)} />
      )}
    </main>
  );
};

export default MapPage;
