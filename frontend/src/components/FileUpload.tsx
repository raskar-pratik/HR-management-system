import React, { useRef, useState } from 'react';
import { UploadCloud, Loader } from 'lucide-react';
import api from '../services/api';

interface FileUploadData {
    url: string;
    fileId: string;
    [key: string]: unknown;
}

interface FileUploadProps {
    onUploadSuccess: (fileUrl: string, fileData: FileUploadData) => void;
    onError?: (error: string) => void;
    maxSizeInMB?: number;
    acceptedFileTypes?: string; // e.g. "image/*, .pdf"
    label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onUploadSuccess,
    onError,
    maxSizeInMB = 5,
    acceptedFileTypes = "image/*,application/pdf",
    label = "Upload File"
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = async (file: File) => {
        // Validation: Size
        if (file.size > maxSizeInMB * 1024 * 1024) {
            const errorMsg = `File size exceeds ${maxSizeInMB}MB limit.`;
            if (onError) onError(errorMsg);
            else alert(errorMsg); // Fallback
            return;
        }

        // Upload
        setIsUploading(true);
        try {
            const response = await api.uploadFile(file);
            if (response.success && response.data) {
                onUploadSuccess(response.data.url, response.data);
            } else {
                throw new Error((response as unknown as { message?: string }).message || 'Upload failed');
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Error uploading file';
            if (onError) onError(errorMsg);
            else console.error(errorMsg);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                    ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 bg-gray-50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={acceptedFileTypes}
                    onChange={handleChange}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center text-primary-600">
                        <Loader className="animate-spin text-3xl mb-2" size={32} />
                        <span className="text-sm">Uploading...</span>
                    </div>
                ) : (
                    <>
                        <UploadCloud className="text-4xl text-gray-400 mb-2" size={40} />
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {acceptedFileTypes.replace(/,/g, ', ')} (Max {maxSizeInMB}MB)
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
