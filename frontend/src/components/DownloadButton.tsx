import React, { useState } from 'react';
import { Loader, FileSpreadsheet, FileText } from 'lucide-react';

interface DownloadButtonProps {
    onDownload: () => Promise<void>;
    label?: string;
    type?: 'excel' | 'pdf' | 'csv';
    className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
    onDownload,
    label = 'Export',
    type = 'excel',
    className = ''
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            await onDownload();
        } catch (error) {
            console.error('Download failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = () => {
        if (isLoading) return <Loader className="animate-spin mr-2" size={16} />;
        if (type === 'pdf') return <FileText className="mr-2" size={16} />;
        return <FileSpreadsheet className="mr-2" size={16} />;
    };

    const getBaseClass = () => {
        if (type === 'pdf') return 'bg-red-600 hover:bg-red-700 text-white';
        return 'bg-green-600 hover:bg-green-700 text-white';
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getBaseClass()} ${className}`}
        >
            {getIcon()}
            {isLoading ? 'Exporting...' : label}
        </button>
    );
};

export default DownloadButton;
