import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: '🏠 Dashboard', path: '/dashboard' },
    { label: '📅 Events', path: '/events' },
    { label: '✅ Activities', path: '/activities' },
    { label: '🏆 Leaderboard', path: '/leaderboard' },
    { label: '🛍️ Store', path: '/store' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#2e7d32' }}>
      <Toolbar>
        <Typography variant="h6" fontWeight="bold" sx={{ mr: 3, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}>
          🌱 Social Impact
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
          {navItems.map(item => (
            <Button key={item.path} color="inherit"
              sx={{ fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                borderBottom: location.pathname === item.path ? '2px solid white' : 'none' }}
              onClick={() => navigate(item.path)}>
              {item.label}
            </Button>
          ))}
          {user?.role === 'admin' && (
            <Button color="inherit" onClick={() => navigate('/admin')}>⚙️ Admin</Button>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32, cursor: 'pointer', bgcolor: '#1b5e20' }}
            onClick={() => navigate('/profile')}>
            {user?.name?.[0]}
          </Avatar>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;