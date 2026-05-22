import express from 'express';
import { getInstructors, getInstructor } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getInstructors);
router.get('/:id', getInstructor);

export default router;
