import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    message: string | ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    isLoading?: boolean;
    children?: ReactNode; // For additional inputs like rejection reason
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    isLoading = false,
    children
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertCircle className="w-6 h-6 text-red-600" />;
            case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
            default: return <Info className="w-6 h-6 text-blue-600" />;
        }
    };

    const getButtonColor = () => {
        switch (variant) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <div className="modal-overlay" onClick={isLoading ? undefined : onClose}>
            <div className="modal-content max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="absolute top-4 right-4">
                    {!isLoading && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="flex items-start">
                    <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${variant === 'danger' ? 'bg-red-100' :
                        variant === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                        } sm:mx-0 sm:h-10 sm:w-10`}>
                        {getIcon()}
                    </div>
                    <div className="ml-4 w-full">
                        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                        {children && <div className="mt-4">{children}</div>}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner-small mr-2"></div>
                                Processing...
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
