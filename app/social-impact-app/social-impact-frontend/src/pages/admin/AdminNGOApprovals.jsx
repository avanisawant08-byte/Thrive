import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import Loader from '../../components/Loader';
import { getNGOBannerSrc } from '../../utils/ngoImageHelper';

const AdminNGOApprovals = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchPendingNGOs(); }, []);

  const fetchPendingNGOs = async () => {
    try {
      const res = await API.get('/admin/ngos/pending');
      setNgos(res.data);
    } catch (err) {
      console.error('Failed to fetch NGOs:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (ngoId, status) => {
    setActionLoading(ngoId);
    try {
      await API.put(`/admin/ngos/${ngoId}/verify`, { status });
      setNgos(prev => prev.filter(n => n._id !== ngoId));
      showToast(
        status === 'approved' ? 'NGO approved successfully!' : 'NGO application rejected.',
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
              NGO <span className="accent">Approvals</span>
            </h1>
            <p className="admin-hero-desc">
              Review and verify organizations joining the Thrive Ecosystem. Ensure all documentation meets our ethical transparency standards.
            </p>
          </div>
          {!loading && (
            <div style={{
              background: 'rgba(53,53,52,0.4)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(132,149,133,0.15)', padding: '0.75rem 1.5rem',
              borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-container)', lineHeight: 1 }}>
                {ngos.length}
              </span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--on-surface-variant)', lineHeight: 1.2 }}>
                Pending<br />Reviews
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Pending Review</div>
          <div className="stat-card-value">{loading ? '—' : ngos.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Avg. Review Time</div>
          <div className="stat-card-value">—</div>
          <div className="stat-card-badge secondary">Tracking</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Success Rate</div>
          <div className="stat-card-value">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Partners</div>
          <div className="stat-card-value">—</div>
          <div className="stat-card-badge green">Verified</div>
        </div>
      </div>

      {/* Applications List */}
      <section>
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-title-bar secondary" />
            New Applications
          </h3>
        </div>

        {loading ? (
          <div className="py-12">
            <Loader loading={loading} message="Reviewing Applications..." />
          </div>
        ) : ngos.length === 0 ? (
          <div className="admin-empty">
            <span className="material-symbols-outlined">check_circle</span>
            <p>All caught up! No pending NGO applications.</p>
          </div>
        ) : (
          ngos.map((ngo) => (
            <div key={ngo._id} className="ngo-card">
              <div className="ngo-card-image" style={{ background: 'var(--surface-container-low)', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={getNGOBannerSrc(ngo)} 
                  alt={ngo.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getNGOBannerSrc(ngo, true);
                  }}
                />
                <div className="ngo-card-image-overlay" />
              </div>
              <div className="ngo-card-body">
                <div>
                  <div className="ngo-card-header">
                    <div className="ngo-card-info">
                      <div className="ngo-card-avatar green">
                        {ngo.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="ngo-card-name">{ngo.name}</h4>
                        <p className="ngo-card-sub">
                          Applied {formatDate(ngo.createdAt)} • Contact: {ngo.contactPerson}
                        </p>
                      </div>
                    </div>
                    <span className="ngo-card-status pending">Awaiting Review</span>
                  </div>

                  <p className="ngo-card-desc">{ngo.description}</p>

                  <div className="ngo-card-meta">
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>badge</span>
                      {ngo.registrationNumber}
                    </div>
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>mail</span>
                      {ngo.email}
                    </div>
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>call</span>
                      {ngo.phone}
                    </div>
                    {ngo.userId?.name && (
                      <div className="ngo-card-meta-item">
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>person</span>
                        {ngo.userId.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ngo-card-actions">
                  <button
                    className="btn-reject"
                    disabled={actionLoading === ngo._id}
                    onClick={() => handleAction(ngo._id, 'rejected')}
                  >
                    <Loader loading={actionLoading === ngo._id} inline message="Processing..." />
                    {actionLoading !== ngo._id && 'Reject Application'}
                  </button>
                  <button
                    className="btn-approve"
                    disabled={actionLoading === ngo._id}
                    onClick={() => handleAction(ngo._id, 'approved')}
                  >
                    <Loader loading={actionLoading === ngo._id} inline message="Approving..." />
                    {actionLoading !== ngo._id && 'Approve NGO'}
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

export default AdminNGOApprovals;
