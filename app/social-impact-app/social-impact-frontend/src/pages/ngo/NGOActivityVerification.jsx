import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const NGOActivityVerification = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPendingActivities();
  }, []);

  const fetchPendingActivities = async () => {
    setLoading(true);
    try {
      const response = await API.get('/activities/pending');
      setActivities(response.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load pending activities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (activityId, status, eventId) => {
    // If approving, we should award coins. We can fetch coinsReward from event or prompt the NGO.
    // For simplicity, we'll try to get it from the populated eventId if available, or default to 50.
    const activity = activities.find(a => a._id === activityId);
    let coinsAwarded = 0;
    if (status === 'approved') {
      coinsAwarded = prompt('Enter coins to award for this activity:', activity?.eventId?.coinsReward || 50);
      if (coinsAwarded === null) return; // Cancelled
      coinsAwarded = Number(coinsAwarded) || 50;
    }

    try {
      await API.put(`/activities/${activityId}/status`, { status, coinsAwarded });
      showToast(`Activity ${status} successfully!`);
      fetchPendingActivities();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 transition-all ${
          toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary-container text-on-primary-container'
        }`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">Activity Verification</h2>
        <button onClick={fetchPendingActivities} className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl opacity-20 block mb-3">verified</span>
          <p className="font-bold">No pending activities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activities.map((activity) => (
            <div key={activity._id} className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5 shadow-lg flex flex-col">
              {activity.proofMedia && activity.proofMedia.length > 0 && (
                <div className="h-48 relative overflow-hidden bg-black/50">
                  <img 
                    src={activity.proofMedia[0]} 
                    alt="Proof" 
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-500 cursor-pointer"
                    onClick={() => window.open(activity.proofMedia[0], '_blank')}
                  />
                  {activity.proofMedia.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">photo_library</span>
                      +{activity.proofMedia.length - 1}
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={activity.userId?.profilePhoto || `https://ui-avatars.com/api/?name=${activity.userId?.name}&background=random`} 
                      alt={activity.userId?.name} 
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="font-black text-sm text-on-surface">{activity.userId?.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{activity.activityType}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-md border border-yellow-500/20">
                    PENDING
                  </span>
                </div>

                {activity.eventId && (
                  <div className="mb-3 px-3 py-2 bg-surface-container-high rounded-lg text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">event</span>
                    <span className="font-bold text-on-surface-variant truncate">{activity.eventId.title}</span>
                  </div>
                )}

                <p className="text-sm text-on-surface-variant mb-6 flex-1 italic">"{activity.description}"</p>

                <div className="flex items-center gap-3 mt-auto">
                  <button 
                    onClick={() => handleAction(activity._id, 'rejected')}
                    className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(activity._id, 'approved', activity.eventId?._id)}
                    className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container font-black text-sm hover:shadow-[0_0_15px_rgba(0,255,135,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NGOActivityVerification;
