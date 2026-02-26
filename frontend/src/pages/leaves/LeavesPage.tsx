import { useEffect, useState, useCallback } from 'react';
import { LeavesPageSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Calendar, Plus, Check, X, Clock, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { LeaveRequest } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const LEAVE_TYPES = [
    { value: 'sick', label: 'Sick Leave', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
    { value: 'casual', label: 'Casual Leave', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { value: 'earned', label: 'Earned Leave', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { value: 'maternity', label: 'Maternity Leave', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    { value: 'paternity', label: 'Paternity Leave', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { value: 'unpaid', label: 'Unpaid Leave', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
];

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-amber',
    approved: 'badge-green',
    rejected: 'badge-red',
    cancelled: 'badge-gray',
};

const FILTER_TABS = ['all', 'pending', 'approved', 'rejected'];

function getLeaveType(type: string) {
    return LEAVE_TYPES.find(t => t.value === type) || { label: type, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
}

export default function LeavesPage() {
    const user = useAuthStore(s => s.user);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<Record<string, { used: number; total: number }> | null>(null);
    const [filter, setFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [rejectModal, setRejectModal] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const isManager = ['company_admin', 'hr_manager', 'super_admin', 'manager'].includes(user?.role ?? '');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [leavesRes, balanceRes] = await Promise.all([
                api.getLeaves(filter !== 'all' ? { status: filter } : undefined),
                api.getLeaveBalance(),
            ]);
            setLeaves(leavesRes.data.leaves || []);
            setLeaveBalance(balanceRes.data);
        } catch {
            toast.error('Failed to load leaves');
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleApprove = async (id: string) => {
        try {
            await api.approveLeave(id);
            loadData();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to approve');
        }
    };

    const confirmReject = async () => {
        if (!rejectModal.id || !rejectionReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setIsRejecting(true);
        try {
            await api.rejectLeave(rejectModal.id, rejectionReason);
            setRejectModal({ show: false, id: null });
            loadData();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to reject');
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Request and manage time off</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
                        <Plus size={15} />
                        Apply Leave
                    </button>
                </div>
            </div>

            {/* Balance Cards */}
            {leaveBalance && Object.keys(leaveBalance).length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 14,
                    marginBottom: 24,
                }}>
                    {Object.entries(leaveBalance).map(([type, balance]) => {
                        const info = getLeaveType(type);
                        const pct = balance.total > 0 ? Math.round((balance.used / balance.total) * 100) : 0;
                        return (
                            <div key={type} style={{
                                background: 'var(--bg-white)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '16px',
                                boxShadow: 'var(--shadow-xs)',
                            }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: 'var(--radius-full)',
                                    background: info.bg,
                                    color: info.color,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    marginBottom: 10,
                                    textTransform: 'capitalize' as const,
                                }}>
                                    {info.label}
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                                    {balance.used}
                                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
                                        /{balance.total}
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div style={{
                                    height: 4, background: 'var(--bg-subtle)',
                                    borderRadius: 2, marginTop: 8, overflow: 'hidden',
                                }}>
                                    <div style={{
                                        height: '100%', width: `${pct}%`,
                                        background: info.color, borderRadius: 2,
                                        transition: 'width 0.4s ease',
                                    }} />
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 5, fontWeight: 500 }}>
                                    {balance.used} used · {balance.total - balance.used} remaining
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="filter-chips" style={{ marginBottom: 20 }}>
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab}
                        className={`filter-chip${filter === tab ? ' active' : ''}`}
                        onClick={() => setFilter(tab)}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {tab === 'all' ? 'All Requests' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Leave List */}
            {isLoading ? (
                <LeavesPageSkeleton />
            ) : leaves.length === 0 ? (
                <EmptyState
                    title="No leave requests"
                    description="Apply for leave when you need time off."
                    icon={Calendar}
                    actionLabel="Apply Leave"
                    onAction={() => setShowApplyModal(true)}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {leaves.map(leave => {
                        const typeInfo = getLeaveType(leave.leaveType);
                        const statusClass = STATUS_BADGE[leave.status] || 'badge-gray';
                        const start = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const end = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                        return (
                            <div key={leave.id} style={{
                                background: 'var(--bg-white)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '18px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                boxShadow: 'var(--shadow-xs)',
                            }}>
                                {/* Type pill */}
                                <div style={{
                                    padding: '6px 14px',
                                    borderRadius: 'var(--radius-full)',
                                    background: typeInfo.bg,
                                    color: typeInfo.color,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap' as const,
                                    flexShrink: 0,
                                }}>
                                    {typeInfo.label}
                                </div>

                                {/* Details */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Clock size={13} color="var(--text-muted)" />
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                            {start} – {end}
                                        </span>
                                        <span className="badge badge-gray" style={{ padding: '2px 8px' }}>
                                            {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {leave.reason && (
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                                            {leave.reason}
                                        </p>
                                    )}
                                </div>

                                {/* Status + Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    <span className={`badge ${statusClass}`}>
                                        <span className="badge-dot" />
                                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                    </span>

                                    {isManager && leave.status === 'pending' && (
                                        <>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: 'var(--green-light)', color: '#065f46', border: 'none' }}
                                                onClick={() => handleApprove(leave.id)}
                                                title="Approve"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none' }}
                                                onClick={() => { setRejectModal({ show: true, id: leave.id }); setRejectionReason(''); }}
                                                title="Reject"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <ApplyLeaveModal
                    onClose={() => setShowApplyModal(false)}
                    onSuccess={() => { setShowApplyModal(false); loadData(); }}
                />
            )}

            {/* Reject Modal */}
            <ConfirmationModal
                isOpen={rejectModal.show}
                onClose={() => setRejectModal({ show: false, id: null })}
                onConfirm={confirmReject}
                title="Reject Leave Request"
                message="Please provide a reason for rejection."
                confirmLabel="Reject Request"
                variant="danger"
                isLoading={isRejecting}
            >
                <div style={{ marginTop: 14 }}>
                    <label className="form-label">Reason for Rejection *</label>
                    <textarea
                        className="form-input"
                        rows={3}
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        placeholder="e.g., Shortage of staff, project deadline..."
                        style={{ marginTop: 6, resize: 'vertical' }}
                    />
                </div>
            </ConfirmationModal>
        </div>
    );
}

function ApplyLeaveModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.applyLeave(formData);
            onSuccess();
        } catch {
            toast.error('Failed to apply leave');
        } finally {
            setIsLoading(false);
        }
    };

    const totalDays = formData.startDate && formData.endDate
        ? Math.max(1, Math.round((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000) + 1)
        : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Apply for Leave</span>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Leave Type</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="form-input"
                                    value={formData.leaveType}
                                    onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                                    style={{ appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                                >
                                    {LEAVE_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.endDate}
                                    min={formData.startDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {totalDays > 0 && (
                            <div style={{
                                padding: '10px 14px',
                                background: 'var(--primary-light)',
                                borderRadius: 'var(--radius)',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--primary)',
                                marginBottom: 16,
                            }}>
                                📅 {totalDays} working day{totalDays !== 1 ? 's' : ''} requested
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Reason</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Please provide a reason for your leave request..."
                                style={{ resize: 'vertical' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Submitting…' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
