import { Router } from 'express';
import { body } from 'express-validator';
import leaveController from '../controllers/leaveController';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.middleware';
import validate from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);

// Validation rules
const applyLeaveValidation = [
    body('leaveType').isIn(['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'other']).withMessage('Valid leave type is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('reason').notEmpty().withMessage('Reason is required')
];

// Routes
router.get('/', leaveController.getAllLeaves);
router.get('/balance', leaveController.getLeaveBalance);
router.get('/:id', leaveController.getLeave);
router.post('/', validate(applyLeaveValidation), leaveController.applyLeave);
router.put('/:id/approve', authorize('company_admin', 'hr_manager'), leaveController.approveLeave);
router.put('/:id/reject', authorize('company_admin', 'hr_manager'), leaveController.rejectLeave);
router.put('/:id/cancel', leaveController.cancelLeave);

export default router;
