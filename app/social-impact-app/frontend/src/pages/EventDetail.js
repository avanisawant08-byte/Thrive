import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, Button, TextField, Chip } from '@mui/material';
import { getEventById, joinEvent, leaveEvent, addComment, getComments } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchEvent();
    fetchComments();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await getEventById(id);
      setEvent(data);
    } catch (err) { toast.error('Event not found'); navigate('/events'); }
  };

  const fetchComments = async () => {
    try {
      const { data } = await getComments(id);
      setComments(data);
    } catch (err) { console.error(err); }
  };

  const handleJoin = async () => {
    try {
      await joinEvent(id);
      toast.success('Joined event!');
      fetchEvent();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to join'); }
  };

  const handleLeave = async () => {
    try {
      await leaveEvent(id);
      toast.success('Left event');
      fetchEvent();
    } catch (err) { toast.error('Failed to leave'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    try {
      await addComment(id, { text: comment });
      setComment('');
      fetchComments();
      toast.success('Comment added!');
    } catch (err) { toast.error('Failed to add comment'); }
  };

  if (!event) return <Typography>Loading...</Typography>;

  const isParticipant = event.participants?.some(p => p._id === user?._id);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button onClick={() => navigate('/events')} sx={{ mb: 2 }}>← Back to Events</Button>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Chip label={event.activityType?.replace('_', ' ')} color="primary" sx={{ mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" mb={1}>{event.title}</Typography>
        <Typography color="text.secondary" mb={2}>{event.description}</Typography>
        <Box sx={{ mb: 3 }}>
          <Typography>📍 {event.address}</Typography>
          <Typography>📅 {new Date(event.date).toLocaleString()}</Typography>
          <Typography>🪙 {event.coinsReward} coins reward</Typography>
          <Typography>👥 {event.participants?.length || 0} participants</Typography>
          <Typography>Status: <Chip label={event.status} size="small" color={event.status === 'upcoming' ? 'success' : 'default'} /></Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          {isParticipant ? (
            <Button variant="outlined" color="error" onClick={handleLeave}>Leave Event</Button>
          ) : (
            <Button variant="contained" onClick={handleJoin}>Join Event</Button>
          )}
        </Box>
        <Typography variant="h6" fontWeight="bold" mb={2}>Comments</Typography>
        <form onSubmit={handleComment}>
          <Box display="flex" gap={1} mb={2}>
            <TextField fullWidth size="small" placeholder="Add a comment..."
              value={comment} onChange={e => setComment(e.target.value)} />
            <Button variant="contained" type="submit">Post</Button>
          </Box>
        </form>
        {comments.map((c, i) => (
          <Box key={i} sx={{ p: 2, mb: 1, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography fontWeight="bold">{c.user?.name}</Typography>
            <Typography variant="body2">{c.text}</Typography>
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default EventDetail;