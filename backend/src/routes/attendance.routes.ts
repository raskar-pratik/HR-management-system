import { Router } from 'express';
import attendanceController from '../controllers/attendanceController';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);

// Routes
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/today', attendanceController.getTodayStatus);
router.get('/report', attendanceController.getAttendanceReport);
router.get('/monthly-summary', attendanceController.getMonthlySummary);

export default router;
