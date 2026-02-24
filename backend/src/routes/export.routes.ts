import { Router } from 'express';
import exportController from '../controllers/exportController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/employees', authenticate, exportController.exportEmployees);
router.get('/attendance', authenticate, exportController.exportAttendance);
router.get('/leaves', authenticate, exportController.exportLeaves);

export default router;
