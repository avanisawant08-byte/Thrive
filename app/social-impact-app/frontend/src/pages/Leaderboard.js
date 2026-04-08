import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Avatar, MenuItem, TextField } from '@mui/material';
import { getLeaderboard } from '../utils/api';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [period, setPeriod] = useState('alltime');

  useEffect(() => { fetchLeaderboard(); }, [period]);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await getLeaderboard({ period });
      setLeaders(data);
    } catch (err) { console.error(err); }
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>🏆 Leaderboard</Typography>
      <TextField select value={period} onChange={e => setPeriod(e.target.value)} sx={{ mb: 3, width: 200 }}>
        <MenuItem value="weekly">Weekly</MenuItem>
        <MenuItem value="monthly">Monthly</MenuItem>
        <MenuItem value="alltime">All Time</MenuItem>
      </TextField>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {leaders.map((u, i) => (
          <Box key={u._id} sx={{
            display: 'flex', alignItems: 'center', p: 2,
            bgcolor: i === 0 ? '#fff9c4' : i % 2 === 0 ? '#fafafa' : 'white',
            borderBottom: '1px solid #eee'
          }}>
            <Typography variant="h5" sx={{ width: 50 }}>{medals[i] || `#${i + 1}`}</Typography>
            <Avatar src={u.profilePhoto} sx={{ mr: 2 }}>{u.name?.[0]}</Avatar>
            <Box flex={1}>
              <Typography fontWeight="bold">{u.name}</Typography>
            </Box>
            <Typography fontWeight="bold" color="primary">🪙 {u.coinBalance}</Typography>
          </Box>
        ))}
        {leaders.length === 0 && (
          <Typography textAlign="center" p={4} color="text.secondary">No data yet</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Leaderboard;