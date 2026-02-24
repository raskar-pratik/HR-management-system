import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Attendance, Employee, User, Department, Leave } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import sequelize from '../config/database';

// ==================== ATTENDANCE REPORTS ====================

/**
 * Get attendance report with filters
 * Supports: monthly, yearly, custom date range, department filter
 */
export const getAttendanceReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const {
        startDate,
        endDate,
        month,
        year,
        departmentId,
        employeeId,
        format = 'json' // 'json' or 'csv'
    } = req.query;

    // Build date range
    let dateFrom: string;
    let dateTo: string;

    if (startDate && endDate) {
        // Custom date range
        dateFrom = startDate as string;
        dateTo = endDate as string;
    } else if (month && year) {
        // Monthly report
        const m = parseInt(month as string);
        const y = parseInt(year as string);
        dateFrom = `${y}-${m.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        dateTo = `${y}-${m.toString().padStart(2, '0')}-${lastDay}`;
    } else if (year) {
        // Yearly report
        const y = parseInt(year as string);
        dateFrom = `${y}-01-01`;
        dateTo = `${y}-12-31`;
    } else {
        // Default: current month
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        dateFrom = `${y}-${m.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        dateTo = `${y}-${m.toString().padStart(2, '0')}-${lastDay}`;
    }

    // Build employee filter
    const employeeWhere: Record<string, unknown> = { companyId };
    if (departmentId) {
        employeeWhere.departmentId = departmentId;
    }
    if (employeeId) {
        employeeWhere.id = employeeId;
    }

    // Get attendance data with employee info
    const attendanceData = await Attendance.findAll({
        where: {
            companyId,
            date: {
                [Op.between]: [dateFrom, dateTo]
            }
        },
        include: [{
            model: Employee,
            as: 'employee',
            where: employeeWhere,
            required: true,
            include: [
                { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] },
                { model: Department, as: 'department', attributes: ['name'] }
            ]
        }],
        order: [['date', 'ASC'], ['createdAt', 'ASC']]
    });

    // Calculate summary statistics
    const summary = {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        leaveDays: 0,
        totalWorkHours: 0,
        averageWorkHours: 0
    };

    const employeeSummary: Record<string, {
        employeeId: string;
        employeeName: string;
        employeeCode: string;
        department: string;
        present: number;
        absent: number;
        late: number;
        halfDay: number;
        leave: number;
        totalHours: number;
    }> = {};

    attendanceData.forEach((record: any) => {
        summary.totalDays++;
        summary.totalWorkHours += record.workHours || 0;

        const empId = record.employee.id;
        if (!employeeSummary[empId]) {
            employeeSummary[empId] = {
                employeeId: empId,
                employeeName: `${record.employee.user.firstName} ${record.employee.user.lastName}`,
                employeeCode: record.employee.employeeCode,
                department: record.employee.department?.name || 'N/A',
                present: 0,
                absent: 0,
                late: 0,
                halfDay: 0,
                leave: 0,
                totalHours: 0
            };
        }

        switch (record.status) {
            case 'present':
                summary.presentDays++;
                employeeSummary[empId].present++;
                break;
            case 'absent':
                summary.absentDays++;
                employeeSummary[empId].absent++;
                break;
            case 'late':
                summary.lateDays++;
                employeeSummary[empId].late++;
                break;
            case 'half_day':
                summary.halfDays++;
                employeeSummary[empId].halfDay++;
                break;
            case 'on_leave':
                summary.leaveDays++;
                employeeSummary[empId].leave++;
                break;
        }

        employeeSummary[empId].totalHours += record.workHours || 0;
    });

    summary.averageWorkHours = summary.totalDays > 0
        ? Math.round((summary.totalWorkHours / summary.totalDays) * 100) / 100
        : 0;

    // Format response based on requested format
    if (format === 'csv') {
        const csvData = generateAttendanceCSV(attendanceData, Object.values(employeeSummary));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${dateFrom}_to_${dateTo}.csv`);
        res.send(csvData);
        return;
    }

    res.json({
        success: true,
        data: {
            period: { from: dateFrom, to: dateTo },
            summary,
            employeeSummary: Object.values(employeeSummary),
            details: attendanceData.map((record: any) => ({
                date: record.date,
                employeeId: record.employee.id,
                employeeName: `${record.employee.user.firstName} ${record.employee.user.lastName}`,
                employeeCode: record.employee.employeeCode,
                department: record.employee.department?.name || 'N/A',
                clockIn: record.clockIn,
                clockOut: record.clockOut,
                workHours: record.workHours,
                status: record.status,
                notes: record.notes
            }))
        }
    });
});

// ==================== LEAVE REPORTS ====================

/**
 * Get leave summary report by department
 */
export const getLeaveSummaryReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const { year, departmentId, format = 'json' } = req.query;

    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Get leave data with employee and department info
    const leaveData = await Leave.findAll({
        where: {
            companyId,
            startDate: {
                [Op.gte]: `${reportYear}-01-01`
            },
            endDate: {
                [Op.lte]: `${reportYear}-12-31`
            }
        },
        include: [{
            model: Employee,
            as: 'employee',
            where: departmentId ? { departmentId } : {},
            required: true,
            include: [
                { model: User, as: 'user', attributes: ['firstName', 'lastName'] },
                { model: Department, as: 'department', attributes: ['id', 'name'] }
            ]
        }],
        order: [['startDate', 'DESC']]
    });

    // Group by department
    const departmentSummary: Record<string, {
        departmentId: string;
        departmentName: string;
        totalRequests: number;
        approved: number;
        rejected: number;
        pending: number;
        totalDays: number;
        byType: Record<string, number>;
    }> = {};

    leaveData.forEach((leave: any) => {
        const deptId = leave.employee.department?.id || 'unassigned';
        const deptName = leave.employee.department?.name || 'Unassigned';

        if (!departmentSummary[deptId]) {
            departmentSummary[deptId] = {
                departmentId: deptId,
                departmentName: deptName,
                totalRequests: 0,
                approved: 0,
                rejected: 0,
                pending: 0,
                totalDays: 0,
                byType: {}
            };
        }

        departmentSummary[deptId].totalRequests++;
        departmentSummary[deptId].totalDays += leave.totalDays || 0;

        // Count by status
        switch (leave.status) {
            case 'approved':
                departmentSummary[deptId].approved++;
                break;
            case 'rejected':
                departmentSummary[deptId].rejected++;
                break;
            case 'pending':
                departmentSummary[deptId].pending++;
                break;
        }

        // Count by type
        const leaveType = leave.leaveType;
        if (!departmentSummary[deptId].byType[leaveType]) {
            departmentSummary[deptId].byType[leaveType] = 0;
        }
        departmentSummary[deptId].byType[leaveType]++;
    });

    if (format === 'csv') {
        const csvData = generateLeaveSummaryCSV(Object.values(departmentSummary));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=leave_summary_${reportYear}.csv`);
        res.send(csvData);
        return;
    }

    res.json({
        success: true,
        data: {
            year: reportYear,
            departmentSummary: Object.values(departmentSummary),
            totalRequests: leaveData.length,
            details: leaveData.map((leave: any) => ({
                id: leave.id,
                employeeName: `${leave.employee.user.firstName} ${leave.employee.user.lastName}`,
                department: leave.employee.department?.name || 'N/A',
                leaveType: leave.leaveType,
                startDate: leave.startDate,
                endDate: leave.endDate,
                totalDays: leave.totalDays,
                status: leave.status,
                reason: leave.reason
            }))
        }
    });
});

