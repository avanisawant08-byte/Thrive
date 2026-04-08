import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents, getBalance, getMyActivities } from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [events, setEvents] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, evRes, actRes] = await Promise.all([
          getBalance(), getEvents(), getMyActivities()
        ]);
        setBalance(balRes.data.coinBalance);
        setEvents(evRes.data.slice(0, 3));
        setActivities(actRes.data.slice(0, 3));
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        👋 Welcome, {user?.name}!
      </Typography>
      <Typography color="text.secondary" mb={4}>Here's your social impact overview</Typography>

      <Grid container spacing={3} mb={4}>
        {[
          { label: '🪙 Coin Balance', value: balance, color: '#fff9c4' },
          { label: '📅 Events Nearby', value: events.length, color: '#e8f5e9' },
          { label: '✅ My Activities', value: activities.length, color: '#e3f2fd' },
        ].map((item, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: item.color }}>
              <Typography variant="h6">{item.label}</Typography>
              <Typography variant="h3" fontWeight="bold">{item.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Recent Events</Typography>
            {events.length === 0 && <Typography color="text.secondary">No events found</Typography>}
            {events.map(event => (
              <Box key={event._id} sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography fontWeight="bold">{event.title}</Typography>
                <Typography variant="body2" color="text.secondary">{event.address}</Typography>
                <Typography variant="body2">🪙 {event.coinsReward} coins</Typography>
              </Box>
            ))}
            <Button variant="outlined" fullWidth onClick={() => navigate('/events')}>View All Events</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>My Recent Activities</Typography>
            {activities.length === 0 && <Typography color="text.secondary">No activities yet</Typography>}
            {activities.map(act => (
              <Box key={act._id} sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography fontWeight="bold">{act.activityType.replace('_', ' ').toUpperCase()}</Typography>
                <Typography variant="body2">{act.description}</Typography>
                <Typography variant="body2" color={act.status === 'approved' ? 'green' : act.status === 'rejected' ? 'red' : 'orange'}>
                  {act.status.toUpperCase()}
                </Typography>
              </Box>
            ))}
            <Button variant="outlined" fullWidth onClick={() => navigate('/activities')}>View All Activities</Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;