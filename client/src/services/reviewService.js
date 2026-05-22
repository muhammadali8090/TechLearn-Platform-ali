import api from '../utils/api';

export const getCourseReviews = (courseId) => api.get(`/courses/${courseId}/reviews`);
export const createReview = (courseId, data) => api.post(`/courses/${courseId}/reviews`, data);
export const deleteReview = (courseId, reviewId) => api.delete(`/courses/${courseId}/reviews/${reviewId}`);
