import { Router } from 'express';
import { body } from 'express-validator';
import departmentController from '../controllers/departmentController';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.middleware';
import validate from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);

// Validation rules
const createDepartmentValidation = [
    body('name').notEmpty().withMessage('Department name is required')
];

// Routes
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartment);
router.post('/', authorize('company_admin', 'hr_manager'), validate(createDepartmentValidation), departmentController.createDepartment);
router.put('/:id', authorize('company_admin', 'hr_manager'), departmentController.updateDepartment);
router.delete('/:id', authorize('company_admin'), departmentController.deleteDepartment);

export default router;
