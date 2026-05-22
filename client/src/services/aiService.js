import api from '../utils/api';

export const getAIRecommendations = () => api.get('/ai/recommendations');

export const getAIRoadmap = (goal) => {
  const params = goal ? { goal } : {};
  return api.get('/ai/roadmap', { params });
};

export const sendChatMessage = (message, context = {}) =>
  api.post('/ai/chat', { message, context });

export const generateAIQuiz = (topic, difficulty, count) =>
  api.post('/ai/generate-quiz', { topic, difficulty, count });

export const getAISkills = () => api.get('/ai/skills');
