import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth.middleware';
import validate from '../middleware/validation.middleware';

const router = Router();

// Validation rules
const registerValidation = [
    body('company.name').notEmpty().withMessage('Company name is required'),
    body('company.email').isEmail().withMessage('Valid company email is required'),
    body('admin.firstName').notEmpty().withMessage('First name is required'),
    body('admin.lastName').notEmpty().withMessage('Last name is required'),
    body('admin.email').isEmail().withMessage('Valid email is required'),
    body('admin.password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character')
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Valid email is required')
];

const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character')
];

// Routes
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/forgot-password', validate(forgotPasswordValidation), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

export default router;
