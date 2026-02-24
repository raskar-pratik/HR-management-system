import { useState, useEffect, useCallback } from 'react';
import {
    FileText, Download, Filter, Calendar, Users,
    Clock, PieChart, TrendingUp, Building, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

type ReportType = 'attendance' | 'leaves' | 'directory';

interface AttendanceReportData {
    period: { from: string; to: string };
    summary: {
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        averageWorkHours: number;
    };
    employeeSummary: Array<{
        employeeId: string;
        employeeName: string;
        employeeCode: string;
        department: string;
        present: number;
        absent: number;
        late: number;
        totalHours: number;
    }>;
}

interface LeaveReportData {
    year: number;
    totalRequests: number;
    departmentSummary: Array<{
        departmentId: string;
        departmentName: string;
        totalRequests: number;
        approved: number;
        rejected: number;
        pending: number;
        totalDays: number;
    }>;
}

interface EmployeeDirectoryData {
    totalEmployees: number;
    employees: Array<{
        employeeCode: string;
        firstName: string;
        lastName: string;
        email: string;
        department: string;
        joinDate: string;
        employmentStatus: string;
    }>;
}

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<ReportType>('attendance');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

    // Report data
    const [attendanceData, setAttendanceData] = useState<AttendanceReportData | null>(null);
    const [leaveData, setLeaveData] = useState<LeaveReportData | null>(null);
    const [directoryData, setDirectoryData] = useState<EmployeeDirectoryData | null>(null);

    const loadDepartments = useCallback(async () => {
        try {
            const response = await api.getDepartments();
            setDepartments(response.data || []);
        } catch {
            console.error('Failed to load departments');
        }
    }, []);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    const loadReport = useCallback(async () => {
        setIsLoading(true);
        try {
            switch (activeReport) {
                case 'attendance': {
                    const attRes = await api.getAdminAttendanceReport({
                        month: selectedMonth,
                        year: selectedYear,
                        departmentId: selectedDepartment || undefined
                    });
                    setAttendanceData(attRes.data);
                    break;
                }
                case 'leaves': {
                    const leaveRes = await api.getLeaveSummaryReport({
                        year: selectedYear,
                        departmentId: selectedDepartment || undefined
                    });
                    setLeaveData(leaveRes.data);
                    break;
                }
                case 'directory': {
                    const dirRes = await api.getEmployeeDirectory({
                        departmentId: selectedDepartment || undefined
                    });
                    setDirectoryData(dirRes.data);
                    break;
                }
            }
        } catch {
            toast.error('Failed to load report');
        } finally {
            setIsLoading(false);
        }
    }, [activeReport, selectedMonth, selectedYear, selectedDepartment]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            let data: Blob;
            let filename: string;

            switch (activeReport) {
                case 'attendance':
                    data = await api.getAdminAttendanceReport({
                        month: selectedMonth,
                        year: selectedYear,
                        departmentId: selectedDepartment || undefined,
                        format: 'csv'
                    });
                    filename = `attendance_report_${selectedMonth}_${selectedYear}.csv`;
                    break;
                case 'leaves':
                    data = await api.getLeaveSummaryReport({
                        year: selectedYear,
                        departmentId: selectedDepartment || undefined,
                        format: 'csv'
                    });
                    filename = `leave_summary_${selectedYear}.csv`;
                    break;
                case 'directory':
                    data = await api.getEmployeeDirectory({
                        departmentId: selectedDepartment || undefined,
                        format: 'csv'
                    });
                    filename = 'employee_directory.csv';
                    break;
                default:
                    return;
            }

            api.downloadCSV(data, filename);
            toast.success('Report exported successfully!');
        } catch {
            toast.error('Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="reports-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1><FileText size={28} /> Reports</h1>
                    <p>Generate and export HR reports</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-refresh"
                        onClick={loadReport}
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
                        Refresh
                    </button>
                    <button
                        className="btn-export"
                        onClick={handleExportCSV}
                        disabled={isExporting}
                    >
                        <Download size={18} />
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* Report Type Tabs */}
            <div className="report-tabs">
                <button
                    className={`tab ${activeReport === 'attendance' ? 'active' : ''}`}
                    onClick={() => setActiveReport('attendance')}
                >
                    <Clock size={18} />
                    Attendance Report
                </button>
                <button
                    className={`tab ${activeReport === 'leaves' ? 'active' : ''}`}
                    onClick={() => setActiveReport('leaves')}
                >
                    <Calendar size={18} />
                    Leave Summary
                </button>
                <button
                    className={`tab ${activeReport === 'directory' ? 'active' : ''}`}
                    onClick={() => setActiveReport('directory')}
                >
                    <Users size={18} />
                    Employee Directory
                </button>
            </div>

            {/* Filters */}
            <div className="report-filters">
                <div className="filter-group">
                    <Filter size={18} />
                    <span>Filters:</span>
                </div>

                {(activeReport === 'attendance' || activeReport === 'leaves') && (
                    <div className="filter-item">
                        <label>Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                )}

                {activeReport === 'attendance' && (
                    <div className="filter-item">
                        <label>Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="filter-item">
                    <label>Department</label>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Report Content */}
            <div className="report-content">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading report...</p>
                    </div>
                ) : (
                    <>
                        {activeReport === 'attendance' && attendanceData && (
                            <AttendanceReportView data={attendanceData} />
                        )}
                        {activeReport === 'leaves' && leaveData && (
                            <LeaveReportView data={leaveData} />
                        )}
                        {activeReport === 'directory' && directoryData && (
                            <DirectoryReportView data={directoryData} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Attendance Report Component
function AttendanceReportView({ data }: { data: AttendanceReportData }) {
    return (
        <div className="attendance-report">
            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="card-icon present">
                        <TrendingUp size={24} />
                    </div>
                    <div className="card-info">
                        <h3>{data.summary.presentDays}</h3>
                        <p>Present Days</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="card-icon absent">
                        <Users size={24} />
                    </div>
                    <div className="card-info">
                        <h3>{data.summary.absentDays}</h3>
                        <p>Absent Days</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="card-icon late">
                        <Clock size={24} />
                    </div>
                    <div className="card-info">
                        <h3>{data.summary.lateDays}</h3>
                        <p>Late Days</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="card-icon hours">
                        <PieChart size={24} />
                    </div>
                    <div className="card-info">
                        <h3>{data.summary.averageWorkHours.toFixed(1)}h</h3>
                        <p>Avg. Work Hours</p>
                    </div>
                </div>
            </div>

            {/* Employee Summary Table */}
            <div className="report-table-container">
                <h3>Employee Summary</h3>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Late</th>
                            <th>Total Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.employeeSummary.map((emp) => (
                            <tr key={emp.employeeId}>
                                <td>
                                    <div className="employee-info">
                                        <span className="name">{emp.employeeName}</span>
                                        <span className="code">{emp.employeeCode}</span>
                                    </div>
                                </td>
                                <td>{emp.department}</td>
                                <td><span className="badge present">{emp.present}</span></td>
                                <td><span className="badge absent">{emp.absent}</span></td>
                                <td><span className="badge late">{emp.late}</span></td>
                                <td>{emp.totalHours.toFixed(1)}h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Leave Report Component
function LeaveReportView({ data }: { data: LeaveReportData }) {
    return (
        <div className="leave-report">
            <div className="report-header">
                <h3>Leave Summary - {data.year}</h3>
                <span className="total-badge">Total Requests: {data.totalRequests}</span>
            </div>

            <div className="report-table-container">
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Total Requests</th>
                            <th>Approved</th>
                            <th>Rejected</th>
                            <th>Pending</th>
                            <th>Total Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.departmentSummary.map((dept) => (
                            <tr key={dept.departmentId}>
                                <td>
                                    <div className="dept-cell">
                                        <Building size={16} />
                                        {dept.departmentName}
                                    </div>
                                </td>
                                <td>{dept.totalRequests}</td>
                                <td><span className="badge approved">{dept.approved}</span></td>
                                <td><span className="badge rejected">{dept.rejected}</span></td>
                                <td><span className="badge pending">{dept.pending}</span></td>
                                <td>{dept.totalDays} days</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Employee Directory Component
function DirectoryReportView({ data }: { data: EmployeeDirectoryData }) {
    return (
        <div className="directory-report">
            <div className="report-header">
                <h3>Employee Directory</h3>
                <span className="total-badge">Total Employees: {data.totalEmployees}</span>
            </div>

            <div className="report-table-container">
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Join Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.employees.map((emp, idx) => (
                            <tr key={idx}>
                                <td><span className="emp-code">{emp.employeeCode}</span></td>
                                <td>{emp.firstName} {emp.lastName}</td>
                                <td>{emp.email}</td>
                                <td>{emp.department}</td>
                                <td>{new Date(emp.joinDate).toLocaleDateString()}</td>
                                <td>
                                    <span className={`status-badge ${emp.employmentStatus}`}>
                                        {emp.employmentStatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