// ==================== EMPLOYEE DIRECTORY ====================

/**
 * Export employee directory
 */
export const getEmployeeDirectory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const { departmentId, status, format = 'json' } = req.query;

    const where: Record<string, unknown> = { companyId };
    if (departmentId) where.departmentId = departmentId;
    if (status) where.employmentStatus = status;

    const employees = await Employee.findAll({
        where,
        include: [
            { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phone'] },
            { model: Department, as: 'department', attributes: ['name'] },
            {
                model: Employee,
                as: 'manager',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
            }
        ],
        order: [[{ model: User, as: 'user' }, 'firstName', 'ASC']]
    });

    const directoryData = employees.map((emp: any) => ({
        employeeCode: emp.employeeCode,
        firstName: emp.user.firstName,
        lastName: emp.user.lastName,
        email: emp.user.email,
        phone: emp.user.phone || 'N/A',
        department: emp.department?.name || 'N/A',
        designation: emp.designation?.name || 'N/A',
        manager: emp.manager ? `${emp.manager.user.firstName} ${emp.manager.user.lastName}` : 'N/A',
        joinDate: emp.joinDate,
        employmentType: emp.employmentType,
        employmentStatus: emp.employmentStatus
    }));

    if (format === 'csv') {
        const csvData = generateEmployeeDirectoryCSV(directoryData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=employee_directory.csv');
        res.send(csvData);
        return;
    }

    res.json({
        success: true,
        data: {
            totalEmployees: employees.length,
            employees: directoryData
        }
    });
});

