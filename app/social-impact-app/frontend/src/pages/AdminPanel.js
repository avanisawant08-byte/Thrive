import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Button, Chip, TextField, Grid } from '@mui/material';
import { getPendingActivities, updateActivityStatus, createStoreItem } from '../utils/api';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const [activities, setActivities] = useState([]);
  const [coins, setCoins] = useState({});
  const [storeForm, setStoreForm] = useState({ title: '', description: '', category: 'coupon', coinCost: 100, stock: -1 });

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try { const { data } = await getPendingActivities(); setActivities(data); }
    catch (err) { console.error(err); }
  };

  const handleApprove = async (id) => {
    try {
      await updateActivityStatus(id, { status: 'approved', coinsAwarded: coins[id] || 50 });
      toast.success('Activity approved!');
      fetchPending();
    } catch (err) { toast.error('Failed to approve'); }
  };

  const handleReject = async (id) => {
    try {
      await updateActivityStatus(id, { status: 'rejected', coinsAwarded: 0 });
      toast.success('Activity rejected');
      fetchPending();
    } catch (err) { toast.error('Failed to reject'); }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await createStoreItem(storeForm);
      toast.success('Store item created!');
      setStoreForm({ title: '', description: '', category: 'coupon', coinCost: 100, stock: -1 });
    } catch (err) { toast.error('Failed to create item'); }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>⚙️ Admin Panel</Typography>

      <Typography variant="h6" fontWeight="bold" mb={2}>Pending Activities ({activities.length})</Typography>
      {activities.length === 0 && <Typography color="text.secondary" mb={3}>No pending activities</Typography>}
      {activities.map(act => (
        <Paper key={act._id} sx={{ p: 3, mb: 2, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography fontWeight="bold">{act.userId?.name} — {act.activityType?.replace('_', ' ').toUpperCase()}</Typography>
              <Typography variant="body2" color="text.secondary">{act.description}</Typography>
              <Typography variant="caption">{act.userId?.email}</Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <TextField size="small" type="number" label="Coins" sx={{ width: 80 }}
                value={coins[act._id] || 50}
                onChange={e => setCoins({ ...coins, [act._id]: e.target.value })} />
              <Button variant="contained" color="success" onClick={() => handleApprove(act._id)}>Approve</Button>
              <Button variant="contained" color="error" onClick={() => handleReject(act._id)}>Reject</Button>
            </Box>
          </Box>
        </Paper>
      ))}

      <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>Add Store Item</Typography>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <form onSubmit={handleCreateItem}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Title" value={storeForm.title}
                onChange={e => setStoreForm({ ...storeForm, title: e.target.value })} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Category" value={storeForm.category}
                onChange={e => setStoreForm({ ...storeForm, category: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Description" value={storeForm.description}
                onChange={e => setStoreForm({ ...storeForm, description: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Coin Cost" value={storeForm.coinCost}
                onChange={e => setStoreForm({ ...storeForm, coinCost: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Stock (-1 = unlimited)" value={storeForm.stock}
                onChange={e => setStoreForm({ ...storeForm, stock: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" type="submit" fullWidth>Add Item to Store</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AdminPanel;