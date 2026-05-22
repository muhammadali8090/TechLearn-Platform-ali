import api from '../utils/api';

export const getLibrary = () => api.get('/library');
export const saveResource = (data) => api.post('/library', data);
export const unsaveResource = (data) => api.delete('/library', { data });
