import { Router } from 'express';
import companyController from '../controllers/companyController';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);

// Routes
router.get('/', companyController.getCompany);
router.put('/', authorize('company_admin'), companyController.updateCompany);
router.get('/stats', authorize('company_admin', 'hr_manager'), companyController.getCompanyStats);

export default router;
