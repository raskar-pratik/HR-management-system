import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import companyRoutes from './routes/company.routes';
import attendanceRoutes from './routes/attendance.routes';
import leaveRoutes from './routes/leave.routes';
import departmentRoutes from './routes/department.routes';
import reportsRoutes from './routes/reports.routes';
import uploadRoutes from './routes/upload.routes';
import exportRoutes from './routes/export.routes';
import importRoutes from './routes/import.routes';
import auditRoutes from './routes/audit.routes';
import payrollRoutes from './routes/payroll.routes';

import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean'); // No types available usually
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet()); // Set security HTTP headers

// Data sanitization against NoSQL query injection (and potentially some SQL vector via object injection)
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/payroll', payrollRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;
