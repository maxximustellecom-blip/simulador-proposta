import { Router } from 'express';
import { listProfiles, getProfile, createProfile, updateProfile, deleteProfile } from '../controllers/accessProfileController.js';

const router = Router();

router.get('/', listProfiles);
router.get('/:id', getProfile);
router.post('/', createProfile);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);

export default router;
