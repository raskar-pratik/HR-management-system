import { Router } from 'express';
import { body } from 'express-validator';
import employeeController from '../controllers/employeeController';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.middleware';
import validate from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);

// Validation rules
const createEmployeeValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('joinDate').isISO8601().withMessage('Valid join date is required')
];

const updateEmployeeValidation = [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty')
];

import { cache } from '../middleware/cache.middleware';

// Routes
router.get('/', cache(300), employeeController.getAllEmployees);
router.get('/stats', authorize('company_admin', 'hr_manager'), employeeController.getEmployeeStats);
router.get('/:id', employeeController.getEmployee);
router.post('/', authorize('company_admin', 'hr_manager'), validate(createEmployeeValidation), employeeController.createEmployee);
router.put('/:id', authorize('company_admin', 'hr_manager'), validate(updateEmployeeValidation), employeeController.updateEmployee);
router.delete('/:id', authorize('company_admin'), employeeController.deleteEmployee);

export default router;
