import express from 'express';
import { protect } from '../middleware/auth.js';
import { getNotes, upsertNote, deleteNote } from '../controllers/noteController.js';

const router = express.Router();

router.get('/', protect, getNotes);
router.post('/', protect, upsertNote);
router.put('/', protect, upsertNote);
router.delete('/:id', protect, deleteNote);

export default router;
