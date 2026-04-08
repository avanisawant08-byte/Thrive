import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, Chip, TextField, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getEvents, createEvent } from '../utils/api';
import { toast } from 'react-toastify';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', activityType: 'volunteering',
    address: '', date: '', coinsReward: 50,
    location: { type: 'Point', coordinates: [73.8567, 18.5204] }
  });
  const navigate = useNavigate();

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await getEvents();
      setEvents(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEvent(form);
      toast.success('Event created!');
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  const activityColors = {
    blood_donation: 'error', tree_plantation: 'success',
    volunteering: 'primary', other: 'default'
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">📅 Events</Typography>
        <Button variant="contained" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Event'}
        </Button>
      </Box>

      {showForm && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" mb={2}>Create New Event</Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Title" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select label="Activity Type" value={form.activityType}
                  onChange={e => setForm({ ...form, activityType: e.target.value })}>
                  {['blood_donation', 'tree_plantation', 'volunteering', 'other'].map(t => (
                    <MenuItem key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" multiline rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Address" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })} required />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Date & Time" type="datetime-local"
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Coins Reward" type="number" value={form.coinsReward}
                  onChange={e => setForm({ ...form, coinsReward: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" type="submit" fullWidth>Create Event</Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      <Grid container spacing={3}>
        {events.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center">No events found</Typography>
          </Grid>
        )}
        {events.map(event => (
          <Grid item xs={12} md={4} key={event._id}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Chip label={event.activityType.replace('_', ' ')} color={activityColors[event.activityType]} size="small" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">{event.title}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>{event.description.substring(0, 100)}...</Typography>
              <Typography variant="body2">📍 {event.address}</Typography>
              <Typography variant="body2">📅 {new Date(event.date).toLocaleDateString()}</Typography>
              <Typography variant="body2">🪙 {event.coinsReward} coins</Typography>
              <Typography variant="body2">👥 {event.participants?.length || 0} participants</Typography>
              <Button variant="outlined" fullWidth sx={{ mt: 2 }}
                onClick={() => navigate(`/events/${event._id}`)}>View Details</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Events;