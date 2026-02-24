import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
    getSalaryComponents,
    createSalaryComponent,
    getSalaryStructure,
    createSalaryStructure,
    processPayroll,
    getPayrollRuns,
    getPayslips
} from '../controllers/payrollController';

const router = express.Router();

router.use(authenticate);

// Salary Components
router.get('/salary-components', authorize('super_admin', 'company_admin', 'hr_manager'), getSalaryComponents);
router.post('/salary-components', authorize('super_admin', 'company_admin'), createSalaryComponent);

// Salary Structures
router.get('/salary-structures/:employeeId', authorize('super_admin', 'company_admin', 'hr_manager'), getSalaryStructure);
router.post('/salary-structures', authorize('super_admin', 'company_admin'), createSalaryStructure);

// Payroll Processing
router.post('/process', authorize('super_admin', 'company_admin'), processPayroll);
router.get('/runs', authorize('super_admin', 'company_admin', 'hr_manager'), getPayrollRuns);

// Payslips
router.get('/payslips', authorize('super_admin', 'company_admin', 'hr_manager', 'employee'), getPayslips);

export default router;
