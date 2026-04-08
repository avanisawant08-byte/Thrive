import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/v1',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);

export const getEvents = (params) => API.get('/events', { params });
export const getEventById = (id) => API.get(`/events/${id}`);
export const createEvent = (data) => API.post('/events', data);
export const joinEvent = (id) => API.post(`/events/${id}/join`);
export const leaveEvent = (id) => API.delete(`/events/${id}/join`);
export const addComment = (id, data) => API.post(`/events/${id}/comments`, data);
export const getComments = (id) => API.get(`/events/${id}/comments`);

export const submitActivity = (data) => API.post('/activities', data);
export const getMyActivities = () => API.get('/activities/me');
export const getPendingActivities = () => API.get('/activities/pending');
export const updateActivityStatus = (id, data) => API.put(`/activities/${id}/status`, data);

export const getBalance = () => API.get('/rewards/balance');
export const getTransactions = () => API.get('/rewards/transactions');
export const getLeaderboard = (params) => API.get('/rewards/leaderboard', { params });

export const getStoreItems = (params) => API.get('/store', { params });
export const redeemItem = (id) => API.post(`/store/${id}/redeem`);
export const getMyRedemptions = () => API.get('/store/redemptions/me');

export const createStoreItem = (data) => API.post('/store', data);
export const updateStoreItem = (id, data) => API.put(`/store/${id}`, data);
export const deleteStoreItem = (id) => API.delete(`/store/${id}`);
export default API;