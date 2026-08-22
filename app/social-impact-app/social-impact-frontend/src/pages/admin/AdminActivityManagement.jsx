import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';

const AdminActivityManagement = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [coinsMap, setCoinsMap] = useState({});
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    try {
      const res = await API.get('/activities/pending');
      setActivities(res.data);
      const initialCoins = {};
      res.data.forEach(a => { initialCoins[a._id] = a.coinsAwarded || 10; });
      setCoinsMap(initialCoins);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (activityId, status) => {
    setActionLoading(activityId);
    try {
      const body = { status };
      if (status === 'approved') {
        body.coinsAwarded = parseInt(coinsMap[activityId]) || 10;
      }
      await API.put(`/activities/${activityId}/status`, body);
      setActivities(prev => prev.filter(a => a._id !== activityId));
      if (selectedActivity?._id === activityId) setSelectedActivity(null);
      showToast(
        status === 'approved'
          ? `Activity approved! ${body.coinsAwarded} coins awarded.`
          : 'Activity rejected.',
        status === 'approved' ? 'success' : 'error'
      );
    } catch (err) {
      showToast('Action failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hrs ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const getTypeColor = (type) => {
    const colors = {
      blood_donation: '#ff6b6b',
      tree_plantation: '#00ff87',
      volunteering: '#7eda96',
      other: '#e5c364'
    };
    return colors[type] || '#b9cbb9';
  };

  const focused = selectedActivity || activities[0];

  return (
    <AdminLayout>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', right: '-1rem', top: '-1rem',
            width: '6rem', height: '6rem', background: 'rgba(0,255,135,0.1)',
            borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none'
          }} />
          <div className="stat-card-label">Pending Review</div>
          <div className="stat-card-value" style={{ color: 'var(--primary-container)' }}>
            {loading ? '—' : activities.length}
          </div>
          {!loading && activities.length > 0 && (
            <div className="stat-card-badge green" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>trending_up</span>
              Needs attention
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Blood Donations</div>
          <div className="stat-card-value">
            {loading ? '—' : activities.filter(a => a.activityType === 'blood_donation').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Tree Plantations</div>
          <div className="stat-card-value">
            {loading ? '—' : activities.filter(a => a.activityType === 'tree_plantation').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Volunteering</div>
          <div className="stat-card-value" style={{ color: 'var(--secondary)' }}>
            {loading ? '—' : activities.filter(a => a.activityType === 'volunteering').length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-loader"><div className="spinner" /></div>
      ) : activities.length === 0 ? (
        <div className="admin-empty">
          <span className="material-symbols-outlined">task_alt</span>
          <p>All activities have been reviewed. Great work!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Main Review Panel */}
          <div>
            {/* Focused Activity */}
            {focused && (
              <div className="activity-review-card" style={{ borderRadius: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{
                      padding: '0.25rem 0.75rem', background: 'rgba(0,255,135,0.1)',
                      color: 'var(--primary-container)', fontSize: '0.75rem', fontWeight: 700,
                      borderRadius: '999px', letterSpacing: '0.05em', textTransform: 'uppercase',
                      display: 'inline-block', marginBottom: '0.75rem'
                    }}>Priority Review</span>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                      {focused.activityType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </h2>
                    <p style={{ color: 'var(--on-surface-variant)' }}>
                      Submitted by <span style={{ color: 'var(--primary)' }}>{focused.userId?.name || 'Unknown'}</span>
                      {' • '}{formatTime(focused.createdAt)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn-reject"
                      style={{ flex: 'none', padding: '0.75rem' }}
                      disabled={actionLoading === focused._id}
                      onClick={() => handleAction(focused._id, 'rejected')}
                    >
                      <span className="material-symbols-outlined">block</span>
                    </button>
                    <button
                      className="btn-approve"
                      disabled={actionLoading === focused._id}
                      onClick={() => handleAction(focused._id, 'approved')}
                    >
                      {actionLoading === focused._id ? 'Processing...' : 'Approve Activity'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Proof */}
                  <div>
                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '0.75rem' }}>
                      Proof of Impact
                    </p>
                    {focused.proofMedia?.length > 0 ? (
                      <>
                        <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(59,75,61,0.2)', aspectRatio: '16/9', marginBottom: '0.5rem' }}>
                          <img src={focused.proofMedia[0]} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {focused.proofMedia.length > 1 && (
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(focused.proofMedia.length - 1, 3)}, 1fr)`, gap: '0.5rem' }}>
                            {focused.proofMedia.slice(1, 4).map((url, i) => (
                              <div key={i} style={{ aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(59,75,61,0.2)' }}>
                                <img src={url} alt={`Proof ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ padding: '2rem', background: 'var(--surface-container-low)', borderRadius: '1rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                        No proof media attached
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '0.75rem' }}>
                      Submission Details
                    </p>
                    <div style={{
                      background: 'var(--surface-container-lowest)', padding: '1.5rem',
                      borderRadius: '1rem', border: '1px solid rgba(59,75,61,0.1)',
                      marginBottom: '1rem', lineHeight: 1.6
                    }}>
                      <div style={{ marginBottom: (focused.address || focused.location?.coordinates) ? '1rem' : '0' }}>
                        <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>Description</p>
                        <p>{focused.description}</p>
                      </div>

                      {(focused.address || focused.location?.coordinates) && (
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>Location</p>
                          {focused.address && <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{focused.address}</p>}
                          {focused.location?.coordinates && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${focused.location.coordinates[1]},${focused.location.coordinates[0]}`}
                              target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--primary-container)', fontFamily: 'monospace', textDecoration: 'none' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>my_location</span>
                              {focused.location.coordinates[1].toFixed(4)}, {focused.location.coordinates[0].toFixed(4)}
                              <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>open_in_new</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {focused.eventId?.title && (
                      <div style={{
                        background: 'var(--surface-container-highest)', padding: '1rem',
                        borderRadius: '0.75rem', border: '1px solid rgba(59,75,61,0.15)',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>Linked Event</p>
                        <p style={{ fontWeight: 700 }}>{focused.eventId.title}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{
                        flex: 1, background: 'var(--surface-container-highest)',
                        padding: '1rem', borderRadius: '0.75rem',
                        border: '1px solid rgba(59,75,61,0.15)'
                      }}>
                        <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>Coins to Award</p>
                        <input
                          className="coins-input"
                          type="number"
                          min="1"
                          value={coinsMap[focused._id] || 10}
                          onChange={(e) => setCoinsMap(prev => ({ ...prev, [focused._id]: e.target.value }))}
                        />
                      </div>
                      <div style={{
                        flex: 1, background: 'var(--surface-container-highest)',
                        padding: '1rem', borderRadius: '0.75rem',
                        border: '1px solid rgba(59,75,61,0.15)'
                      }}>
                        <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>Type</p>
                        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: getTypeColor(focused.activityType), textTransform: 'capitalize' }}>
                          {focused.activityType?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Queue List */}
            {activities.length > 1 && (
              <div style={{ background: 'var(--surface-container-low)', borderRadius: '1.5rem', overflow: 'hidden' }}>
                <div style={{
                  padding: '1rem 2rem', borderBottom: '1px solid rgba(59,75,61,0.1)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <h3 style={{ fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.15em' }}>
                    Incoming Queue
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-container)' }}>
                    {activities.length - 1} more
                  </span>
                </div>
                {activities.slice(1).map((activity) => (
                  <div
                    key={activity._id}
                    onClick={() => setSelectedActivity(activity)}
                    style={{
                      padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem',
                      cursor: 'pointer', transition: 'background 0.2s',
                      borderBottom: '1px solid rgba(59,75,61,0.05)',
                      background: selectedActivity?._id === activity._id ? 'rgba(53,53,52,0.2)' : 'transparent'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(53,53,52,0.2)'}
                    onMouseLeave={e => {
                      if (selectedActivity?._id !== activity._id) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '0.75rem', overflow: 'hidden', flexShrink: 0,
                      background: 'var(--surface-container-highest)'
                    }}>
                      {activity.proofMedia?.[0] ? (
                        <img src={activity.proofMedia[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '1.25rem' }}>image</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                        {activity.activityType?.replace(/_/g, ' ')}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                        {activity.userId?.name || 'Unknown'} • {formatTime(activity.createdAt)}
                      </p>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)' }}>chevron_right</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - User Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {focused && (
              <div style={{
                background: 'var(--surface-container-low)', borderRadius: '1.5rem',
                padding: '1.5rem', border: '1px solid rgba(59,75,61,0.1)'
              }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>
                  Submitter Profile
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    border: '2px solid rgba(0,255,135,0.2)', padding: '2px', overflow: 'hidden'
                  }}>
                    {focused.userId?.profilePhoto ? (
                      <img src={focused.userId.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: 'var(--surface-container)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '1.25rem'
                      }}>
                        {focused.userId?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>{focused.userId?.name || 'Unknown'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary-container)', fontFamily: 'monospace' }}>
                      {focused.userId?.email || ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Review Checklist */}
            <div style={{
              background: 'rgba(0,255,135,0.1)', borderRadius: '1.5rem',
              padding: '1.5rem', border: '1px solid rgba(0,255,135,0.2)'
            }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--primary-container)', marginBottom: '1rem' }}>
                Review Checklist
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Proof media is clearly visible', 'Description matches activity type', 'Submitted within valid timeframe', 'No duplicate submissions'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '1.125rem',
                      color: i < 3 ? 'var(--primary-container)' : 'var(--on-surface-variant)'
                    }}>
                      {i < 3 ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span style={{ color: i < 3 ? 'var(--on-surface)' : 'var(--on-surface-variant)', fontStyle: i >= 3 ? 'italic' : 'normal' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </AdminLayout>
  );
};

export default AdminActivityManagement;
