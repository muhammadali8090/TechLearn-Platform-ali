import api from '../utils/api';

export const getDashboard = () => api.get('/instructor-panel/dashboard');

export const getCourses = () => api.get('/instructor-panel/courses');

export const getCourseAnalytics = (courseId) =>
  api.get(`/instructor-panel/courses/${courseId}/analytics`);

export const getCourseStudents = (courseId, params = {}) =>
  api.get(`/instructor-panel/courses/${courseId}/students`, { params });

export const issueCertificate = (courseId, userId) =>
  api.post(`/instructor-panel/courses/${courseId}/certificates/issue`, { userId });

export const getCertificates = () => api.get('/instructor-panel/certificates');

export const getQuizzes = () => api.get('/instructor-panel/quizzes');

export const getAllStudents = (params = {}) =>
  api.get('/instructor-panel/students', { params });
