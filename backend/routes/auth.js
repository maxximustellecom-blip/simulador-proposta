import { Router } from 'express';
import { register, login, listUsers } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', listUsers);

export default router;
