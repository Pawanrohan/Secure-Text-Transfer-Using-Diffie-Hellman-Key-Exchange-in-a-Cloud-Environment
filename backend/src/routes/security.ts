import { Router } from 'express';
import { logSecurityEvent, getSecurityEvents } from '../controllers/securityController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/events', requireAuth, logSecurityEvent);
router.get('/events', requireAuth, getSecurityEvents);

export default router;
