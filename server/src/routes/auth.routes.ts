import { Router } from 'express';
import { register, login, firebaseLogin, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/firebase', firebaseLogin);
router.get('/me', authMiddleware, getMe);

export default router;
