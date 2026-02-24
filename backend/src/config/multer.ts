import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create subdirectories based on type if needed (e.g., uploads/avatars, uploads/documents)
        // For now, storing all in root 'uploads' folder or organize by date/type
        let dest = uploadDir;

        // You can add logic here to organize files into subfolders
        // const type = req.body.type || 'misc';
        // dest = path.join(uploadDir, type);
        // if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

        cb(null, dest);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: fieldname-timestamp-random.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allowed file types
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, PDF, and DOC/DOCX are allowed.'));
    }
};

// Multer upload instance
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});
