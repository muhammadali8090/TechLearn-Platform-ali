import api from '../utils/api';

export const getForumPosts = (courseId) => api.get(`/courses/${courseId}/forum`);
export const createForumPost = (courseId, content) => api.post(`/courses/${courseId}/forum`, { content });
export const replyToPost = (postId, content) => api.post(`/forum/${postId}/reply`, { content });
export const upvotePost = (postId) => api.post(`/forum/${postId}/upvote`);
