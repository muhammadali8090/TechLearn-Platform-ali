import express from 'express';
import { protect } from '../middleware/auth.js';
import { getLibrary, saveResource, unsaveResource } from '../controllers/libraryController.js';

const router = express.Router();

router.get('/', protect, getLibrary);
router.post('/', protect, saveResource);
router.delete('/', protect, unsaveResource);

export default router;
