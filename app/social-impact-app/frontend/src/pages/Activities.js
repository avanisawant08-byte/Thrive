import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Button, TextField, MenuItem, Chip, Grid } from '@mui/material';
import { getMyActivities, submitActivity } from '../utils/api';
import { toast } from 'react-toastify';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ activityType: 'volunteering', description: '' });
  const [files, setFiles] = useState([]);

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    try {
      const { data } = await getMyActivities();
      setActivities(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('activityType', form.activityType);
      formData.append('description', form.description);
      files.forEach(f => formData.append('proofMedia', f));
      await submitActivity(formData);
      toast.success('Activity submitted for review!');
      setShowForm(false);
      fetchActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
  };

  const statusColor = { pending: 'warning', approved: 'success', rejected: 'error' };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">✅ My Activities</Typography>
        <Button variant="contained" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Submit Activity'}
        </Button>
      </Box>

      {showForm && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" mb={2}>Submit New Activity</Typography>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth select label="Activity Type" value={form.activityType}
              onChange={e => setForm({ ...form, activityType: e.target.value })} sx={{ mb: 2 }}>
              {['blood_donation', 'tree_plantation', 'volunteering', 'other'].map(t => (
                <MenuItem key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</MenuItem>
              ))}
            </TextField>
            <TextField fullWidth multiline rows={3} label="Description" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} required />
            <Button variant="outlined" component="label" sx={{ mb: 2 }}>
              Upload Proof (Images)
              <input type="file" hidden multiple accept="image/*"
                onChange={e => setFiles(Array.from(e.target.files))} />
            </Button>
            {files.length > 0 && <Typography variant="body2" mb={2}>{files.length} file(s) selected</Typography>}
            <Button variant="contained" type="submit" fullWidth>Submit Activity</Button>
          </form>
        </Paper>
      )}

      <Grid container spacing={3}>
        {activities.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center">No activities submitted yet</Typography>
          </Grid>
        )}
        {activities.map(act => (
          <Grid item xs={12} md={4} key={act._id}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Chip label={act.status} color={statusColor[act.status]} size="small" sx={{ mb: 1 }} />
              <Typography fontWeight="bold">{act.activityType.replace('_', ' ').toUpperCase()}</Typography>
              <Typography variant="body2" color="text.secondary">{act.description}</Typography>
              {act.coinsAwarded > 0 && <Typography color="green">🪙 +{act.coinsAwarded} coins</Typography>}
              <Typography variant="caption" color="text.secondary">
                {new Date(act.createdAt).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Activities;