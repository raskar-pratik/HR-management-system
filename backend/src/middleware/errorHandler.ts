import { Request, Response, NextFunction } from 'express';

// Custom error class
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Global error handler middleware
export const errorHandler = (
    err: AppError | Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Default values
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;

    // If it's our custom error
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }

    // Log error (only non-operational errors should be logged with stack trace)
    if (!isOperational) {
        console.error('ERROR 💥:', err);
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        })
    });
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
};

// Async error wrapper - wraps async functions to catch errors
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default {
    AppError,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
