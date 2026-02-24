import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    actionLabel,
    onAction,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-50">
                <Icon className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mb-6 text-sm text-gray-500 max-w-sm">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
