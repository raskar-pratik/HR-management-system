import { useEffect, useState, useCallback } from 'react';
import { LeavesPageSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Calendar, Plus, Check, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { LeaveRequest } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const LEAVE_TYPES = [
    { value: 'sick', label: 'Sick Leave', color: '#ef4444' },
    { value: 'casual', label: 'Casual Leave', color: '#3b82f6' },
    { value: 'earned', label: 'Earned Leave', color: '#10b981' },
    { value: 'maternity', label: 'Maternity Leave', color: '#ec4899' },
    { value: 'paternity', label: 'Paternity Leave', color: '#8b5cf6' },
    { value: 'unpaid', label: 'Unpaid Leave', color: '#6b7280' },
];

export default function LeavesPage() {
    const user = useAuthStore((state) => state.user);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<Record<string, { used: number; total: number }> | null>(null);
    const [filter, setFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Reject Modal State
    const [rejectModal, setRejectModal] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const isManager = user?.role === 'company_admin' || user?.role === 'hr_manager';

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [leavesRes, balanceRes] = await Promise.all([
                api.getLeaves(filter !== 'all' ? { status: filter } : undefined),
                api.getLeaveBalance(),
            ]);
            setLeaves(leavesRes.data.leaves || []);
            setLeaveBalance(balanceRes.data);
        } catch (error) {
            toast.error('Failed to load leaves');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApprove = async (id: string) => {
        try {
            await api.approveLeave(id);
            toast.success('Leave approved');
            loadData();
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to approve';
            toast.error(errorMsg);
        }
    };

    const handleRejectClick = (id: string) => {
        setRejectModal({ show: true, id });
        setRejectionReason('');
    };

    const confirmReject = async () => {
        if (!rejectModal.id || !rejectionReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setIsRejecting(true);
        try {
            await api.rejectLeave(rejectModal.id, rejectionReason);
            toast.success('Leave rejected');
            setRejectModal({ show: false, id: null });
            loadData();
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to reject';
            toast.error(errorMsg);
        } finally {
            setIsRejecting(false);
        }
    };

    const getLeaveTypeInfo = (type: string) => {
        return LEAVE_TYPES.find(t => t.value === type) || { label: type, color: '#6b7280' };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#10b981';
            case 'rejected': return '#ef4444';
            case 'pending': return '#f59e0b';
            case 'cancelled': return '#6b7280';
            default: return '#6b7280';
        }
    };

    return (
        <div className="leaves-page">
            <div className="page-header">
                <div className="header-left">
                    <Calendar size={32} className="page-icon" />
                    <div>
                        <h1>Leave Management</h1>
                        <p>Manage your time off</p>
                    </div>
                </div>
                <button className="btn-primary" onClick={() => setShowApplyModal(true)}>
                    <Plus size={20} />
                    Apply Leave
                </button>
            </div>

            {leaveBalance && (
                <div className="leave-balance-grid">
                    {Object.entries(leaveBalance).map(([type, balance]) => {
                        const info = getLeaveTypeInfo(type);
                        return (
                            <div key={type} className="balance-card" style={{ borderColor: info.color }}>
                                <div className="balance-header" style={{ background: info.color }}>
                                    {info.label}
                                </div>
                                <div className="balance-value">
                                    <span className="used">{balance.used || 0}</span>
                                    <span className="separator">/</span>
                                    <span className="total">{balance.total || 0}</span>
                                </div>
                                <div className="balance-label">Used / Total</div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="filter-tabs">
                <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
                <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>Approved</button>
                <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>Rejected</button>
            </div>

            <div className="leaves-list">
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
                    leaves.map((leave) => {
                        const typeInfo = getLeaveTypeInfo(leave.leaveType);
                        return (
                            <div key={leave.id} className="leave-card">
                                <div className="leave-type" style={{ background: typeInfo.color }}>
                                    {typeInfo.label}
                                </div>
                                <div className="leave-details">
                                    <div className="leave-dates">
                                        <Clock size={16} />
                                        <span>
                                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                        </span>
                                        <span className="days-badge">{leave.totalDays} days</span>
                                    </div>
                                    <p className="leave-reason">{leave.reason}</p>
                                </div>
                                <div className="leave-status">
                                    <span className="status-badge" style={{ background: getStatusColor(leave.status) }}>
                                        {leave.status}
                                    </span>
                                    {isManager && leave.status === 'pending' && (
                                        <div className="leave-actions">
                                            <button className="btn-approve" onClick={() => handleApprove(leave.id)}>
                                                <Check size={16} />
                                            </button>
                                            <button className="btn-reject" onClick={() => handleRejectClick(leave.id)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showApplyModal && (
                <ApplyLeaveModal
                    onClose={() => setShowApplyModal(false)}
                    onSuccess={() => {
                        setShowApplyModal(false);
                        loadData();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={rejectModal.show}
                onClose={() => setRejectModal({ show: false, id: null })}
                onConfirm={confirmReject}
                title="Reject Leave Request"
                message="Are you sure you want to reject this leave request? This action cannot be undone."
                confirmLabel="Reject Request"
                variant="danger"
                isLoading={isRejecting}
            >
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Reason for Rejection *</label>
                    <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., Shortage of staff, Important project deadline..."
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
            toast.success('Leave applied successfully!');
            onSuccess();
        } catch {
            toast.error('Failed to apply leave');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Apply for Leave</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Leave Type</label>
                        <select
                            value={formData.leaveType}
                            onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                        >
                            {LEAVE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Reason</label>
                        <textarea
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Please provide a reason for your leave..."
                            rows={3}
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Applying...' : 'Apply Leave'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
