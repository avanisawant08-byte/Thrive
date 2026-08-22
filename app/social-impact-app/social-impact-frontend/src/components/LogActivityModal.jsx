import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import CustomSelect from './CustomSelect';

const LogActivityModal = ({ isOpen, onClose, onSuccess, presetEvent = null }) => {
  const toast = useToast();
  const [activityType, setActivityType] = useState('volunteering');
  const [eventId, setEventId] = useState('');
  const [description, setDescription] = useState('');
  const [proofMedia, setProofMedia] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [myEvents, setMyEvents] = useState([]);

  const [locationQuery, setLocationQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (presetEvent) {
        setEventId(presetEvent._id);
        const mappedType = ['volunteering', 'tree_plantation', 'blood_donation', 'other'].includes(presetEvent.activityType)
          ? presetEvent.activityType
          : 'volunteering';
        setActivityType(mappedType);
        setMyEvents([presetEvent]);
      } else {
        API.get('/events')
          .then(res => setMyEvents(res.data.filter(e => e.status !== 'completed')))
          .catch(err => console.error(err));
        setEventId('');
        setActivityType('volunteering');
      }
    }
  }, [isOpen, presetEvent]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const container = document.getElementById('location-search-container');
      if (container && !container.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for address suggestions
  useEffect(() => {
    if (locationQuery.trim().length < 3 || locationQuery === selectedAddress) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceId = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=5&addressdetails=1`);
        const data = await res.json();
        if (data) {
          setSuggestions(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Autocomplete search failed:', err);
      } finally {
        setSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceId);
  }, [locationQuery, selectedAddress]);

  const handleSelectSuggestion = (item) => {
    setLatitude(parseFloat(item.lat));
    setLongitude(parseFloat(item.lon));
    setSelectedAddress(item.display_name);
    setLocationQuery(item.display_name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('activityType', activityType);
    if (eventId) formData.append('eventId', eventId);
    formData.append('description', description);
    if (locationQuery) formData.append('address', locationQuery);
    if (latitude) formData.append('latitude', latitude);
    if (longitude) formData.append('longitude', longitude);
    if (proofMedia) {
      for (let i = 0; i < proofMedia.length; i++) {
        formData.append('proofMedia', proofMedia[i]);
      }
    }

    try {
      await API.post('/activities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLoading(false);
      onSuccess('Activity logged successfully! Pending verification.');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to log activity');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-card border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-on-surface-variant hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-900 dark:text-on-surface">
            <span className="material-symbols-outlined text-primary-container">add_circle</span>
            Log Impact Activity
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Activity Type</label>
              <CustomSelect
                value={activityType}
                onChange={val => setActivityType(val)}
                options={[
                  { value: 'volunteering', label: 'Volunteering' },
                  { value: 'tree_plantation', label: 'Tree Plantation' },
                  { value: 'blood_donation', label: 'Blood Donation' },
                  { value: 'other', label: 'Other' }
                ]}
                icon="volunteer_activism"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Link to Event (Optional)</label>
              <CustomSelect
                value={eventId}
                onChange={val => setEventId(val)}
                options={[
                  { value: '', label: 'None / Self-Driven' },
                  ...myEvents.map(ev => ({ value: ev._id, label: ev.title }))
                ]}
                icon="event"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Description</label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-surface-container-low border border-slate-200/80 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors h-24 resize-none text-on-surface"
                placeholder="What did you do? Describe your impact..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Proof Media (Images)</label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={e => setProofMedia(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full border-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl p-6 text-center group-hover:border-primary/50 transition-colors bg-surface-container-low">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">cloud_upload</span>
                  <p className="text-sm font-bold text-on-surface-variant">
                    {proofMedia && proofMedia.length > 0 
                      ? `${proofMedia.length} file(s) selected` 
                      : 'Click or drag photos here'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-3">
              <label className="block text-xs font-bold text-on-surface-variant">Location Search (Optional)</label>
              
              <div id="location-search-container" className="relative">
                <div className="relative">
                  <input 
                    type="text"
                    value={locationQuery}
                    onChange={e => setLocationQuery(e.target.value)}
                    className="w-full bg-surface-container-highest border border-slate-200/80 dark:border-white/10 rounded-lg pl-3 pr-10 py-2.5 outline-none focus:border-primary/50 transition-colors text-sm text-on-surface"
                    placeholder="Type to search address..."
                    onFocus={() => {
                      if (suggestions.length > 0) setShowDropdown(true);
                    }}
                  />
                  {searchingLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                </div>

                {showDropdown && suggestions.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl p-1.5 space-y-0.5 scrollbar-thin">
                    {suggestions.map((item, idx) => (
                      <li 
                        key={idx}
                        onClick={() => handleSelectSuggestion(item)}
                        className="px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-primary/10 hover:text-emerald-700 dark:hover:text-primary rounded-lg cursor-pointer transition-colors line-clamp-2 leading-tight"
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {(latitude && longitude) && (
                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 p-2 rounded-lg border border-primary/20">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Location Detected ({parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)})
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLatitude(pos.coords.latitude);
                        setLongitude(pos.coords.longitude);
                        setSelectedAddress("Current GPS Location");
                        setLocationQuery("Current GPS Location");
                      },
                      (err) => toast.error('Failed to get location: ' + err.message),
                      { enableHighAccuracy: true }
                    );
                  } else {
                    toast.error('Geolocation not supported by browser.');
                  }
                }}
                className="text-xs font-bold text-emerald-600 dark:text-primary flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none outline-none"
              >
                <span className="material-symbols-outlined text-sm">my_location</span>
                Detect Current Location
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl gradient-button font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:scale-100"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Submit Proof
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LogActivityModal;
