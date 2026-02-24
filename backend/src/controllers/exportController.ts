import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Employee, User, Department, Designation, Attendance, Leave } from '../models';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';

// Export Employees to Excel
export const exportEmployees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;
    const { departmentId, status } = req.query;

    const whereClause: any = { companyId };
    if (departmentId) whereClause.departmentId = departmentId;
    if (status) whereClause.employmentStatus = status;

    const employees = await Employee.findAll({
        where: whereClause,
        include: [
            { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phone'] },
            { model: Department, as: 'department', attributes: ['name'] },
            { model: Designation, as: 'designation', attributes: ['name'] }
        ]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees');

    worksheet.columns = [
        { header: 'Employee Code', key: 'code', width: 15 },
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Designation', key: 'designation', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Join Date', key: 'joinDate', width: 15 },
    ];

    employees.forEach(emp => {
        const user = (emp as any).user;
        worksheet.addRow({
            code: emp.employeeCode,
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email,
            phone: user?.phone,
            department: (emp as any).department?.name || 'N/A',
            designation: (emp as any).designation?.name || 'N/A',
            status: emp.employmentStatus,
            joinDate: emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A'
        });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');

    await workbook.xlsx.write(res);
    res.end();
});

// Export Attendance to PDF
// Placeholder - to be implemented next
// Export Attendance to PDF
export const exportAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;
    const { startDate, endDate, departmentId } = req.query;

    const whereClause: any = { companyId };

    if (startDate && endDate) {
        whereClause.date = {
            [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    if (startDate && endDate) {
        doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
        doc.moveDown();
    }

    // Include data
    const attendances = await Attendance.findAll({
        where: whereClause,
        include: [{ model: Employee, as: 'employee', include: [{ model: User, as: 'user' }] }],
        limit: 100 // Limit for PDF performance
    });

    attendances.forEach(att => {
        const empName = (att as any).employee?.user ? `${(att as any).employee.user.firstName} ${(att as any).employee.user.lastName}` : 'Unknown';
        doc.fontSize(10).text(`${empName} - ${att.date} - ${att.status} - In: ${att.clockIn || 'N/A'} - Out: ${att.clockOut || 'N/A'}`);
    });

    doc.end();
});

// Export Leaves to Excel
export const exportLeaves = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;
    const { startDate, endDate, status } = req.query;

    const whereClause: any = { companyId };

    if (status) whereClause.status = status;
    if (startDate && endDate) {
        whereClause.startDate = { [Op.gte]: new Date(startDate as string) };
        whereClause.endDate = { [Op.lte]: new Date(endDate as string) };
    }

    const leaves = await Leave.findAll({
        where: whereClause,
        include: [
            {
                model: Employee,
                as: 'employee',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
            }
        ]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leaves');

    worksheet.columns = [
        { header: 'Employee', key: 'employee', width: 25 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Days', key: 'days', width: 10 },
        { header: 'Reason', key: 'reason', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
    ];

    leaves.forEach((leave: any) => {
        const empName = leave.employee?.user ? `${leave.employee.user.firstName} ${leave.employee.user.lastName}` : 'Unknown';
        worksheet.addRow({
            employee: empName,
            type: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
            days: leave.totalDays,
            reason: leave.reason,
            status: leave.status
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leaves.xlsx');

    await workbook.xlsx.write(res);
    res.end();
});

export default {
    exportEmployees,
    exportAttendance,
    exportLeaves
};
