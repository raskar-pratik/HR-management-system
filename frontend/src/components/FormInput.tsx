import { useState, forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
    icon?: React.ReactNode;
    helperText?: string;
    isValidating?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, name, icon, helperText, className = '', isValidating, type = 'text', ...props }, ref) => {
        const {
            register,
            formState: { errors, dirtyFields },
            getFieldState
        } = useFormContext();

        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        const error = errors[name];
        const isDirty = dirtyFields[name];
        const { invalid } = getFieldState(name);

        // Determine field status
        const getStatus = () => {
            if (isValidating) return 'validating';
            if (error) return 'error';
            if (isDirty && !invalid) return 'valid';
            return 'idle';
        };

        const status = getStatus();

        return (
            <div className={`form-group ${status} ${className}`}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                    {icon && <span className="inline-flex items-center mr-2">{icon}</span>}
                    {label}
                </label>

                <div className="relative">
                    <input
                        id={name}
                        type={inputType}
                        {...register(name)}
                        {...props}
                        ref={ref}
                        className={`
                            w-full px-4 py-2 border rounded-lg transition-all duration-200 outline-none
                            ${icon ? 'pl-10' : 'pl-4'} 
                            ${(isPassword || status !== 'idle') ? 'pr-10' : 'pr-4'}
                            ${status === 'error'
                                ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                : status === 'valid'
                                    ? 'border-green-500 focus:ring-2 focus:ring-green-200'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }
                            ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                        `}
                        aria-invalid={status === 'error' ? 'true' : 'false'}
                        aria-describedby={error ? `${name}-error` : undefined}
                    />

                    {/* Left Icon */}
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            {icon}
                        </div>
                    )}

                    {/* Right-side Icons (Status or Password Toggle) */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {/* Password Toggle */}
                        {isPassword && status !== 'validating' && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 focus:outline-none mr-2"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        )}

                        {/* Status Icons */}
                        {status === 'validating' && (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {status === 'valid' && !isPassword && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        id={`${name}-error`}
                        className="flex items-center mt-1 text-sm text-red-600 animate-fadeIn"
                    >
                        <AlertCircle size={14} className="mr-1" />
                        <span>{error.message as string}</span>
                    </div>
                )}

                {/* Helper Text (only show if no error) */}
                {!error && helperText && (
                    <p className="mt-1 text-xs text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';
