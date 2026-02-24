import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import jwtConfig from '../config/jwt';
import { Company, User, Employee } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { sendPasswordResetEmail } from '../services/emailService';
import '../types';
import type { JwtPayload } from '../types';

// Token user interface
interface TokenUser {
    id: string;
    companyId: string;
    role: string;
    email: string;
}

// Generate JWT tokens
const generateTokens = (user: TokenUser) => {
    const payload: JwtPayload = {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
        email: user.email
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiry as `${number}${'s' | 'm' | 'h' | 'd'}`
    });

    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
        expiresIn: jwtConfig.refreshExpiry as `${number}${'s' | 'm' | 'h' | 'd'}`
    });

    return { accessToken, refreshToken };
};

// Register a new company with admin user
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { company, admin } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: admin.email } });
    if (existingUser) {
        res.status(400).json({
            success: false,
            message: 'Email already registered'
        });
        return;
    }

    const existingCompany = await Company.findOne({ where: { email: company.email } });
    if (existingCompany) {
        res.status(400).json({
            success: false,
            message: 'Company email already registered'
        });
        return;
    }

    // Create company
    const newCompany = await Company.create({
        name: company.name,
        email: company.email,
        phone: company.phone || null,
        status: 'active',
        subscriptionPlan: 'free'
    });

    // Create admin user
    const newUser = await User.create({
        companyId: newCompany.id,
        email: admin.email,
        password: admin.password,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: 'company_admin',
        isActive: true,
        isEmailVerified: false
    });

    // Create employee record for admin
    const employeeCode = `EMP-${Date.now().toString().slice(-6)}`;
    await Employee.create({
        companyId: newCompany.id,
        userId: newUser.id,
        employeeCode,
        joinDate: new Date(),
        employmentType: 'full_time',
        employmentStatus: 'active'
    });

    // Generate tokens
    const tokens = generateTokens(newUser);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            company: {
                id: newCompany.id,
                name: newCompany.name,
                email: newCompany.email
            },
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role
            },
            ...tokens
        }
    });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
        where: { email },
        include: [{ model: Company, as: 'company' }]
    });

    if (!user) {
        res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
        return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
        return;
    }

    // Check if user is active
    if (!user.isActive) {
        res.status(401).json({
            success: false,
            message: 'Account is deactivated. Please contact administrator.'
        });
        return;
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate tokens
    const tokens = generateTokens(user);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: user.toJSON(),
            ...tokens
        }
    });
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;

    const fullUser = await User.findByPk(user.id, {
        include: [
            { model: Company, as: 'company' },
            { model: Employee, as: 'employee' }
        ]
    });

    res.status(200).json({
        success: true,
        data: fullUser
    });
});

// Refresh access token
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(400).json({
            success: false,
            message: 'Refresh token is required'
        });
        return;
    }

    try {
        const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret) as JwtPayload;
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
            return;
        }

        const tokens = generateTokens(user);

        res.status(200).json({
            success: true,
            data: tokens
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
});

// Logout (client-side token removal)
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Forgot Password
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
        // Return success even if user not found to prevent enumeration
        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });
        return;
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign({ userId: user.id }, jwtConfig.secret, { expiresIn: '1h' });

    // Send email
    try {
        await sendPasswordResetEmail(user, resetToken);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
    }

    res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
    });
});

// Reset Password
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        res.status(400).json({
            success: false,
            message: 'Token and new password are required'
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
            return;
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});

export default {
    register,
    login,
    getProfile,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword
};
