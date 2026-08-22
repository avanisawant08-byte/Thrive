import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TABS = ['Pending', 'Approved', 'Rejected', 'Active', 'Volunteers'];

const VolunteerManagement = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [requests, setRequests] = useState({ Pending: [], Approved: [], Rejected: [], Active: [], Volunteers: [] });
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const evRes = await API.get('/ngo/events');
      const evList = evRes.data || [];
      setEvents(evList);

      const allRequests = { Pending: [], Approved: [], Rejected: [], Active: [], Volunteers: [] };
      const uniqueVolunteersMap = new Map();

      for (const ev of evList) {
        const isCompleted = ev.status === 'completed';
        const isOngoing = ev.status === 'ongoing';

        // 1. Fetch pending/rejected requests for active or upcoming events only
        if (!isCompleted) {
          try {
            const rRes = await API.get(`/ngo/events/${ev._id}/requests`);
            (rRes.data || []).forEach(r => {
              if (r.status === 'pending') {
                allRequests.Pending.push({ ...r, eventTitle: ev.title, eventId: ev._id });
              } else if (r.status === 'rejected') {
                allRequests.Rejected.push({ ...r, eventTitle: ev.title, eventId: ev._id });
              }
            });
          } catch (_) {}
        }

        // 2. Map approved participants from the populated participants array on the event
        const participants = ev.participants || [];
        participants.forEach(p => {
          const volunteerObj = {
            _id: p._id,
            userId: p,
            eventTitle: ev.title,
            eventId: ev._id,
            appliedAt: ev.createdAt
          };

          // Approved Tab (Approved/Enrolled volunteers in active/upcoming events)
          if (!isCompleted) {
            allRequests.Approved.push(volunteerObj);
          }

          // Active Tab (Volunteers in currently ongoing events)
          if (isOngoing) {
            allRequests.Active.push(volunteerObj);
          }

          // Overall Volunteers Tab (All unique users ever participating in any event of this NGO)
          if (!uniqueVolunteersMap.has(p._id)) {
            uniqueVolunteersMap.set(p._id, {
              ...volunteerObj,
              eventsParticipated: [ev.title]
            });
          } else {
            uniqueVolunteersMap.get(p._id).eventsParticipated.push(ev.title);
          }
        });
      }

      // Convert unique map to overall array
      allRequests.Volunteers = Array.from(uniqueVolunteersMap.values());
      setRequests(allRequests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (eventId, userId, action) => {
    try {
      await API.put(`/ngo/events/${eventId}/requests/${userId}`, { action });
      showToast(action === 'approve' ? 'Volunteer approved!' : 'Request rejected.');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleBulkApprove = async () => {
    const pending = requests.Pending.filter(r => selectedEvent === 'all' || r.eventId === selectedEvent);
    for (const r of pending) {
      try { await API.put(`/ngo/events/${r.eventId}/requests/${r.userId?._id}`, { action: 'approve' }); } catch (_) {}
    }
    showToast(`Approved ${pending.length} volunteer(s)!`);
    fetchData();
  };

  const filtered = requests[activeTab].filter(r =>
    selectedEvent === 'all' || r.eventId === selectedEvent
  );

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 transition-all ${
          toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary-container text-on-primary-container'
        }`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">Volunteer Management</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            className="bg-surface-container-low border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
          >
            <option value="all">All Events</option>
            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
          </select>
          {activeTab === 'Pending' && requests.Pending.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl text-sm font-black hover:shadow-[0_0_16px_rgba(0,255,135,0.3)] transition-all active:scale-95"
            >
              Bulk Approve
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low p-1 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === tab
                ? 'bg-primary-container text-on-primary-container shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab ? 'bg-on-primary-container/20' : 'bg-surface-container-high'
            }`}>
              {requests[tab].length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl opacity-20 block mb-3">group</span>
          <p className="font-bold">No {activeTab.toLowerCase()} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, idx) => (
            <div key={idx} className="bg-surface-container-low rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center font-black text-primary-container flex-shrink-0 overflow-hidden">
                {req.userId?.profilePhoto
                  ? <img src={req.userId.profilePhoto} alt="" className="w-full h-full object-cover" />
                  : (req.userId?.name?.substring(0, 2) || 'V').toUpperCase()
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-sm">{req.userId?.name || 'Unknown Volunteer'}</p>
                  {activeTab === 'Volunteers' ? (
                    <span className="text-[9px] font-black text-primary-container bg-primary-container/10 border border-primary-container/20 px-2 py-0.5 rounded-full">
                      {req.eventsParticipated?.length || 1} event{(req.eventsParticipated?.length || 1) !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
                      {req.eventTitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
                    {req.userId?.coinBalance ?? 0} coins
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">event_available</span>
                    {req.userId?.totalActivities ?? 0} activities
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {req.appliedAt ? new Date(req.appliedAt).toLocaleDateString('en-IN') : 'Recently'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {activeTab === 'Pending' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(req.eventId, req.userId?._id, 'reject')}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                  <button
                    onClick={() => handleAction(req.eventId, req.userId?._id, 'approve')}
                    className="p-2.5 rounded-xl bg-primary-container/10 text-primary-container hover:bg-primary-container/20 transition-colors border border-primary-container/20"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                </div>
              )}
              {activeTab === 'Approved' && (
                <span className="text-[10px] font-black text-[#00ff87] bg-[#00ff87]/10 px-3 py-1 rounded-full border border-[#00ff87]/20">APPROVED</span>
              )}
              {activeTab === 'Rejected' && (
                <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">REJECTED</span>
              )}
              {activeTab === 'Active' && (
                <span className="text-[10px] font-black text-[#00ff87] bg-[#00ff87]/10 px-3 py-1 rounded-full border border-[#00ff87]/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                  ACTIVE NOW
                </span>
              )}
              {activeTab === 'Volunteers' && (
                <span className="text-[10px] font-black text-primary-container bg-primary-container/10 px-3 py-1 rounded-full border border-primary-container/20">VOLUNTEER</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerManagement;
