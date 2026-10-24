import { Router } from 'express';
import {
  sendMessage,
  getMessages,
  getConversations,
  getCloudVault,
  updateMessageStatus,
} from '../controllers/messagesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, sendMessage);
router.get('/', requireAuth, getMessages);
router.get('/conversations', requireAuth, getConversations);
router.get('/vault', requireAuth, getCloudVault);
router.patch('/:id/status', requireAuth, updateMessageStatus);

export default router;