// ==================== DASHBOARD STATISTICS ====================

/**
 * Get report dashboard with key metrics
 */
export const getReportDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const today = now.toISOString().split('T')[0];

    // Today's attendance
    const todayAttendance = await Attendance.count({
        where: { companyId, date: today, status: { [Op.in]: ['present', 'late'] } }
    });

    // Total active employees
    const totalEmployees = await Employee.count({
        where: { companyId, employmentStatus: 'active' }
    });

    // Pending leaves
    const pendingLeaves = await Leave.count({
        where: { companyId, status: 'pending' }
    });

    // This month's attendance rate
    const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const monthAttendance = await Attendance.count({
        where: {
            companyId,
            date: { [Op.gte]: monthStart },
            status: { [Op.in]: ['present', 'late'] }
        }
    });

    const workingDays = Math.min(now.getDate(), 22); // Approximate
    const expectedAttendance = totalEmployees * workingDays;
    const attendanceRate = expectedAttendance > 0
        ? Math.round((monthAttendance / expectedAttendance) * 100)
        : 0;

    res.json({
        success: true,
        data: {
            todayAttendance,
            totalEmployees,
            attendanceRate,
            pendingLeaves,
            month: currentMonth,
            year: currentYear
        }
    });
});

// ==================== CSV GENERATORS ====================

function generateAttendanceCSV(details: any[], summary: any[]): string {
    let csv = 'ATTENDANCE REPORT\n\n';

    // Summary section
    csv += 'EMPLOYEE SUMMARY\n';
    csv += 'Employee Code,Employee Name,Department,Present,Absent,Late,Half Day,Leave,Total Hours\n';
    summary.forEach(emp => {
        csv += `${emp.employeeCode},${emp.employeeName},${emp.department},${emp.present},${emp.absent},${emp.late},${emp.halfDay},${emp.leave},${emp.totalHours.toFixed(2)}\n`;
    });

    csv += '\nDETAILED RECORDS\n';
    csv += 'Date,Employee Code,Employee Name,Department,Clock In,Clock Out,Work Hours,Status,Notes\n';
    details.forEach((record: any) => {
        const emp = record.employee;
        csv += `${record.date},${emp.employeeCode},"${emp.user.firstName} ${emp.user.lastName}",${emp.department?.name || 'N/A'},${record.clockIn || 'N/A'},${record.clockOut || 'N/A'},${record.workHours || 0},${record.status},${record.notes || ''}\n`;
    });

    return csv;
}

function generateLeaveSummaryCSV(departments: any[]): string {
    let csv = 'LEAVE SUMMARY BY DEPARTMENT\n\n';
    csv += 'Department,Total Requests,Approved,Rejected,Pending,Total Days\n';

    departments.forEach(dept => {
        csv += `${dept.departmentName},${dept.totalRequests},${dept.approved},${dept.rejected},${dept.pending},${dept.totalDays}\n`;
    });

    return csv;
}

function generateEmployeeDirectoryCSV(employees: any[]): string {
    let csv = 'EMPLOYEE DIRECTORY\n\n';
    csv += 'Employee Code,First Name,Last Name,Email,Phone,Department,Manager,Join Date,Employment Type,Status\n';

    employees.forEach(emp => {
        csv += `${emp.employeeCode},${emp.firstName},${emp.lastName},${emp.email},${emp.phone},${emp.department},${emp.manager},${emp.joinDate},${emp.employmentType},${emp.employmentStatus}\n`;
    });

    return csv;
}

export default {
    getAttendanceReport,
    getLeaveSummaryReport,
    getEmployeeDirectory,
    getReportDashboard
};
