import api from '../utils/api';

export const getChallenges = () => api.get('/challenges');
export const createChallenge = (data) => api.post('/challenges', data);
export const getChallengeById = (id) => api.get(`/challenges/${id}`);
export const submitChallenge = (id, code) => api.post(`/challenges/${id}/submit`, { code });
