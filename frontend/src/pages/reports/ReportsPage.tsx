import { useState, useEffect, useCallback } from 'react';
import {
    FileText, Download, Filter, Calendar, Users, Clock,
    TrendingUp, Building, RefreshCw, UserCheck, UserX, AlertCircle, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

type ReportType = 'attendance' | 'leaves' | 'directory';

interface AttendanceReportData {
    period: { from: string; to: string };
    summary: {
        totalDays: number; presentDays: number;
        absentDays: number; lateDays: number; averageWorkHours: number;
    };
    employeeSummary: Array<{
        employeeId: string; employeeName: string; employeeCode: string;
        department: string; present: number; absent: number; late: number; totalHours: number;
    }>;
}

interface LeaveReportData {
    year: number; totalRequests: number;
    departmentSummary: Array<{
        departmentId: string; departmentName: string;
        totalRequests: number; approved: number; rejected: number; pending: number; totalDays: number;
    }>;
}

interface EmployeeDirectoryData {
    totalEmployees: number;
    employees: Array<{
        employeeCode: string; firstName: string; lastName: string;
        email: string; department: string; joinDate: string; employmentStatus: string;
    }>;
}

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];

const REPORT_TABS: { id: ReportType; label: string; icon: React.ElementType }[] = [
    { id: 'attendance', label: 'Attendance Report', icon: Clock },
    { id: 'leaves', label: 'Leave Summary', icon: Calendar },
    { id: 'directory', label: 'Employee Directory', icon: Users },
];

const STATUS_BADGE: Record<string, string> = {
    active: 'badge-green', inactive: 'badge-gray',
    probation: 'badge-amber', resigned: 'badge-red',
};

function SelectFilter({ label, value, onChange, children }: {
    label: string; value: string | number;
    onChange: (v: string) => void; children: React.ReactNode;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <select className="form-input" value={value} onChange={e => onChange(e.target.value)}
                    style={{ appearance: 'none', paddingRight: 32, fontSize: 13, height: 36, cursor: 'pointer' }}>
                    {children}
                </select>
                <ChevronDown size={13} style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<ReportType>('attendance');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceReportData | null>(null);
    const [leaveData, setLeaveData] = useState<LeaveReportData | null>(null);
    const [directoryData, setDirectoryData] = useState<EmployeeDirectoryData | null>(null);

    useEffect(() => {
        api.getDepartments()
            .then(r => setDepartments(r.data || []))
            .catch(() => {});
    }, []);

    const loadReport = useCallback(async () => {
        setIsLoading(true);
        try {
            switch (activeReport) {
                case 'attendance': {
                    const res = await api.getAdminAttendanceReport({
                        month: selectedMonth, year: selectedYear,
                        departmentId: selectedDepartment || undefined,
                    });
                    setAttendanceData(res.data);
                    break;
                }
                case 'leaves': {
                    const res = await api.getLeaveSummaryReport({
                        year: selectedYear, departmentId: selectedDepartment || undefined,
                    });
                    setLeaveData(res.data);
                    break;
                }
                case 'directory': {
                    const res = await api.getEmployeeDirectory({
                        departmentId: selectedDepartment || undefined,
                    });
                    setDirectoryData(res.data);
                    break;
                }
            }
        } catch { toast.error('Failed to load report'); }
        finally { setIsLoading(false); }
    }, [activeReport, selectedMonth, selectedYear, selectedDepartment]);

    useEffect(() => { loadReport(); }, [loadReport]);

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            let data: Blob; let filename: string;
            switch (activeReport) {
                case 'attendance':
                    data = await api.getAdminAttendanceReport({ month: selectedMonth, year: selectedYear, departmentId: selectedDepartment || undefined, format: 'csv' });
                    filename = `attendance_${selectedMonth}_${selectedYear}.csv`;
                    break;
                case 'leaves':
                    data = await api.getLeaveSummaryReport({ year: selectedYear, departmentId: selectedDepartment || undefined, format: 'csv' });
                    filename = `leave_summary_${selectedYear}.csv`;
                    break;
                default:
                    data = await api.getEmployeeDirectory({ departmentId: selectedDepartment || undefined, format: 'csv' });
                    filename = 'employee_directory.csv';
            }
            api.downloadCSV(data, filename);
            toast.success('Report exported successfully!');
        } catch { toast.error('Failed to export report'); }
        finally { setIsExporting(false); }
    };

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Generate and export HR analytics reports</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={loadReport} disabled={isLoading}>
                        <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
                        Refresh
                    </button>
                    <button className="btn btn-primary" onClick={handleExportCSV} disabled={isExporting}>
                        <Download size={14} />
                        {isExporting ? 'Exporting…' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* Report Type Tabs */}
            <div style={{
                display: 'flex', gap: 4, background: 'var(--bg-subtle)',
                padding: 4, borderRadius: 'var(--radius-lg)', width: 'fit-content', marginBottom: 20,
            }}>
                {REPORT_TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveReport(tab.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '8px 16px', borderRadius: 'var(--radius)',
                        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        fontFamily: 'inherit',
                        background: activeReport === tab.id ? 'var(--bg-white)' : 'transparent',
                        color: activeReport === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: activeReport === tab.id ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.15s',
                    }}>
                        <tab.icon size={14} />{tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex', gap: 14, alignItems: 'flex-end',
                background: 'var(--bg-white)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 18px',
                marginBottom: 20, boxShadow: 'var(--shadow-xs)', flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', marginRight: 4 }}>
                    <Filter size={14} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
                </div>

                {activeReport !== 'directory' && (
                    <SelectFilter label="Year" value={selectedYear} onChange={v => setSelectedYear(Number(v))}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </SelectFilter>
                )}

                {activeReport === 'attendance' && (
                    <SelectFilter label="Month" value={selectedMonth} onChange={v => setSelectedMonth(Number(v))}>
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </SelectFilter>
                )}

                <SelectFilter label="Department" value={selectedDepartment} onChange={setSelectedDepartment}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </SelectFilter>
            </div>

            {/* Report Content */}
            {isLoading ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: 80, gap: 12,
                    background: 'var(--bg-white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                }}>
                    <RefreshCw size={24} className="spinner" style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                        Generating report…
                    </span>
                </div>
            ) : (
                <>
                    {activeReport === 'attendance' && attendanceData && <AttendanceReportView data={attendanceData} />}
                    {activeReport === 'leaves' && leaveData && <LeaveReportView data={leaveData} />}
                    {activeReport === 'directory' && directoryData && <DirectoryReportView data={directoryData} />}
                </>
            )}
        </div>
    );
}

