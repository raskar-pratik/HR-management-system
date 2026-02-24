import { Router } from 'express';
import { getAuditLogs, getAuditLogStats } from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Only Admins and HR Managers can view audit logs
router.get('/', authenticate, authorize('super_admin', 'company_admin', 'hr_manager'), getAuditLogs);
router.get('/stats', authenticate, authorize('super_admin', 'company_admin', 'hr_manager'), getAuditLogStats);

export default router;
