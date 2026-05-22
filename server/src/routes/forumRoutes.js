import express from 'express';
import { protect } from '../middleware/auth.js';
import { replyToPost, upvotePost } from '../controllers/forumController.js';

const router = express.Router();

router.post('/forum/:postId/reply', protect, replyToPost);
router.post('/forum/:postId/upvote', protect, upvotePost);

export default router;
