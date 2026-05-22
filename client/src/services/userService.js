import api from '../utils/api';

export const getDashboard = () => api.get('/users/me/dashboard');
export const getLearningStats = () => api.get('/users/me/learning-stats');
export const getCertificate = (certificateId) => api.get(`/users/me/certificates/${certificateId}`);
export const getInstructors = () => api.get('/instructors');
export const getInstructor = (id) => api.get(`/instructors/${id}`);
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminCourses = () => api.get('/admin/courses');

// Bookmarks
export const getBookmarks = () => api.get('/users/bookmarks');
export const addBookmark = (courseId, lessonId, note = '') => api.post('/users/bookmarks', { courseId, lessonId, note });
export const removeBookmark = (bookmarkId) => api.delete(`/users/bookmarks/${bookmarkId}`);
