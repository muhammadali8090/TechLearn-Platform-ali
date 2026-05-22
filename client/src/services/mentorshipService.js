import api from '../utils/api';

export const getMentors = () => api.get('/mentorship/mentors');
export const requestMentor = (data) => api.post('/mentorship/request', data);
export const getMyMentorships = () => api.get('/mentorship/my');
export const sendMessage = (id, content) => api.post(`/mentorship/${id}/message`, { content });
export const updateStatus = (id, status) => api.put(`/mentorship/${id}/status`, { status });
