import api from '../utils/api';

export const getCourses = (params) => api.get('/courses', { params });
export const getCourseBySlug = (slug) => api.get(`/courses/${slug}`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
export const publishCourse = (id) => api.post(`/courses/${id}/publish`);

export const enrollCourse = (id) => api.post(`/courses/${id}/enroll`);
export const getCourseProgress = (id) => api.get(`/courses/${id}/progress`);
export const completeLesson = (courseId, lessonId) => api.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
export const submitQuiz = (courseId, lessonId, answers) => api.post(`/courses/${courseId}/lessons/${lessonId}/quiz`, { answers });
export const submitChallenge = (courseId, lessonId, passed) => api.post(`/courses/${courseId}/lessons/${lessonId}/challenge`, { passed });

export const getExam = (courseId) => api.get(`/courses/${courseId}/exam`);
export const createExam = (courseId, data) => api.post(`/courses/${courseId}/exam`, data);
export const submitExam = (courseId, answers) => api.post(`/courses/${courseId}/exam/attempt`, { answers });
export const getExamAttempts = (courseId) => api.get(`/courses/${courseId}/exam/attempts`);
export const downloadResource = (courseId, lessonId, resourceIndex) =>
  api.post(`/courses/${courseId}/lessons/${lessonId}/resources/${resourceIndex}/download`);
