import { useEffect, useState, useCallback } from 'react';
import { AttendancePageSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import {
    Clock, Calendar, Download, ChevronLeft, ChevronRight,
    UserCheck, UserX, AlertCircle, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { AttendanceRecord } from '../../services/api';

const STATUS_BADGE: Record<string, string> = {
    present: 'badge-green',
    late: 'badge-amber',
    absent: 'badge-red',
};

const STATUS_ICON: Record<string, JSX.Element> = {
    present: <UserCheck size={13} />,
    late: <AlertCircle size={13} />,
    absent: <UserX size={13} />,
};

export default function AttendancePage() {
    const [report, setReport] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<{
        present: number; late: number; absent: number;
        totalHours: string; avgHours: string | number;
    } | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

    const loadAttendance = useCallback(async () => {
        setIsLoading(true);
        try {
            const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const response = await api.getAttendanceReport({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            });

            const records: AttendanceRecord[] = response.data || [];
            setReport(records);

            const present = records.filter(r => ['present', 'late'].includes(r.status)).length;
            const late = records.filter(r => r.status === 'late').length;
            const totalHoursNum = records.reduce((sum, r) => sum + (r.workHours || 0), 0);

            setSummary({
                present,
                late,
                absent: endDate.getDate() - present,
                totalHours: totalHoursNum.toFixed(1),
                avgHours: present > 0 ? (totalHoursNum / present).toFixed(1) : 0,
            });
        } catch {
            toast.error('Failed to load attendance');
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth]);

    useEffect(() => { loadAttendance(); }, [loadAttendance]);

    const handleExport = async () => {
        try { await api.exportAttendance(); }
        catch { toast.error('Export failed'); }
    };

    const formatMonth = (d: Date) =>
        d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const summaryCards = summary ? [
        { label: 'Days Present', value: summary.present, icon: UserCheck, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { label: 'Days Late', value: summary.late, icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        { label: 'Total Hours', value: `${summary.totalHours}h`, icon: Clock, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        { label: 'Avg. Hours/Day', value: `${summary.avgHours}h`, icon: TrendingUp, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    ] : [];

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Track your monthly work hours and attendance</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={handleExport}>
                        <Download size={15} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Month Navigator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
                background: 'var(--bg-white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 20px',
                boxShadow: 'var(--shadow-xs)',
                width: 'fit-content',
            }}>
                <button
                    className="btn btn-ghost btn-sm btn-icon-only"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', minWidth: 160, textAlign: 'center' }}>
                    {formatMonth(currentMonth)}
                </span>
                <button
                    className="btn btn-ghost btn-sm btn-icon-only"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
                    {summaryCards.map(c => (
                        <div className="stat-card" key={c.label}>
                            <div className="stat-card-header">
                                <span className="stat-card-label">{c.label}</span>
                                <div className="stat-card-icon" style={{ background: c.bg }}>
                                    <c.icon size={18} color={c.color} />
                                </div>
                            </div>
                            <div className="stat-card-value">{c.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="table-wrapper">
                {isLoading ? (
                    <AttendancePageSkeleton />
                ) : report.length === 0 ? (
                    <EmptyState
                        title="No attendance records"
                        description="No records found for this period."
                        icon={Calendar}
                    />
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Day</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Work Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.map(record => {
                                const date = new Date(record.date);
                                const statusClass = STATUS_BADGE[record.status] || 'badge-gray';
                                const isWeekend = [0, 6].includes(date.getDay());

                                return (
                                    <tr key={record.id} style={isWeekend ? { opacity: 0.55 } : {}}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {date.toLocaleDateString('en-US', { weekday: 'long' })}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                            {record.clockIn || <span style={{ color: 'var(--text-light)' }}>—</span>}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                            {record.clockOut || <span style={{ color: 'var(--text-light)' }}>—</span>}
                                        </td>
                                        <td>
                                            {record.workHours
                                                ? <span style={{ fontWeight: 600 }}>{record.workHours.toFixed(1)}h</span>
                                                : <span style={{ color: 'var(--text-light)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <span className={`badge ${statusClass}`}>
                                                {STATUS_ICON[record.status]}
                                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
