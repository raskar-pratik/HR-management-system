import toast from 'react-hot-toast';

/**
 * Centralized toast utility with typed helpers for all notification variants.
 * react-hot-toast only ships success/error/loading natively;
 * warning & info are implemented as custom toasts with styled icons.
 */

export const showToast = {
    /** ✅ Green – operation completed successfully */
    success: (message: string) => toast.success(message),

    /** ❌ Red – something went wrong */
    error: (message: string) => toast.error(message),

    /** ⚠️ Yellow – needs attention but not a failure */
    warning: (message: string) =>
        toast(message, {
            icon: '⚠️',
            style: {
                background: '#f59e0b',
                color: '#fff',
            },
            duration: 5000,
        }),

    /** ℹ️ Blue – informational feedback */
    info: (message: string) =>
        toast(message, {
            icon: 'ℹ️',
            style: {
                background: '#3b82f6',
                color: '#fff',
            },
            duration: 4000,
        }),

    /** ⏳ Indigo – async promise-based toast (loading → success/error) */
    promise: <T>(
        promise: Promise<T>,
        msgs: { loading: string; success: string; error: string }
    ) => toast.promise(promise, msgs),

    /** Dismiss a specific toast or all toasts */
    dismiss: (id?: string) => toast.dismiss(id),
};
