import api from '../utils/api';

export const createSubmission = (data) => api.post('/submissions', data);
export const getSubmissions = (params) => api.get('/submissions', { params });
export const addReview = (id, data) => api.post(`/submissions/${id}/review`, data);
