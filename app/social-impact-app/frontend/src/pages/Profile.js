import React, { useState } from 'react';
import { Container, Paper, Typography, Box, TextField, Button, Avatar } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../utils/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(form);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Avatar sx={{ width: 80, height: 80, fontSize: 32, mb: 1 }}>{user?.name?.[0]}</Avatar>
          <Typography variant="h5" fontWeight="bold">{user?.name}</Typography>
          <Typography color="text.secondary">{user?.email}</Typography>
          <Typography color="primary">🪙 {user?.coinBalance || 0} coins</Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Full Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth multiline rows={3} label="Bio" value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })} sx={{ mb: 2 }} />
          <Button variant="contained" type="submit" fullWidth>Update Profile</Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile;