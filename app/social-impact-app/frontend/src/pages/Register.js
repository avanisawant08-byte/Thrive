import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Paper } from '@mui/material';
import { toast } from 'react-toastify';
import { registerUser } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerUser(form);
      login({ name: form.name, email: form.email }, data.token);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" fontWeight="bold" textAlign="center" color="primary" mb={3}>
            🌱 Social Impact
          </Typography>
          <Typography variant="h6" textAlign="center" mb={3}>Create your account</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Full Name" name="name"
              value={form.name} onChange={handleChange}
              margin="normal" required
            />
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={form.email} onChange={handleChange}
              margin="normal" required
            />
            <TextField
              fullWidth label="Password" name="password" type="password"
              value={form.password} onChange={handleChange}
              margin="normal" required
            />
            <Button
              fullWidth variant="contained" type="submit"
              disabled={loading} sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
          <Typography textAlign="center" mt={2}>
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;