function AttendanceReportView({ data }: { data: AttendanceReportData }) {
    const summaryCards = [
        { label: 'Present Days', value: data.summary.presentDays, icon: UserCheck, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { label: 'Absent Days', value: data.summary.absentDays, icon: UserX, color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
        { label: 'Late Days', value: data.summary.lateDays, icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        { label: 'Avg. Work Hours', value: `${data.summary.averageWorkHours.toFixed(1)}h`, icon: TrendingUp, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="stat-cards-grid">
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

            <div className="table-wrapper">
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Employee Breakdown</span>
                </div>
                <table className="data-table">
                    <thead><tr>
                        <th>Employee</th><th>Department</th>
                        <th>Present</th><th>Late</th><th>Absent</th><th>Total Hours</th>
                    </tr></thead>
                    <tbody>
                        {data.employeeSummary.map(emp => (
                            <tr key={emp.employeeId}>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.employeeName}</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.employeeCode}</span>
                                    </div>
                                </td>
                                <td>{emp.department}</td>
                                <td><span className="badge badge-green">{emp.present}</span></td>
                                <td><span className="badge badge-amber">{emp.late}</span></td>
                                <td><span className="badge badge-red">{emp.absent}</span></td>
                                <td style={{ fontWeight: 600 }}>{emp.totalHours.toFixed(1)}h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LeaveReportView({ data }: { data: LeaveReportData }) {
    return (
        <div className="table-wrapper">
            <div style={{
                padding: '16px 20px 12px', borderBottom: '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Leave Summary — {data.year}</span>
                <span className="badge badge-blue">{data.totalRequests} total requests</span>
            </div>
            <table className="data-table">
                <thead><tr>
                    <th>Department</th><th>Total</th>
                    <th>Approved</th><th>Rejected</th><th>Pending</th><th>Total Days</th>
                </tr></thead>
                <tbody>
                    {data.departmentSummary.map(dept => (
                        <tr key={dept.departmentId}>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Building size={15} color="var(--text-muted)" />
                                    <span style={{ fontWeight: 600 }}>{dept.departmentName}</span>
                                </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>{dept.totalRequests}</td>
                            <td><span className="badge badge-green">{dept.approved}</span></td>
                            <td><span className="badge badge-red">{dept.rejected}</span></td>
                            <td><span className="badge badge-amber">{dept.pending}</span></td>
                            <td style={{ fontWeight: 600 }}>{dept.totalDays}d</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DirectoryReportView({ data }: { data: EmployeeDirectoryData }) {
    return (
        <div className="table-wrapper">
            <div style={{
                padding: '16px 20px 12px', borderBottom: '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Employee Directory</span>
                <span className="badge badge-teal">{data.totalEmployees} employees</span>
            </div>
            <table className="data-table">
                <thead><tr>
                    <th>Code</th><th>Name</th><th>Email</th>
                    <th>Department</th><th>Join Date</th><th>Status</th>
                </tr></thead>
                <tbody>
                    {data.employees.map((emp, i) => (
                        <tr key={i}>
                            <td>
                                <code style={{
                                    background: 'var(--bg-subtle)', padding: '3px 8px',
                                    borderRadius: 6, fontSize: 12, fontFamily: 'monospace',
                                    color: 'var(--primary)', fontWeight: 600,
                                }}>{emp.employeeCode}</code>
                            </td>
                            <td style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</td>
                            <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{emp.email}</td>
                            <td>{emp.department}</td>
                            <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                {new Date(emp.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td>
                                <span className={`badge ${STATUS_BADGE[emp.employmentStatus] || 'badge-gray'}`}>
                                    <span className="badge-dot" />
                                    {emp.employmentStatus.charAt(0).toUpperCase() + emp.employmentStatus.slice(1)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
