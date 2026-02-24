import { Router } from 'express';
import { previewImport, processImport } from '../controllers/importController';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/multer';

const router = Router();

// Preview - Upload file
router.post('/preview', authenticate, upload.single('file'), previewImport);

// Process - Submit validated data
router.post('/process', authenticate, processImport);

export default router;
