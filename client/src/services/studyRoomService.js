import api from '../utils/api';

export const getStudyRooms = () => api.get('/study-rooms');
export const createStudyRoom = (name) => api.post('/study-rooms', { name });
export const deleteStudyRoom = (id) => api.delete(`/study-rooms/${id}`);
export const joinStudyRoom = (id) => api.post(`/study-rooms/${id}/join`);
export const leaveStudyRoom = (id) => api.post(`/study-rooms/${id}/leave`);
export const updateTimer = (id, action) => api.post(`/study-rooms/${id}/timer`, { action });
