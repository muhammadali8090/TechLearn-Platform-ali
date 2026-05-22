import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getStudyRooms, createStudyRoom, deleteStudyRoom,
  joinStudyRoom, leaveStudyRoom, updateTimer,
} from '../controllers/studyRoomController.js';

const router = express.Router();

router.get('/', protect, getStudyRooms);
router.post('/', protect, createStudyRoom);
router.delete('/:id', protect, deleteStudyRoom);
router.post('/:id/join', protect, joinStudyRoom);
router.post('/:id/leave', protect, leaveStudyRoom);
router.post('/:id/timer', protect, updateTimer);

export default router;
