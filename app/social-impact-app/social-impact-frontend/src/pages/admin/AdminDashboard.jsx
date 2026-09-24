import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import AdminLayout from './AdminLayout';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0, pendingNGOs: 0, pendingActivities: 0, pendingEvents: 0,
    totalShopkeepers: 0, coinsDistributed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentNGOs, setRecentNGOs] = useState([]);
  const [recentShops, setRecentShops] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [economy, setEconomy] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ngosRes, shopsRes, activitiesRes, econRes, eventsRes] = await Promise.allSettled([
        API.get('/admin/ngos/pending'),
        API.get('/shopkeeper/admin/all'),
        API.get('/activities/pending'),
        API.get('/admin/economy'),
        API.get('/admin/events/pending'),
      ]);

      const pendingNGOs = ngosRes.status === 'fulfilled' ? ngosRes.value.data : [];
      const shopkeepers = shopsRes.status === 'fulfilled' ? shopsRes.value.data : [];
      const pendingActivities = activitiesRes.status === 'fulfilled' ? activitiesRes.value.data : [];
      const pendingEventsList = eventsRes.status === 'fulfilled' ? eventsRes.value.data : [];
      
      if (econRes.status === 'fulfilled') {
        setEconomy(econRes.value.data);
      }

      setRecentNGOs(pendingNGOs.slice(0, 2));
      setRecentShops(shopkeepers.slice(0, 2));
      setRecentActivities(pendingActivities.slice(0, 3));

      setStats({
        totalUsers: shopkeepers.length + pendingNGOs.length,
        pendingNGOs: pendingNGOs.length,
        pendingActivities: pendingActivities.length,
        pendingEvents: pendingEventsList.length,
        totalShopkeepers: shopkeepers.length,
        coinsDistributed: pendingActivities.reduce((sum, a) => sum + (a.coinsAwarded || 0), 0),
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Hero */}
      <div className="admin-hero">
        <div className="admin-hero-glow" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="admin-hero-label">Admin Control Center</span>
          <h1 className="admin-hero-title">
            Thrive <span className="accent">Console</span>
          </h1>
          <p className="admin-hero-desc">
            Monitor platform health, approve NGOs, verify shops, and manage activity submissions from one unified command center.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div 
          onClick={() => navigate('/admin/ngo-approvals')}
          className="stat-card" 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{
              color: 'var(--primary-container)', background: 'rgba(0,255,135,0.1)',
              padding: '0.5rem', borderRadius: '0.75rem'
            }}>verified_user</span>
          </div>
          <div className="stat-card-value">{loading ? '—' : stats.pendingNGOs}</div>
          <div className="stat-card-label">Pending NGOs</div>
        </div>

        <div 
          onClick={() => navigate('/admin/activities')}
          className="stat-card" 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{
              color: 'var(--secondary-container)', background: 'rgba(1,112,56,0.1)',
              padding: '0.5rem', borderRadius: '0.75rem'
            }}>pending_actions</span>
          </div>
          <div className="stat-card-value">{loading ? '—' : stats.pendingActivities}</div>
          <div className="stat-card-label">Pending Activities</div>
        </div>

        <div 
          onClick={() => navigate('/admin/event-approvals')}
          className="stat-card" 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{
              color: 'var(--tertiary-container)', background: 'rgba(168,239,255,0.1)',
              padding: '0.5rem', borderRadius: '0.75rem'
            }}>event_available</span>
          </div>
          <div className="stat-card-value">{loading ? '—' : stats.pendingEvents}</div>
          <div className="stat-card-label">Pending Events</div>
        </div>

        <div 
          onClick={() => navigate('/admin/shop-verification')}
          className="stat-card" 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{
              color: 'var(--tertiary-fixed-dim)', background: 'rgba(229,195,100,0.1)',
              padding: '0.5rem', borderRadius: '0.75rem'
            }}>storefront</span>
          </div>
          <div className="stat-card-value">{loading ? '—' : stats.totalShopkeepers}</div>
          <div className="stat-card-label">Active Shopkeepers</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{
              color: 'var(--primary-container)', background: 'rgba(0,255,135,0.1)',
              padding: '0.5rem', borderRadius: '0.75rem',
              fontVariationSettings: "'FILL' 1"
            }}>monetization_on</span>
          </div>
          <div className="stat-card-value">{loading ? '—' : stats.coinsDistributed.toLocaleString()}</div>
          <div className="stat-card-label">Coins in Queue</div>
        </div>
      </div>

      {/* Coin Economy Overview */}
      {economy && (
        <section style={{ marginBottom: '3rem' }}>
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-bar primary" style={{ background: 'var(--primary)' }} />
              Coin Economy Overview
            </h2>
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card" style={{ background: 'rgba(0, 255, 135, 0.05)', borderColor: 'rgba(0, 255, 135, 0.2)' }}>
              <div className="stat-card-label" style={{ color: 'var(--primary)' }}>Total Circulating Coins</div>
              <div className="stat-card-value">{economy.totalCirculatingCoins.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Total Users</div>
              <div className="stat-card-value">{economy.totalUsers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Active Users (With Coins)</div>
              <div className="stat-card-value">{economy.activeUsers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Average Wallet</div>
              <div className="stat-card-value">
                {economy.activeUsers > 0 
                  ? Math.round(economy.totalCirculatingCoins / economy.activeUsers).toLocaleString()
                  : 0}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent NGOs */}
      {recentNGOs.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-bar secondary" />
              Recent NGO Applications
            </h2>
            <span style={{
              background: 'rgba(126,218,150,0.1)', color: 'var(--secondary)',
              fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem',
              borderRadius: '999px', border: '1px solid rgba(126,218,150,0.2)'
            }}>{stats.pendingNGOs} Pending</span>
          </div>
          {recentNGOs.map((ngo) => (
            <div key={ngo._id} className="ngo-card" style={{ opacity: 1 }}>
              <div className="ngo-card-image" style={{ background: 'var(--surface-container-low)' }}>
                {ngo.logo ? (
                  <img src={ngo.logo} alt={ngo.name} />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '3rem', fontWeight: 900,
                    color: 'rgba(0,255,135,0.15)'
                  }}>
                    {ngo.name?.charAt(0)}
                  </div>
                )}
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
                        <div className="ngo-card-name">{ngo.name}</div>
                        <div className="ngo-card-sub">
                          Contact: {ngo.contactPerson} • {ngo.email}
                        </div>
                      </div>
                    </div>
                    <span className="ngo-card-status pending">Awaiting Review</span>
                  </div>
                  <p className="ngo-card-desc">{ngo.description}</p>
                  <div className="ngo-card-meta">
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>badge</span>
                      Reg: {ngo.registrationNumber}
                    </div>
                    <div className="ngo-card-meta-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>call</span>
                      {ngo.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Recent Shopkeepers */}
      {recentShops.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-bar green" />
              Registered Shopkeepers
            </h2>
          </div>
          <div className="shop-grid">
            {recentShops.map((shop) => (
              <div key={shop._id} className="shop-card">
                <div className="shop-card-body">
                  <div className="shop-card-name">
                    {shop.shopDetails?.shopName || shop.name}
                  </div>
                  <div className="shop-card-details">
                    <div className="shop-card-detail-row">
                      <span className="label">Owner</span>
                      <span className="value">{shop.name}</span>
                    </div>
                    <div className="shop-card-detail-row">
                      <span className="label">Email</span>
                      <span className="value">{shop.email}</span>
                    </div>
                    <div className="shop-card-detail-row">
                      <span className="label">Category</span>
                      <span className="value" style={{ textTransform: 'capitalize' }}>
                        {shop.shopDetails?.category || 'Other'}
                      </span>
                    </div>
                    {shop.shopDetails?.address && (
                      <div className="shop-card-detail-row">
                        <span className="label">Address</span>
                        <span className="value">{shop.shopDetails.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-bar green" />
              Activity Review Queue
            </h2>
          </div>
          {recentActivities.map((activity) => (
            <div key={activity._id} className="activity-review-card">
              <div className="activity-card-header">
                <div className="activity-card-user">
                  <div className="activity-card-avatar">
                    {activity.userId?.profilePhoto ? (
                      <img src={activity.userId.profilePhoto} alt={activity.userId?.name} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'var(--surface-container)', fontWeight: 700
                      }}>
                        {activity.userId?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="activity-card-name">{activity.userId?.name || 'Unknown User'}</div>
                    <div className="activity-type-badge">
                      {activity.activityType?.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="activity-card-desc">{activity.description}</div>
              {activity.proofMedia?.length > 0 && (
                <div className="activity-card-proof">
                  {activity.proofMedia.slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt={`Proof ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {loading && (
        <div className="admin-loader">
          <div className="spinner" />
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
