import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { format } from 'date-fns';
import { History, ArrowRight, User } from 'lucide-react';

const AuditLogViewer: React.FC = () => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        userId: '',
        startDate: '',
        endDate: ''
    });

    const { data, isLoading } = useQuery({
        queryKey: ['auditLogs', page, filters],
        queryFn: () => api.getAuditLogs({ page, limit: 20, ...filters })
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                    <History className="mr-2 text-indigo-600" />
                    Audit Logs
                </h2>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <input
                    type="text"
                    name="entity"
                    placeholder="Entity (e.g. Employee)"
                    className="border p-2 rounded"
                    value={filters.entity}
                    onChange={handleFilterChange}
                />
                <select
                    name="action"
                    className="border p-2 rounded"
                    value={filters.action}
                    onChange={handleFilterChange}
                >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                </select>
                <input
                    type="date"
                    name="startDate"
                    className="border p-2 rounded"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                />
                <input
                    type="date"
                    name="endDate"
                    className="border p-2 rounded"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                />
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                        ) : data?.data?.logs?.map((log: import('../services/api').AuditLog) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <User className="mr-2 text-gray-400" size={16} />
                                        <div className="text-sm font-medium text-gray-900">
                                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">{log.ipAddress}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                            log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.entity} <span className="text-xs text-gray-400">#{log.entityId.substring(0, 8)}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden">
                                    {log.oldValues && log.newValues ? (
                                        <div className="space-y-1">
                                            {Object.keys(log.newValues).map(key => (
                                                <div key={key} className="flex items-center text-xs">
                                                    <span className="font-medium mr-1">{key}:</span>
                                                    <span className="text-red-600 line-through mr-1">{JSON.stringify(log.oldValues?.[key])}</span>
                                                    <ArrowRight size={10} className="mx-1 text-gray-400" />
                                                    <span className="text-green-600">{JSON.stringify(log.newValues?.[key])}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">No changes recorded</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.details || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 border-t pt-4">
                <span className="text-sm text-gray-700">
                    Page {page} of {data?.data?.pagination?.totalPages || 1}
                </span>
                <div className="space-x-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded text-sm disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!data || page >= data.data.pagination.totalPages}
                        className="px-4 py-2 border rounded text-sm disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogViewer;
