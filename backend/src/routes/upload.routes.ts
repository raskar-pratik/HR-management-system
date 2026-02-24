import { Router } from 'express';
import { upload } from '../config/multer';
import { uploadFile, uploadMultipleFiles } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Upload single file
router.post('/', authenticate, upload.single('file'), uploadFile);

// Upload multiple files 
router.post('/multiple', authenticate, upload.array('files', 5), uploadMultipleFiles);

export default router;
