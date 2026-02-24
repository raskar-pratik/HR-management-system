import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

interface FileRequest extends Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Upload single file
export const uploadFile = asyncHandler(async (req: FileRequest, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
        return;
    }

    // Construct public URL (assuming configured static file serving)
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: fileUrl
        }
    });
});

// Upload multiple files (optional, can be added later if needed)
export const uploadMultipleFiles = asyncHandler(async (req: FileRequest, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        res.status(400).json({
            success: false,
            message: 'No files uploaded'
        });
        return;
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    const uploadedFiles = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `${baseUrl}/uploads/${file.filename}`
    }));

    res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles
    });
});
