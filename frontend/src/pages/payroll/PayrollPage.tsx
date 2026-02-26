import { useState, useEffect, useCallback } from 'react';
import { PayrollPageSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import {
    Coins, FileText, Users, Play, Plus,
    Download, CreditCard, ChevronDown, Loader2
} from 'lucide-react';
import api from '../../services/api';
import type { SalaryComponent, PayrollRun, Payslip } from '../../services/api';
import toast from 'react-hot-toast';

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];

const TABS = [
    { id: 'payslips', label: 'Payslips', icon: FileText },
    { id: 'process', label: 'Run Payroll', icon: Play },
    { id: 'components', label: 'Salary Components', icon: CreditCard },
    { id: 'structures', label: 'Structures', icon: Users },
] as const;
type TabId = typeof TABS[number]['id'];

const RUN_STATUS: Record<string, string> = {
    completed: 'badge-green', processing: 'badge-amber',
    failed: 'badge-red', pending: 'badge-gray',
};

const fmt = (v: number | string) => `₹${Number(v).toLocaleString('en-IN')}`;

export default function PayrollPage() {
    const [activeTab, setActiveTab] = useState<TabId>('payslips');
    const [isLoading, setIsLoading] = useState(false);
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [processMonth, setProcessMonth] = useState(new Date().getMonth() + 1);
    const [processYear, setProcessYear] = useState(new Date().getFullYear());
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'components') setComponents((await api.getSalaryComponents()).data || []);
            else if (activeTab === 'process') setRuns((await api.getPayrollRuns()).data || []);
            else if (activeTab === 'payslips') setPayslips((await api.getPayslips()).data || []);
        } catch { toast.error('Failed to load data'); }
        finally { setIsLoading(false); }
    }, [activeTab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const confirmProcess = async () => {
        setIsProcessing(true);
        try {
            await api.processPayroll({ month: processMonth, year: processYear });
            toast.success(`Payroll for ${MONTHS[processMonth - 1]} ${processYear} started!`);
            setShowProcessModal(false);
            fetchData();
        } catch { toast.error('Failed to start payroll process'); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payroll</h1>
                    <p className="page-subtitle">Manage salary components, run payroll and download payslips</p>
                </div>
                <div className="page-actions">
                    {activeTab === 'components' && (
                        <button className="btn btn-primary"><Plus size={15} /> Add Component</button>
                    )}
                    {activeTab === 'process' && (
                        <button className="btn btn-primary" onClick={() => setShowProcessModal(true)}>
                            <Play size={15} /> Run Payroll
                        </button>
                    )}
                </div>
            </div>

            {/* Pill Tabs */}
            <div style={{
                display: 'flex', gap: 4, background: 'var(--bg-subtle)',
                padding: 4, borderRadius: 'var(--radius-lg)', width: 'fit-content', marginBottom: 24,
            }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '8px 16px', borderRadius: 'var(--radius)',
                        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        fontFamily: 'inherit',
                        background: activeTab === tab.id ? 'var(--bg-white)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.15s',
                    }}>
                        <tab.icon size={14} />{tab.label}
                    </button>
                ))}
            </div>

            {isLoading && activeTab !== 'process' ? <PayrollPageSkeleton /> : (<>

                {/* PAYSLIPS */}
                {activeTab === 'payslips' && (
                    <div className="table-wrapper">
                        {payslips.length === 0 ? (
                            <EmptyState title="No payslips" description="Process payroll to generate payslips." icon={FileText} />
                        ) : (
                            <table className="data-table">
                                <thead><tr>
                                    <th>Employee</th><th>Period</th>
                                    <th>Gross</th><th>Deductions</th><th>Net Pay</th>
                                    <th>Status</th><th style={{ textAlign: 'right' }}>PDF</th>
                                </tr></thead>
                                <tbody>
                                    {payslips.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {p.employee?.user?.name ?? '—'}
                                                    </span>
                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                        {p.employee?.employeeCode}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{MONTHS[p.month - 1]} {p.year}</td>
                                            <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt(p.grossEarnings)}</td>
                                            <td style={{ color: 'var(--red)' }}>−{fmt(p.totalDeductions)}</td>
                                            <td style={{ fontWeight: 800, fontSize: 15 }}>{fmt(p.netPay)}</td>
                                            <td><span className="badge badge-green"><span className="badge-dot" />{p.status ?? 'Generated'}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-ghost btn-sm btn-icon-only"><Download size={15} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* RUN PAYROLL */}
                {activeTab === 'process' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="card card-padded">
                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Process New Payroll Run</h3>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Month</label>
                                    <div style={{ position: 'relative' }}>
                                        <select className="form-input" value={processMonth}
                                            onChange={e => setProcessMonth(Number(e.target.value))}
                                            style={{ appearance: 'none', paddingRight: 36, width: 160 }}>
                                            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Year</label>
                                    <input type="number" className="form-input" value={processYear}
                                        onChange={e => setProcessYear(Number(e.target.value))}
                                        style={{ width: 100 }} />
                                </div>
                                <button className="btn btn-primary" onClick={() => setShowProcessModal(true)}
                                    disabled={isProcessing} style={{ alignSelf: 'flex-end' }}>
                                    {isProcessing
                                        ? <><Loader2 size={15} className="spinner" /> Processing…</>
                                        : <><Play size={15} /> Process Payroll</>}
                                </button>
                            </div>
                            <div style={{
                                marginTop: 14, padding: '11px 14px',
                                background: 'var(--amber-light)', borderRadius: 'var(--radius)',
                                fontSize: 13, color: '#78350f', fontWeight: 500,
                            }}>
                                ⚠️ This will generate payslips for <strong>all active employees</strong>. Action cannot be undone.
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-light)' }}>
                                <span style={{ fontSize: 14, fontWeight: 700 }}>Payroll History</span>
                            </div>
                            {isLoading ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Loader2 size={20} className="spinner" style={{ display: 'inline-block', color: 'var(--text-light)' }} />
                                </div>
                            ) : runs.length === 0 ? (
                                <EmptyState title="No payroll history" description="Process your first payroll to see history." icon={Coins} />
                            ) : (
                                <table className="data-table">
                                    <thead><tr>
                                        <th>Period</th><th>Status</th><th>Employees</th>
                                        <th>Total Net Pay</th><th>Processed On</th>
                                    </tr></thead>
                                    <tbody>
                                        {runs.map(r => (
                                            <tr key={r.id}>
                                                <td style={{ fontWeight: 700 }}>{MONTHS[r.month - 1]} {r.year}</td>
                                                <td>
                                                    <span className={`badge ${RUN_STATUS[r.status] || 'badge-gray'}`}>
                                                        <span className="badge-dot" />
                                                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td>{r.employeeCount}</td>
                                                <td style={{ fontWeight: 700 }}>{fmt(r.totalNet)}</td>
                                                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                    {r.processedAt ? new Date(r.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* COMPONENTS */}
                {activeTab === 'components' && (
                    <div className="table-wrapper">
                        {components.length === 0 ? (
                            <EmptyState title="No salary components" description="Define earnings and deductions for your salary structures." icon={CreditCard} />
                        ) : (
                            <table className="data-table">
                                <thead><tr>
                                    <th>Name</th><th>Code</th><th>Type</th><th>Calculation</th><th>Status</th>
                                </tr></thead>
                                <tbody>
                                    {components.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                                            <td>
                                                <code style={{
                                                    background: 'var(--bg-subtle)', padding: '3px 8px',
                                                    borderRadius: 6, fontSize: 12, fontFamily: 'monospace',
                                                    color: 'var(--primary)', fontWeight: 600,
                                                }}>{c.code}</code>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.type === 'earning' ? 'badge-green' : 'badge-red'}`}>
                                                    {c.type === 'earning' ? '+ Earning' : '− Deduction'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                {c.calculationType}{c.percentageOf && ` of ${c.percentageOf}`}
                                            </td>
                                            <td>
                                                <span className={`badge ${c.isActive ? 'badge-green' : 'badge-gray'}`}>
                                                    <span className="badge-dot" />
                                                    {c.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* STRUCTURES */}
                {activeTab === 'structures' && (
                    <div className="card card-padded" style={{ textAlign: 'center', padding: '60px 40px' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'var(--primary-light)', margin: '0 auto 14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                        }}>
                            <Users size={24} />
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Salary Structures</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto' }}>
                            Open an employee's profile from the Employees page to assign or edit their salary structure.
                        </p>
                    </div>
                )}
            </>)}

            <ConfirmationModal
                isOpen={showProcessModal}
                onClose={() => setShowProcessModal(false)}
                onConfirm={confirmProcess}
                title="Confirm Payroll Run"
                message={`Process payroll for ${MONTHS[processMonth - 1]} ${processYear}? Payslips will be generated for all active employees.`}
                confirmLabel="Start Processing"
                variant="warning"
                isLoading={isProcessing}
            />
        </div>
    );
}
