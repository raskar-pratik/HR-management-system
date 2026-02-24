import { useEffect, useState, useCallback } from 'react';
import { AttendancePageSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Clock, Calendar, Download, ChevronLeft, ChevronRight, UserCheck, UserX, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { AttendanceRecord } from '../../services/api';

export default function AttendancePage() {
    const [report, setReport] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<{
        present: number;
        late: number;
        absent: number;
        totalHours: string;
        avgHours: string | number;
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
            setReport(response.data || []);

            const present = response.data.filter((r: AttendanceRecord) => r.status === 'present' || r.status === 'late').length;
            const late = response.data.filter((r: AttendanceRecord) => r.status === 'late').length;
            const totalHours = response.data.reduce((sum: number, r: AttendanceRecord) => sum + (r.workHours || 0), 0);

            setSummary({
                present,
                late,
                absent: endDate.getDate() - present,
                totalHours: totalHours.toFixed(1),
                avgHours: present > 0 ? (totalHours / present).toFixed(1) : 0,
            });
        } catch (error) {
            toast.error('Failed to load attendance');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth]);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present': return <UserCheck size={16} className="text-green" />;
            case 'late': return <AlertCircle size={16} className="text-orange" />;
            case 'absent': return <UserX size={16} className="text-red" />;
            default: return null;
        }
    };

    return (
        <div className="attendance-page">
            <div className="page-header">
                <div className="header-left">
                    <Clock size={32} className="page-icon" />
                    <div>
                        <h1>Attendance Report</h1>
                        <p>Track your work hours</p>
                    </div>
                </div>
                <button className="btn-secondary">
                    <Download size={20} />
                    Export
                </button>
            </div>

            <div className="month-nav">
                <button onClick={prevMonth}>
                    <ChevronLeft size={24} />
                </button>
                <h2>{formatMonth(currentMonth)}</h2>
                <button onClick={nextMonth}>
                    <ChevronRight size={24} />
                </button>
            </div>

            {summary && (
                <div className="summary-grid">
                    <div className="summary-card green">
                        <UserCheck size={24} />
                        <div>
                            <h3>{summary.present}</h3>
                            <p>Days Present</p>
                        </div>
                    </div>
                    <div className="summary-card orange">
                        <AlertCircle size={24} />
                        <div>
                            <h3>{summary.late}</h3>
                            <p>Days Late</p>
                        </div>
                    </div>
                    <div className="summary-card blue">
                        <Clock size={24} />
                        <div>
                            <h3>{summary.totalHours}h</h3>
                            <p>Total Hours</p>
                        </div>
                    </div>
                    <div className="summary-card purple">
                        <TrendingUp size={24} />
                        <div>
                            <h3>{summary.avgHours}h</h3>
                            <p>Avg. Hours/Day</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-container">
                {isLoading ? (
                    <AttendancePageSkeleton />
                ) : report.length === 0 ? (
                    <EmptyState
                        title="No attendance records"
                        description="No attendance records found for this period."
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
                            {report.map((record) => {
                                const date = new Date(record.date);
                                return (
                                    <tr key={record.id}>
                                        <td>{date.toLocaleDateString()}</td>
                                        <td>{date.toLocaleDateString('en-US', { weekday: 'short' })}</td>
                                        <td>{record.clockIn || '-'}</td>
                                        <td>{record.clockOut || '-'}</td>
                                        <td>{record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}</td>
                                        <td>
                                            <span className={`status-badge ${record.status}`}>
                                                {getStatusIcon(record.status)}
                                                {record.status}
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
