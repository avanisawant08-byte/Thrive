import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import Loader from '../../components/Loader';

const AdminEventApprovals = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchPendingEvents(); }, []);

  const fetchPendingEvents = async () => {
    try {
      const res = await API.get('/admin/events/pending');
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch pending events:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (eventId, status) => {
    setActionLoading(eventId);
    try {
      await API.put(`/admin/events/${eventId}/verify`, { status });
      setEvents(prev => prev.filter(e => e._id !== eventId));
      showToast(
        status === 'approved' ? 'Event approved successfully!' : 'Event application rejected.',
        status === 'approved' ? 'success' : 'error'
      );
    } catch (err) {
      showToast('Action failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const formatAppliedDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return `${Math.floor(diffMs / 60000)} mins ago`;
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayout>
      {/* Hero */}
      <div className="admin-hero">
        <div className="admin-hero-glow" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span className="admin-hero-label">Verification Portal</span>
            <h1 className="admin-hero-title">
              Event <span className="accent">Approvals</span>
            </h1>
            <p className="admin-hero-desc">
              Review and verify community-level events created by regular users. Maintain safety and community guidelines.
            </p>
          </div>
          {!loading && (
            <div style={{
              background: 'rgba(53,53,52,0.4)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(132,149,133,0.15)', padding: '0.75rem 1.5rem',
              borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-container)', lineHeight: 1 }}>
                {events.length}
              </span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--on-surface-variant)', lineHeight: 1.2 }}>
                Pending<br />Events
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Pending Reviews</div>
          <div className="stat-card-value">{loading ? '—' : events.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Rewards Locked</div>
          <div className="stat-card-value">10 Coins</div>
          <div className="stat-card-badge secondary">Fixed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Verification Mode</div>
          <div className="stat-card-value">Admin</div>
          <div className="stat-card-badge green">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Review Status</div>
          <div className="stat-card-value">Live</div>
        </div>
      </div>

      {/* Events List */}
      <section>
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-title-bar secondary" />
            Community Event Proposals
          </h3>
        </div>

        {loading ? (
          <div className="py-12">
            <Loader loading={loading} message="Scanning Ecosystem Proposals..." />
          </div>
        ) : events.length === 0 ? (
          <div className="admin-empty">
            <span className="material-symbols-outlined">check_circle</span>
            <p>All clean! No pending community events.</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event._id} className="ngo-card">
              <div className="ngo-card-image" style={{ background: 'var(--surface-container-low)' }}>
                {event.eventImage ? (
                  <img src={event.eventImage} alt={event.title} />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '4rem', fontWeight: 900,
                    color: 'rgba(0,255,135,0.1)'
                  }}>
                    {event.title?.charAt(0)}
                  </div>
                )}
                <div className="ngo-card-image-overlay" />
              </div>
              <div className="ngo-card-body">
                <div>
                  <div className="ngo-card-header">
                    <div className="ngo-card-info">
                      <div className="ngo-card-avatar green" style={{ borderRadius: '50%', overflow: 'hidden' }}>
                        {event.createdBy?.profilePhoto ? (
                          <img src={event.createdBy.profilePhoto} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          event.createdBy?.name?.substring(0, 2).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="ngo-card-name">{event.title}</h4>
                        <p className="ngo-card-sub">
                          Proposed by {event.createdBy?.name || 'Unknown User'} ({event.createdBy?.email}) • Created {formatAppliedDate(event.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="ngo-card-status pending">Awaiting Review</span>
                  </div>

                  <p className="ngo-card-desc">{event.description}</p>

                  <div className="ngo-card-meta">
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>schedule</span>
                      {formatDate(event.date)} ({event.duration || 1} hrs)
                    </div>
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>location_on</span>
                      {event.address}
                    </div>
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>category</span>
                      {event.activityType}
                    </div>
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>toll</span>
                      {event.coinsReward || 10} Coins
                    </div>
                  </div>
                </div>

                <div className="ngo-card-actions">
                  <button
                    className="btn-reject"
                    disabled={actionLoading === event._id}
                    onClick={() => handleAction(event._id, 'rejected')}
                  >
                    <Loader loading={actionLoading === event._id} inline message="Processing..." />
                    {actionLoading !== event._id && 'Reject Event'}
                  </button>
                  <button
                    className="btn-approve"
                    disabled={actionLoading === event._id}
                    onClick={() => handleAction(event._id, 'approved')}
                  >
                    <Loader loading={actionLoading === event._id} inline message="Approving..." />
                    {actionLoading !== event._id && 'Approve & Publish'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </AdminLayout>
  );
};

export default AdminEventApprovals;
