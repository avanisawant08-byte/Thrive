import React, { useState } from 'react';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';
import CustomDatePicker from '../../components/CustomDatePicker';
import CustomTimePicker from '../../components/CustomTimePicker';

const EVENT_TYPES = [
  { value: 'volunteer',       icon: '🙋', label: 'Volunteer Event',  desc: 'Physical volunteer presence required' },
  { value: 'donation_drive',  icon: '🎁', label: 'Donation Drive',   desc: 'Collect donated items or money' },
  { value: 'disaster_relief', icon: '🚨', label: 'Disaster Relief',  desc: 'Emergency relief — fast-tracked', urgent: true },
  { value: 'medical_camp',    icon: '🏥', label: 'Medical Camp',     desc: 'Health checkups & medicine distribution' },
  { value: 'environment',     icon: '🌱', label: 'Environment',      desc: 'Tree plantation, beach cleanup, recycling' },
  { value: 'education',       icon: '📚', label: 'Education',        desc: 'Teaching, tutoring, library setup' },
];

const DONATION_TYPES = ['Food', 'Clothes', 'Necessities', 'Monetary'];

const STEPS = ['Event Type', 'Basic Details', 'Type-Specific', 'Extras & Preview'];

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">{label}</label>
    {children}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/50 outline-none ${className}`}
    {...props}
  />
);

const Textarea = ({ ...props }) => (
  <textarea
    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/50 outline-none resize-none"
    {...props}
  />
);

const getLocalDateString = (isoString) => {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getLocalTimeString = (isoString) => {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mm = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const getLocalEndTimeString = (isoString, durationHours) => {
  if (!isoString || !durationHours) return '';
  const dateObj = new Date(isoString);
  const durationMs = Number(durationHours) * 60 * 60 * 1000;
  const endLocalDate = new Date(dateObj.getTime() + durationMs);
  const hh = String(endLocalDate.getHours()).padStart(2, '0');
  const mm = String(endLocalDate.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const calculateDuration = (date, start, end) => {
  if (!date || !start || !end) return 0;
  const startDateTime = new Date(`${date}T${start}`);
  let endDateTime = new Date(`${date}T${end}`);
  if (endDateTime < startDateTime) {
    // If end time is earlier than start time, assume it spans to the next day
    endDateTime.setDate(endDateTime.getDate() + 1);
  }
  const diffMs = endDateTime - startDateTime;
  const diffHours = diffMs / (1000 * 60 * 60);
  return parseFloat(diffHours.toFixed(2));
};

const CreateEvent = ({ onClose, onSuccess, eventToEdit }) => {
  const toast = useToast();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isNgo = user?.role === 'ngo';

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(eventToEdit?.address || '');

  const getInitialEventType = () => {
    if (!eventToEdit) return '';
    if (eventToEdit.eventType) return eventToEdit.eventType;
    const map = {
      volunteering: 'volunteer',
      blood_donation: 'medical_camp',
      tree_plantation: 'environment',
      other: 'volunteer'
    };
    return map[eventToEdit.activityType] || 'volunteer';
  };

  const initialDate = eventToEdit?.date ? getLocalDateString(eventToEdit.date) : '';
  const initialStartTime = eventToEdit?.date ? getLocalTimeString(eventToEdit.date) : '';
  const initialEndTime = (eventToEdit?.date && eventToEdit?.duration) ? getLocalEndTimeString(eventToEdit.date, eventToEdit.duration) : '';

  const [form, setForm] = useState({
    eventType: getInitialEventType(),
    title: eventToEdit?.title || '',
    description: eventToEdit?.description || '',
    date: initialDate,
    startTime: initialStartTime,
    endTime: initialEndTime,
    duration: eventToEdit?.duration || 0,
    location: eventToEdit?.address || '',
    latitude: eventToEdit?.location?.coordinates?.[1] || '',
    longitude: eventToEdit?.location?.coordinates?.[0] || '',
    coinsReward: eventToEdit?.coinsReward || (isNgo ? '' : '500'),
    certificateAvailable: eventToEdit?.certificateAvailable || false,
    // Volunteer specific
    volunteersNeeded: eventToEdit?.volunteersNeeded || '',
    joinPolicy: eventToEdit?.joinPolicy || 'open',
    skillsRequired: eventToEdit?.skillsRequired?.join(', ') || '',
    minAge: eventToEdit?.minAge || '',
    // Donation drive specific
    donationTypesAccepted: eventToEdit?.donationTypesAccepted?.map(t => t.toUpperCase()) || [],
    targetGoal: eventToEdit?.targetGoal || '',
    dropOffLocation: eventToEdit?.dropOffLocation || '',
    dropOffHours: eventToEdit?.dropOffHours || '',
    currentNeeds: eventToEdit?.currentNeeds?.join(', ') || '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleDonationType = (type) => {
    set('donationTypesAccepted',
      form.donationTypesAccepted.includes(type)
        ? form.donationTypesAccepted.filter(t => t !== type)
        : [...form.donationTypesAccepted, type]
    );
  };

  // Auto-calculate duration from date, startTime, and endTime
  React.useEffect(() => {
    if (form.date && form.startTime && form.endTime) {
      const computedDuration = calculateDuration(form.date, form.startTime, form.endTime);
      setForm(f => {
        if (f.duration !== computedDuration) {
          return { ...f, duration: computedDuration };
        }
        return f;
      });
    } else {
      setForm(f => {
        if (f.duration !== 0) {
          return { ...f, duration: 0 };
        }
        return f;
      });
    }
  }, [form.date, form.startTime, form.endTime]);

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      const container = document.getElementById('event-location-search-container');
      if (container && !container.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for event location suggestions
  React.useEffect(() => {
    if (form.location.trim().length < 3 || form.location === selectedAddress) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceId = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.location)}&limit=5&addressdetails=1`);
        const data = await res.json();
        if (data) {
          setSuggestions(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Event autocomplete failed:', err);
      } finally {
        setSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceId);
  }, [form.location, selectedAddress]);

  const handleSelectSuggestion = (item) => {
    set('latitude', parseFloat(item.lat));
    set('longitude', parseFloat(item.lon));
    setSelectedAddress(item.display_name);
    set('location', item.display_name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const canNext = () => {
    if (step === 0) return !!form.eventType;
    if (step === 1) return form.title && form.description && form.date && form.startTime && form.endTime && form.duration > 0 && form.location && form.coinsReward && form.latitude && form.longitude;
    if (step === 2) {
      if (form.eventType === 'volunteer') return !!form.volunteersNeeded;
      if (form.eventType === 'donation_drive') return form.donationTypesAccepted.length > 0 && form.dropOffLocation && form.dropOffHours;
      return true;
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const activityTypeMap = {
        volunteer: 'volunteering',
        medical_camp: 'blood_donation',
        environment: 'tree_plantation',
        donation_drive: 'other',
        disaster_relief: 'other',
        education: 'other'
      };

      const payload = {
        eventType: form.eventType,
        activityType: activityTypeMap[form.eventType] || 'other',
        title: form.title,
        description: form.description,
        date: `${form.date}T${form.startTime}`,
        duration: Number(form.duration),
        location: form.location,
        address: form.location,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        coinsReward: isNgo ? Number(form.coinsReward) : 500,
        certificateAvailable: isNgo ? form.certificateAvailable : false,
        ...(form.eventType === 'volunteer' && {
          volunteersNeeded: Number(form.volunteersNeeded),
          joinPolicy: form.joinPolicy,
          skillsRequired: form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
          minAge: form.minAge ? Number(form.minAge) : undefined,
        }),
        ...(form.eventType === 'donation_drive' && {
          donationTypesAccepted: form.donationTypesAccepted.map(t => t.toLowerCase()),
          targetGoal: form.targetGoal,
          dropOffLocation: form.dropOffLocation,
          dropOffHours: form.dropOffHours,
          currentNeeds: form.currentNeeds.split(',').map(s => s.trim()).filter(Boolean),
        }),
      };

      if (eventToEdit) {
        if (isNgo) {
          await API.put(`/ngo/events/${eventToEdit._id}`, payload);
        } else {
          await API.put(`/events/${eventToEdit._id}`, payload);
        }
      } else {
        if (isNgo) {
          await API.post('/ngo/events', payload);
        } else {
          await API.post('/events', payload);
        }
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    window.history.pushState({ isCreateEventModal: true }, '');
    let isPopped = false;
    const handlePopState = () => {
      isPopped = true;
      onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!isPopped && window.history.state?.isCreateEventModal) {
        window.history.back();
      }
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-surface rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {eventToEdit 
                ? (isNgo ? 'Edit NGO Event' : 'Edit Community Event')
                : (isNgo ? 'Create New NGO Event' : 'Create Community Event')}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 flex items-center gap-2 flex-shrink-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 transition-all ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-colors ${
                  i < step ? 'bg-primary-container text-on-primary-container border-primary-container'
                  : i === step ? 'border-primary-container text-primary-container'
                  : 'border-white/20 text-on-surface-variant'
                }`}>
                  {i < step ? <span className="material-symbols-outlined text-xs">check</span> : i + 1}
                </div>
                <span className="text-[10px] font-bold hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px transition-colors ${i < step ? 'bg-primary-container' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step 0: Event Type */}
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EVENT_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => set('eventType', type.value)}
                  className={`p-5 rounded-2xl border text-left transition-all active:scale-95 ${
                    form.eventType === type.value
                      ? 'bg-primary-container/10 border-primary-container shadow-[0_0_20px_rgba(0,255,135,0.1)]'
                      : 'bg-surface-container-low border-white/5 hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{type.icon}</span>
                    {type.urgent && <span className="text-[9px] font-black uppercase bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">Urgent</span>}
                  </div>
                  <p className="font-black text-sm">{type.label}</p>
                  <p className="text-xs text-on-surface-variant mt-1 leading-snug">{type.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-5">
              <Field label="Event Title">
                <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Tree Plantation Drive 2026" />
              </Field>
              <Field label="Description">
                <Textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe what volunteers/donors will do..." />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <CustomDatePicker
                  label="Event Date"
                  value={form.date}
                  onChange={(d) => set('date', d)}
                  placeholder="Select Date"
                />
                <CustomTimePicker
                  label="Start Time"
                  value={form.startTime}
                  onChange={(t) => set('startTime', t)}
                  icon="schedule"
                  placeholder="Start Time"
                />
                <CustomTimePicker
                  label="End Time"
                  value={form.endTime}
                  onChange={(t) => set('endTime', t)}
                  icon="alarm_off"
                  placeholder="End Time"
                />
              </div>
              {form.duration > 0 && (
                <div className="text-xs text-[#00ff87] font-black flex items-center gap-1.5 bg-[#00ff87]/10 border border-[#00ff87]/20 px-3 py-1.5 rounded-full w-fit">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  Calculated Duration: {form.duration} {Number(form.duration) === 1 ? 'hr' : 'hrs'}
                </div>
              )}
              <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 space-y-3">
                <Field label="Location / Address Search">
                  <div id="event-location-search-container" className="relative">
                    <div className="relative">
                      <Input 
                        value={form.location} 
                        onChange={e => set('location', e.target.value)} 
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
                      <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-0.5 scrollbar-thin">
                        {suggestions.map((item, idx) => (
                          <li 
                            key={idx}
                            onClick={() => handleSelectSuggestion(item)}
                            className="px-3 py-2 text-xs text-zinc-300 hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer transition-colors text-left line-clamp-2 leading-tight"
                          >
                            {item.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Field>

                {(form.latitude && form.longitude) && (
                  <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 p-2 rounded-lg border border-primary/20">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Location Detected ({parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)})
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          set('latitude', pos.coords.latitude);
                          set('longitude', pos.coords.longitude);
                          setSelectedAddress("Current GPS Location");
                          set('location', "Current GPS Location");
                        },
                        (err) => toast.error('Failed to get location: ' + err.message),
                        { enableHighAccuracy: true }
                      );
                    } else {
                      toast.error('Geolocation is not supported by this browser.');
                    }
                  }}
                  className="text-xs font-black text-[#00ff87] flex items-center gap-1 hover:underline bg-transparent border-none outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">my_location</span>
                  Use Current Location
                </button>
              </div>

              {isNgo ? (
                <Field label="Coins Reward (per volunteer)">
                  <Input type="number" min="1" value={form.coinsReward} onChange={e => set('coinsReward', e.target.value)} placeholder="50" />
                </Field>
              ) : (
                <Field label="Coins Reward (Fixed for Community Events)">
                  <div className="flex flex-col gap-1.5">
                    <Input type="number" disabled value={500} className="opacity-60 cursor-not-allowed bg-surface-container-low" />
                    <p className="text-[10px] text-on-surface-variant font-medium">Community events earn a fixed reward of 500 coins upon proof submission after event completion.</p>
                  </div>
                </Field>
              )}
            </div>
          )}

          {/* Step 2: Type-Specific */}
          {step === 2 && (
            <div className="space-y-5">
              {form.eventType === 'volunteer' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Volunteers Needed">
                      <Input type="number" min="1" value={form.volunteersNeeded} onChange={e => set('volunteersNeeded', e.target.value)} placeholder="30" />
                    </Field>
                    <Field label="Minimum Age">
                      <Input type="number" min="1" value={form.minAge} onChange={e => set('minAge', e.target.value)} placeholder="18 (optional)" />
                    </Field>
                  </div>
                  <Field label="Join Policy">
                    <div className="flex gap-3">
                      {[{ v: 'open', label: 'Open — Anyone can join' }, { v: 'approval', label: 'Approval Required' }].map(opt => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => set('joinPolicy', opt.v)}
                          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                            form.joinPolicy === opt.v
                              ? 'bg-primary-container/10 border-primary-container text-primary-container'
                              : 'bg-surface-container-highest border-white/10 text-on-surface-variant'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Skills Required (comma-separated, optional)">
                    <Input value={form.skillsRequired} onChange={e => set('skillsRequired', e.target.value)} placeholder="first aid, driving, cooking" />
                  </Field>
                </>
              )}

              {form.eventType === 'donation_drive' && (
                <>
                  <Field label="Donation Types Accepted">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {DONATION_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleDonationType(type)}
                          className={`px-4 py-2 rounded-full border text-xs font-black transition-all ${
                            form.donationTypesAccepted.includes(type)
                              ? 'bg-primary-container/10 border-primary-container text-primary-container'
                              : 'bg-surface-container-highest border-white/10 text-on-surface-variant'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Target Goal (optional)">
                    <Input value={form.targetGoal} onChange={e => set('targetGoal', e.target.value)} placeholder='e.g. "100 kg rice" or "₹50,000"' />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Drop-off Location">
                      <Input value={form.dropOffLocation} onChange={e => set('dropOffLocation', e.target.value)} placeholder="Warehouse address" />
                    </Field>
                    <Field label="Drop-off Hours">
                      <Input value={form.dropOffHours} onChange={e => set('dropOffHours', e.target.value)} placeholder="9am – 6pm" />
                    </Field>
                  </div>
                  <Field label="Current Needs (comma-separated)">
                    <Input value={form.currentNeeds} onChange={e => set('currentNeeds', e.target.value)} placeholder="rice, blankets, medicines" />
                  </Field>
                </>
              )}

              {!['volunteer', 'donation_drive'].includes(form.eventType) && (
                <div className="p-8 text-center text-on-surface-variant">
                  <span className="text-4xl block mb-3">{EVENT_TYPES.find(t => t.value === form.eventType)?.icon}</span>
                  <p className="font-bold">No extra fields needed for this event type.</p>
                  <p className="text-sm mt-1">Proceed to add a certificate option and preview.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Extras & Preview */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-2xl border border-white/5">
                <div>
                  <p className="font-black text-sm">Issue Completion Certificate</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {isNgo ? 'Volunteers receive a digital certificate' : 'Only verified NGOs can issue completion certificates'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isNgo}
                  onClick={() => set('certificateAvailable', !form.certificateAvailable)}
                  className={`w-12 h-6 rounded-full transition-colors duration-300 relative flex-shrink-0 ${
                    form.certificateAvailable ? 'bg-primary-container' : 'bg-surface-container-highest border border-white/20'
                  } ${!isNgo ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    form.certificateAvailable ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Preview Card */}
              <div className="p-6 bg-surface-container-low rounded-2xl border border-primary-container/20 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary-container">Event Preview</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{EVENT_TYPES.find(t => t.value === form.eventType)?.icon}</span>
                  <div>
                    <h4 className="font-black">{form.title || 'Untitled Event'}</h4>
                    <p className="text-xs text-on-surface-variant">{EVENT_TYPES.find(t => t.value === form.eventType)?.label}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
                  <span>📅 {form.date ? new Date(`${form.date}T${form.startTime || '00:00'}`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}</span>
                  <span>⏱ {form.duration || '—'} hrs</span>
                  <span>📍 {form.location || 'TBD'}</span>
                  <span>🪙 {form.coinsReward || '0'} coins</span>
                  {form.volunteersNeeded && <span>👥 {form.volunteersNeeded} volunteers needed</span>}
                  {form.certificateAvailable && <span>📜 Certificate available</span>}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{form.description}</p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-3 flex-shrink-0">
          <button
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl font-black text-sm bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex-1 py-3 rounded-xl font-black text-sm bg-primary-container text-on-primary-container disabled:opacity-40 hover:shadow-[0_0_20px_rgba(0,255,135,0.2)] transition-all active:scale-95"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl font-black text-sm bg-primary-container text-on-primary-container disabled:opacity-40 hover:shadow-[0_0_20px_rgba(0,255,135,0.2)] transition-all active:scale-95"
            >
              {submitting ? 'Saving...' : eventToEdit ? 'Save Changes 💾' : 'Launch Event 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
