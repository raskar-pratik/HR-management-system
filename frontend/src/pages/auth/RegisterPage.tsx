import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserPlus, Loader2, Briefcase, User, Mail, Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { FormInput } from '../../components/FormInput';

const registerSchema = z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    companyEmail: z.string().email('Please enter a valid company email'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain uppercase, lowercase, and number'
        ),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [isLoading, setIsLoading] = useState(false);

    const methods = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onBlur', // Validate on blur for registration form to not be too aggressive
    });

    const { handleSubmit } = methods;

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const response = await api.register({
                company: {
                    name: data.companyName,
                    email: data.companyEmail,
                },
                admin: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: data.password,
                },
            });
            setAuth(response.data.user, response.data.accessToken, response.data.refreshToken);
            toast.success('Registration successful! Welcome!');
            navigate('/dashboard');
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Registration failed';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-header">
                    <div className="logo">👥</div>
                    <h1>Create Account</h1>
                    <p>Set up your company's HR system</p>
                </div>

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="register-form">
                        <div className="form-section">
                            <h3>Company Information</h3>

                            <FormInput
                                label="Company Name"
                                name="companyName"
                                placeholder="Acme Corporation"
                                icon={<Briefcase size={16} />}
                            />

                            <FormInput
                                label="Company Email"
                                name="companyEmail"
                                type="email"
                                placeholder="hr@company.com"
                                icon={<Mail size={16} />}
                            />
                        </div>

                        <div className="form-section">
                            <h3>Admin Account</h3>

                            <div className="form-row">
                                <FormInput
                                    label="First Name"
                                    name="firstName"
                                    placeholder="John"
                                    icon={<User size={16} />}
                                />

                                <FormInput
                                    label="Last Name"
                                    name="lastName"
                                    placeholder="Doe"
                                    icon={<User size={16} />}
                                />
                            </div>

                            <FormInput
                                label="Admin Email"
                                name="email"
                                type="email"
                                placeholder="admin@company.com"
                                icon={<Mail size={16} />}
                            />

                            <FormInput
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="Min 8 characters"
                                icon={<Lock size={16} />}
                                helperText="Must include uppercase, lowercase, and number"
                            />

                            <FormInput
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                placeholder="Repeat password"
                                icon={<Lock size={16} />}
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="spinner" size={20} />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>
                </FormProvider>

                <div className="register-footer">
                    <p>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
