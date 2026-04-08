import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getStoreItems, redeemItem, getBalance } from '../utils/api';
import { toast } from 'react-toastify';

const Store = () => {
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(0);
  const [coupon, setCoupon] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchBalance();
  }, []);

  const fetchItems = async () => {
    try { const { data } = await getStoreItems(); setItems(data); }
    catch (err) { console.error(err); }
  };

  const fetchBalance = async () => {
    try { const { data } = await getBalance(); setBalance(data.coinBalance); }
    catch (err) { console.error(err); }
  };

  const handleRedeem = async (id) => {
    try {
      const { data } = await redeemItem(id);
      setCoupon(data.couponCode);
      setBalance(data.remainingCoins);
      setOpen(true);
      toast.success('Item redeemed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">🛍️ Store</Typography>
        <Paper sx={{ px: 3, py: 1, borderRadius: 3, bgcolor: '#fff9c4' }}>
          <Typography fontWeight="bold">🪙 {balance} coins</Typography>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {items.map(item => (
          <Grid item xs={12} md={4} key={item._id}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Chip label={item.category} size="small" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">{item.title}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>{item.description}</Typography>
              <Typography fontWeight="bold" color="primary" mb={2}>🪙 {item.coinCost} coins</Typography>
              {item.stock !== -1 && <Typography variant="body2" mb={1}>Stock: {item.stock}</Typography>}
              <Button variant="contained" fullWidth
                disabled={balance < item.coinCost}
                onClick={() => handleRedeem(item._id)}>
                {balance < item.coinCost ? 'Not enough coins' : 'Redeem'}
              </Button>
            </Paper>
          </Grid>
        ))}
        {items.length === 0 && (
          <Grid item xs={12}>
            <Typography textAlign="center" color="text.secondary">No items in store yet</Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>🎉 Redemption Successful!</DialogTitle>
        <DialogContent>
          <Typography>Your coupon code:</Typography>
          <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center" sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            {coupon}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Store;