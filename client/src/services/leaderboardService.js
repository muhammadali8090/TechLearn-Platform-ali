import api from '../utils/api';

export const getLeaderboard = (params) => api.get('/leaderboard', { params });
