import React, { useState } from 'react';
import { Upload, Check, X, Loader, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import { showSuccess, showError } from '../utils/apiClient';

interface ImportRow {
    rowNumber: number;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    designation: string;
    isValid: boolean;
    errors: string[];
}

const BulkImport: React.FC = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        setIsProcessing(true);
        try {
            const result = await api.previewImport(file);

            if (result.success && result.data) {
                setPreviewData(result.data.rows as ImportRow[]);
                setStats({
                    total: result.data.totalRows,
                    valid: result.data.validRows,
                    invalid: result.data.invalidRows
                });
                setStep(2);
            } else {
                showError('Invalid server response');
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            showError('Failed to parse file: ' + errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        setIsProcessing(true);
        try {
            const validRows = previewData.filter(r => r.isValid);
            const result = await api.processImport(validRows);
            showSuccess(result.message);
            setStep(1);
            setPreviewData([]);
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            showError('Import failed: ' + errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center">
                <FileSpreadsheet className="mr-2 text-green-600" />
                Bulk Employee Import
            </h2>

            {step === 1 && (
                <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="mb-4 text-gray-600">Upload Excel file (.xlsx) containing employee records.</p>
                    <p className="text-sm text-gray-500 mb-6">Required columns: FirstName, LastName, Email, Phone, Department, Designation</p>

                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="import-file"
                        disabled={isProcessing}
                    />
                    <label
                        htmlFor="import-file"
                        className={`inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md cursor-pointer hover:bg-indigo-700 transition-colors ${isProcessing ? 'opacity-50' : ''}`}
                    >
                        {isProcessing ? <Loader className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                        {isProcessing ? 'Processing...' : 'Select File'}
                    </label>
                </div>
            )}

            {step === 2 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex space-x-4 text-sm">
                            <span className="text-gray-600">Total: <strong>{stats.total}</strong></span>
                            <span className="text-green-600">Valid: <strong>{stats.valid}</strong></span>
                            <span className="text-red-600">Invalid: <strong>{stats.invalid}</strong></span>
                        </div>
                        <div className="space-x-2">
                            <button
                                onClick={() => setStep(1)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={stats.valid === 0 || isProcessing}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Importing...' : 'Import Valid Rows'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg max-h-96">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className={row.isValid ? '' : 'bg-red-50'}>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {row.isValid ? (
                                                <Check className="text-green-500" />
                                            ) : (
                                                <X className="text-red-500" />
                                            )}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">{row.firstName} {row.lastName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{row.email}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{row.department}</td>
                                        <td className="px-4 py-2 text-sm text-red-600">
                                            {row.errors.join(', ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkImport;
