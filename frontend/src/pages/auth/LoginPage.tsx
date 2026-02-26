import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, Mail, Lock, Eye, EyeOff, Users } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { FormInput } from '../../components/FormInput';

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const methods = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
    });

    const { handleSubmit, watch, trigger, register, formState: { isValid, dirtyFields, errors } } = methods;
    const emailValue = watch('email');
    const passwordValue = watch('password');

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

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="login-page">
            {/* Left Panel */}
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <Users size={22} />
                    </div>
                    <span className="login-brand-name">PeopleOS</span>
                </div>

                <div className="login-hero">
                    <h1>Manage your team<br />with confidence</h1>
                    <p>
                        The all-in-one HR platform for modern teams.
                        Track attendance, manage leaves, run payroll — all in one place.
                    </p>

                    <div className="login-stats">
                        <div className="login-stat-card">
                            <div className="login-stat-value">2,400+</div>
                            <div className="login-stat-label">Employees managed</div>
                        </div>
                        <div className="login-stat-card">
                            <div className="login-stat-value">99.9%</div>
                            <div className="login-stat-label">Uptime reliability</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="login-right">
                <div className="login-form-container">
                    <h2 className="login-form-title">Welcome back 👋</h2>
                    <p className="login-form-subtitle">Sign in to your PeopleOS account</p>

                    {successMessage && (
                        <div className="success-banner">
                            <CheckCircle size={16} />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            {/* Email */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">
                                    <Mail size={13} />
                                    Email Address
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@company.com"
                                        autoComplete="email"
                                        className={`form-input input-with-icon-left${errors.email ? ' error' : ''}`}
                                        {...register('email')}
                                    />
                                    <span className="input-icon-left">
                                        <Mail size={15} />
                                    </span>
                                </div>
                                {errors.email && (
                                    <span className="form-error">{errors.email.message}</span>
                                )}
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="password">
                                    <Lock size={13} />
                                    Password
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className={`form-input input-with-icon-left${errors.password ? ' error' : ''}`}
                                        style={{ paddingRight: 40 }}
                                        {...register('password')}
                                    />
                                    <span className="input-icon-left">
                                        <Lock size={15} />
                                    </span>
                                    <button
                                        type="button"
                                        className="input-btn-right"
                                        onClick={() => setShowPassword(v => !v)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="form-error">{errors.password.message}</span>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                                disabled={isLoading || isValidating || !isValid}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="spinner" />
                                        Signing in...
                                    </>
                                ) : isValidating ? (
                                    <>
                                        <Loader2 size={18} className="spinner" />
                                        Validating...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>

                            <div className="form-divider">
                                <span>or continue with</span>
                            </div>

                            <button type="button" className="btn-google">
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Sign in with Google
                            </button>
                        </form>
                    </FormProvider>

                    <div className="form-footer-link">
                        Don't have an account? <Link to="/register">Sign up for free</Link>
                    </div>

                    <div className="demo-box">
                        <strong>Demo credentials:</strong><br />
                        Email: admin@demo.com &nbsp;·&nbsp; Password: Admin@123
                    </div>
                </div>
            </div>
        </div>
    );
}
