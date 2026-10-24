import { Router } from 'express';
import {
  registerKeys,
  getUserKeyBundle,
  listDirectory,
  rotateKeys,
} from '../controllers/keysController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', requireAuth, registerKeys);
router.post('/rotate', requireAuth, rotateKeys);
router.get('/directory', requireAuth, listDirectory);
router.get('/:userId', requireAuth, getUserKeyBundle);

export default router;
