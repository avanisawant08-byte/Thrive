import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { getShopBannerSrc } from '../../utils/shopImageHelper';

const AdminShopVerification = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', shopName: '' });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    try {
      const res = await API.get('/shopkeeper/admin/all');
      setShops(res.data);
    } catch (err) {
      console.error('Failed to fetch shopkeepers:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (shopId) => {
    if (!window.confirm('Are you sure you want to delete this shopkeeper?')) return;
    setDeletingId(shopId);
    try {
      await API.delete(`/shopkeeper/admin/${shopId}`);
      setShops(prev => prev.filter(s => s._id !== shopId));
      showToast('Shopkeeper deleted successfully');
    } catch (err) {
      showToast('Delete failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.shopName) {
      showToast('Please fill all fields', 'error');
      return;
    }
    setCreating(true);
    try {
      await API.post('/shopkeeper/admin/create', createForm);
      showToast('Shopkeeper created successfully!');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', shopName: '' });
      fetchShops();
    } catch (err) {
      showToast('Create failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setCreating(false);
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = { cafe: 'coffee', hotel: 'hotel', restaurant: 'restaurant', retail: 'shopping_bag' };
    return icons[cat] || 'storefront';
  };

  const getCategoryLabel = (cat) => {
    const labels = { cafe: 'Café & Coffee', hotel: 'Hotel & Stay', restaurant: 'Restaurant & Dining', retail: 'Retail Store' };
    return labels[cat] || 'Other Business';
  };

  return (
    <AdminLayout>
      {/* Hero */}
      <div className="admin-hero">
        <div className="admin-hero-glow" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span className="admin-hero-label">Marketplace Integrity</span>
            <h1 className="admin-hero-title" style={{ textShadow: '0 0 12px rgba(0,255,135,0.4)' }}>
              Shop <span className="accent">Verification</span>
            </h1>
            <p className="admin-hero-desc">
              Manage sustainable partners for the Thrive Rewards program. Create, verify, and manage shopkeeper accounts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              background: 'rgba(53,53,52,0.4)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(132,149,133,0.15)', padding: '0.75rem 1.5rem',
              borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-container)', lineHeight: 1 }}>
                {shops.length}
              </span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--on-surface-variant)', lineHeight: 1.2 }}>
                Active<br />Shops
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-container)' }}>
          <div className="stat-card-label">Total Shops</div>
          <div className="stat-card-value">{loading ? '—' : shops.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Categories</div>
          <div className="stat-card-value">{loading ? '—' : new Set(shops.map(s => s.shopDetails?.category).filter(Boolean)).size}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">With Address</div>
          <div className="stat-card-value">{loading ? '—' : shops.filter(s => s.shopDetails?.address).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Registered Today</div>
          <div className="stat-card-value">{loading ? '—' : shops.filter(s => {
            const d = new Date(s.createdAt);
            const now = new Date();
            return d.toDateString() === now.toDateString();
          }).length}</div>
        </div>
      </div>

      {/* Create Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button className="btn-approve" style={{ flex: 'none' }} onClick={() => setShowCreateModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>add</span>
          Create Shopkeeper
        </button>
      </div>

      {/* Shop Grid */}
      {loading ? (
        <div className="admin-loader"><div className="spinner" /></div>
      ) : shops.length === 0 ? (
        <div className="admin-empty">
          <span className="material-symbols-outlined">store</span>
          <p>No shopkeepers registered yet.</p>
        </div>
      ) : (
        <div className="shop-grid">
          {shops.map((shop) => (
            <div key={shop._id} className="shop-card">
              <div className="shop-card-image" style={{
                height: '140px', position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <img 
                  src={getShopBannerSrc(shop)} 
                  alt={shop.shopDetails?.shopName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getShopBannerSrc(shop, true);
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,14,14,0.9), transparent)' }} />
                <div className="shop-card-badge">{getCategoryLabel(shop.shopDetails?.category)}</div>
              </div>
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
                    <>
                      <div className="shop-card-divider" />
                      <div className="shop-card-detail-row">
                        <span className="label">Address</span>
                        <span className="value">{shop.shopDetails.address}</span>
                      </div>
                    </>
                  )}
                  {shop.shopDetails?.phone && (
                    <div className="shop-card-detail-row">
                      <span className="label">Phone</span>
                      <span className="value">{shop.shopDetails.phone}</span>
                    </div>
                  )}
                  <div className="shop-card-detail-row">
                    <span className="label">Joined</span>
                    <span className="value">
                      {new Date(shop.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="shop-card-actions">
                  <button
                    className="btn-reject"
                    disabled={deletingId === shop._id}
                    onClick={() => handleDelete(shop._id)}
                  >
                    {deletingId === shop._id ? 'Deleting...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--surface-container)', borderRadius: '2rem',
            padding: '2.5rem', width: '100%', maxWidth: '480px',
            border: '1px solid rgba(59,75,61,0.2)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Create Shopkeeper</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginBottom: '2rem' }}>
              Add a new verified shop partner to the Thrive ecosystem.
            </p>
            <form onSubmit={handleCreate}>
              {[
                { key: 'name', label: 'Owner Name', type: 'text', placeholder: 'John Doe' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'shop@example.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
                { key: 'shopName', label: 'Shop Name', type: 'text', placeholder: 'Green Valley Café' },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    display: 'block', fontSize: '10px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    color: 'var(--on-surface-variant)', marginBottom: '0.5rem'
                  }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={createForm[field.key]}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{
                      width: '100%', background: 'var(--surface-container-low)',
                      border: '1px solid rgba(59,75,61,0.2)', borderRadius: '0.75rem',
                      padding: '0.75rem 1rem', color: 'var(--on-surface)',
                      fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-approve" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </AdminLayout>
  );
};

export default AdminShopVerification;
