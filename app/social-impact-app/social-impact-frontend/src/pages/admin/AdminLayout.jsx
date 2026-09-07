import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminPortal.css';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
  { label: 'NGO Approvals', icon: 'verified_user', path: '/admin/ngo-approvals' },
  { label: 'Event Approvals', icon: 'event_available', path: '/admin/event-approvals' },
  { label: 'Shop Verification', icon: 'storefront', path: '/admin/shop-verification' },
  { label: 'Activity Management', icon: 'pending_actions', path: '/admin/activities' },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== 'admin') {
        navigate('/login');
        return;
      }
      setUser(parsed);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  if (!user) return null;

  return (
    <div className="admin-portal">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-icon">
            <span className="material-symbols-outlined">eco</span>
          </div>
          <div>
            <div className="admin-sidebar-brand-title">Impact Console</div>
            <div className="admin-sidebar-brand-sub" style={{ fontSize: '8px', letterSpacing: '0.05em' }}>Connecting Good Deeds with Great Perks</div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`admin-nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-sidebar-cta"
            onClick={() => navigate('/dashboard')}
          >
            Back to App
          </button>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <button
              className="admin-nav-link"
              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
              onClick={() => { localStorage.clear(); navigate('/login'); }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>logout</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="admin-topbar">
        <div className="admin-topbar-title">Impact Admin</div>
        <div className="admin-topbar-actions">
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--on-surface-variant)', fontSize: '1.125rem'
            }}>search</span>
            <input
              className="admin-search-input"
              placeholder="Search..."
              type="text"
            />
          </div>
          <button className="admin-topbar-btn">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="admin-topbar-btn">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="admin-avatar">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt="Admin" />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || 'A'
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
