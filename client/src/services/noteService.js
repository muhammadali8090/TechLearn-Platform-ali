import api from '../utils/api';

export const getNotes = (params) => api.get('/notes', { params });
export const upsertNote = (data) => api.post('/notes', data);
export const deleteNote = (id) => api.delete(`/notes/${id}`);
