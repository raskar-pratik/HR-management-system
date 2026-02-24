import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { LogIn, Loader2, CheckCircle, AlertCircle, Mail, Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { FormInput } from '../../components/FormInput';

// Enhanced validation schema with custom messages
const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const methods = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange', // Real-time validation
        reValidateMode: 'onChange',
    });

    const {
        handleSubmit,
        watch,
        trigger,
        formState: { isValid, dirtyFields },
    } = methods;

    // Watch fields for real-time validation feedback
    const emailValue = watch('email');
    const passwordValue = watch('password');

    // Debounced real-time validation
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (emailValue && dirtyFields.email) {
                setIsValidating(true);
                await trigger('email');
                setIsValidating(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [emailValue, trigger, dirtyFields.email]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (passwordValue && dirtyFields.password) {
                setIsValidating(true);
                await trigger('password');
                setIsValidating(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [passwordValue, trigger, dirtyFields.password]);

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setSuccessMessage('');
        try {
            const response = await api.login(data);
            setAuth(response.data.user, response.data.accessToken, response.data.refreshToken);
            setSuccessMessage('Login successful! Redirecting...');
            toast.success('Welcome back!');
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="logo">👥</div>
                    <h1>HR Management</h1>
                    <p>Sign in to your account</p>
                </div>

                {successMessage && (
                    <div className="success-banner">
                        <CheckCircle size={20} />
                        <span>{successMessage}</span>
                    </div>
                )}

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
                        {/* Email Field */}
                        <FormInput
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="you@company.com"
                            autoComplete="email"
                            icon={<Mail size={16} />}
                            isValidating={isValidating && dirtyFields.email}
                        />

                        {/* Password Field */}
                        <FormInput
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            icon={<Lock size={16} />}
                            isValidating={isValidating && dirtyFields.password}
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading || isValidating || !isValid}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="spinner" size={20} />
                                    <span className="submit-text">Signing in...</span>
                                </>
                            ) : isValidating ? (
                                <>
                                    <Loader2 className="spinner" size={20} />
                                    <span className="submit-text">Validating...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    <span className="submit-text">Sign In</span>
                                </>
                            )}
                        </button>

                        {/* Form Status */}
                        {!isValid && (Object.keys(dirtyFields).length > 0) && (
                            <div className="form-status warning">
                                <AlertCircle size={16} />
                                <span>Please fix the errors above to continue</span>
                            </div>
                        )}
                    </form>
                </FormProvider>

                <div className="login-footer">
                    <p>
                        Don't have an account? <Link to="/register">Sign up</Link>
                    </p>
                </div>

                <div className="demo-credentials">
                    <p><strong>Demo Login:</strong></p>
                    <p>Email: admin@demo.com</p>
                    <p>Password: Admin@123</p>
                </div>
            </div>
        </div>
    );
}
