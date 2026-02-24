import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
    getAttendanceReport,
    getLeaveSummaryReport,
    getEmployeeDirectory,
    getReportDashboard
} from '../controllers/reportsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Report dashboard - available to all authenticated users
router.get('/dashboard', getReportDashboard);

// Attendance report - HR and admin only
router.get('/attendance', authorize('company_admin', 'hr_manager'), getAttendanceReport);

// Leave summary - HR and admin only
router.get('/leaves', authorize('company_admin', 'hr_manager'), getLeaveSummaryReport);

// Employee directory - HR and admin only
router.get('/employees', authorize('company_admin', 'hr_manager'), getEmployeeDirectory);

export default router;
