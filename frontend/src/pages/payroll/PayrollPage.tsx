import { useState, useEffect, useCallback } from 'react';
import { PayrollPageSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import {
    Coins,
    FileText,
    Users,
    Play,
    Plus,
    Download,
    CreditCard
} from 'lucide-react';
import api from '../../services/api';
import type {
    SalaryComponent,
    PayrollRun,
    Payslip
} from '../../services/api';
import toast from 'react-hot-toast';

export default function PayrollPage() {
    const [activeTab, setActiveTab] = useState<'components' | 'structures' | 'process' | 'payslips'>('payslips');
    const [isLoading, setIsLoading] = useState(false);

    // Data States
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);

    // Process State
    const [processMonth, setProcessMonth] = useState(new Date().getMonth() + 1);
    const [processYear, setProcessYear] = useState(new Date().getFullYear());
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'components') {
                const res = await api.getSalaryComponents();
                setComponents(res.data || []);
            } else if (activeTab === 'process') {
                const res = await api.getPayrollRuns();
                setRuns(res.data || []);
            } else if (activeTab === 'payslips') {
                const res = await api.getPayslips();
                setPayslips(res.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleProcessClick = () => {
        if (!processMonth || !processYear) return;
        setShowProcessModal(true);
    };

    const confirmProcess = async () => {
        setIsProcessing(true);
        try {
            await api.processPayroll({ month: processMonth, year: processYear });
            toast.success('Payroll processing started in background');
            setShowProcessModal(false);
            fetchData();
        } catch {
            toast.error('Failed to start payroll process');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading && activeTab !== 'process') {
        return <PayrollPageSkeleton />;
    }

    const renderComponentsTab = () => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Salary Components</h3>
                <button className="btn btn-primary flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    <Plus size={16} className="mr-2" />
                    Add Component
                </button>
            </div>
            <div className="overflow-x-auto">
                {components.length === 0 ? (
                    <EmptyState
                        title="No salary components"
                        description="Define earnings and deductions for your salary structures."
                        icon={CreditCard}
                    />
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {components.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{c.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{c.code}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.type === 'earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {c.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {c.calculationType} {c.percentageOf ? `of ${c.percentageOf}` : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {c.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const renderProcessTab = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Run Payroll</h3>
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <select
                            value={processMonth}
                            onChange={(e) => setProcessMonth(Number(e.target.value))}
                            className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <input
                            type="number"
                            value={processYear}
                            onChange={(e) => setProcessYear(Number(e.target.value))}
                            className="block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <button
                        onClick={handleProcessClick}
                        disabled={isLoading || isProcessing}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                    >
                        {isLoading ? 'Processing...' : <><Play size={16} className="mr-2" /> Process Payroll</>}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Payroll Runs</h3>
                {runs.length === 0 ? (
                    <EmptyState
                        title="No payroll history"
                        description="Process your first payroll run to see history here."
                        icon={Coins}
                    />
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Net Pay</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed On</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {runs.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{new Date(0, r.month - 1).toLocaleString('default', { month: 'short' })} {r.year}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{r.employeeCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${Number(r.totalNet).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.processedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const renderPayslipsTab = () => (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Payslips</h3>
            <div className="overflow-x-auto">
                {payslips.length === 0 ? (
                    <EmptyState
                        title="No payslips generated"
                        description="Process payroll to generate payslips for employees."
                        icon={FileText}
                    />
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payslips.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="ml-0">
                                                <div className="text-sm font-medium text-gray-900">{p.employee?.user.name}</div>
                                                <div className="text-sm text-gray-500">{p.employee?.employeeCode}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(0, p.month - 1).toLocaleString('default', { month: 'short' })} {p.year}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Number(p.grossEarnings).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">-${Number(p.totalDeductions).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${Number(p.netPay).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900"><Download size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Coins className="mr-3 text-yellow-500" />
                    Payroll Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage salary components, payroll processing, and employee payslips
                </p>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'payslips', name: 'Payslips', icon: FileText },
                        { id: 'process', name: 'Process Payroll', icon: Play },
                        { id: 'structures', name: 'Salary Structures', icon: Users },
                        { id: 'components', name: 'Salary Components', icon: CreditCard },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <tab.icon className="mr-2 h-4 w-4" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'components' && renderComponentsTab()}
            {activeTab === 'process' && renderProcessTab()}
            {activeTab === 'payslips' && renderPayslipsTab()}
            {activeTab === 'structures' && <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">Select an employee to view/edit salary structure (Coming Soon)</div>}

            <ConfirmationModal
                isOpen={showProcessModal}
                onClose={() => setShowProcessModal(false)}
                onConfirm={confirmProcess}
                title="Process Payroll"
                message={`Are you sure you want to process payroll for ${new Date(0, processMonth - 1).toLocaleString('default', { month: 'long' })} ${processYear}? This will generate payslips for all active employees.`}
                confirmLabel="Start Processing"
                variant="warning"
                isLoading={isProcessing}
            />
        </div>
    );
}
