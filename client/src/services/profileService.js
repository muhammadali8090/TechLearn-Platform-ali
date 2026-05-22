import api from '../utils/api';

export const getPublicProfile = (userId) => api.get(`/profile/${userId}`);
export const updateMyProfile = (data) => api.put('/profile/me', data);
