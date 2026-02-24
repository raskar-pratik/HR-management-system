import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt';
import { User } from '../models';
import '../types'; // Import type declarations

// Interface for JWT payload
interface JwtPayload {
    userId: string;
    companyId: string;
    role: string;
    email: string;
}

// Middleware to authenticate JWT token
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;

        // Find user
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
            return;
        }

        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
            return;
        }

        // Attach user data to request
        req.user = {
            id: user.id,
            companyId: user.companyId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as 'super_admin' | 'company_admin' | 'hr_manager' | 'manager' | 'employee',
            isActive: user.isActive
        };
        req.companyId = user.companyId;

        next();
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.'
                });
                return;
            }

            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token.'
                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.'
        });
    }
};

// Middleware to check user roles
export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
            return;
        }

        next();
    };
};

// Middleware to ensure user can only access their company's data (tenant isolation)
export const tenantIsolation = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
        return;
    }

    // Super admins can access all companies
    if (req.user.role === 'super_admin') {
        next();
        return;
    }

    // For other users, set companyId filter
    req.companyId = req.user.companyId;
    next();
};

export default {
    authenticate,
    authorize,
    tenantIsolation
};
