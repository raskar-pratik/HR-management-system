import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Attendance, Employee, User } from '../models';
import { asyncHandler } from '../middleware/errorHandler';

// Clock In
export const clockIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const userId = req.user.id;

    // Get employee record
    const employee = await Employee.findOne({ where: { userId, companyId } });
    if (!employee) {
        res.status(404).json({
            success: false,
            message: 'Employee record not found'
        });
        return;
    }

    // Check if already clocked in today
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = await Attendance.findOne({
        where: {
            employeeId: employee.id,
            date: today
        }
    });

    if (existingAttendance && existingAttendance.clockIn) {
        res.status(400).json({
            success: false,
            message: 'Already clocked in today'
        });
        return;
    }

    // Create or update attendance record
    const now = new Date();
    const clockInTime = now;

    // Determine if late (assuming 9 AM is start time)
    const startHour = 9;
    const isLate = now.getHours() > startHour || (now.getHours() === startHour && now.getMinutes() > 0);

    if (existingAttendance) {
        await existingAttendance.update({
            clockIn: clockInTime,
            status: isLate ? 'late' : 'present',
            ipAddress: req.ip
        });
    } else {
        await Attendance.create({
            companyId,
            employeeId: employee.id,
            date: today,
            clockIn: clockInTime,
            status: isLate ? 'late' : 'present',
            ipAddress: req.ip
        });
    }

    res.status(200).json({
        success: true,
        message: 'Clocked in successfully',
        data: {
            clockIn: clockInTime,
            isLate
        }
    });
});

// Clock Out
export const clockOut = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const userId = req.user.id;

    // Get employee record
    const employee = await Employee.findOne({ where: { userId, companyId } });
    if (!employee) {
        res.status(404).json({
            success: false,
            message: 'Employee record not found'
        });
        return;
    }

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({
        where: {
            employeeId: employee.id,
            date: today
        }
    });

    if (!attendance || !attendance.clockIn) {
        res.status(400).json({
            success: false,
            message: 'You have not clocked in today'
        });
        return;
    }

    if (attendance.clockOut) {
        res.status(400).json({
            success: false,
            message: 'Already clocked out today'
        });
        return;
    }

    // Calculate work hours
    const clockOutTime = new Date();
    const clockInTime = new Date(attendance.clockIn);
    const workHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    await attendance.update({
        clockOut: clockOutTime,
        workHours: Math.round(workHours * 100) / 100
    });

    res.status(200).json({
        success: true,
        message: 'Clocked out successfully',
        data: {
            clockIn: attendance.clockIn,
            clockOut: clockOutTime,
            workHours: Math.round(workHours * 100) / 100
        }
    });
});

// Get today's attendance status
export const getTodayStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const userId = req.user.id;

    const employee = await Employee.findOne({ where: { userId, companyId } });
    if (!employee) {
        res.status(404).json({
            success: false,
            message: 'Employee record not found'
        });
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({
        where: {
            employeeId: employee.id,
            date: today
        }
    });

    res.status(200).json({
        success: true,
        data: {
            date: today,
            clockIn: attendance?.clockIn || null,
            clockOut: attendance?.clockOut || null,
            workHours: attendance?.workHours || null,
            status: attendance?.status || 'not_marked'
        }
    });
});

// Get attendance report
export const getAttendanceReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const { startDate, endDate, employeeId, page = 1, limit = 10 } = req.query;

    const whereClause: any = { companyId };

    if (startDate && endDate) {
        whereClause.date = {
            [Op.between]: [startDate, endDate]
        };
    }

    if (employeeId) {
        whereClause.employeeId = employeeId;
    }

    // For non-admin users, only show their own attendance
    if (req.user.role === 'employee') {
        const employee = await Employee.findOne({ where: { userId: req.user.id } });
        if (employee) {
            whereClause.employeeId = employee.id;
        }
    }

    const total = await Attendance.count({ where: whereClause });
    const offset = (Number(page) - 1) * Number(limit);

    const attendances = await Attendance.findAll({
        where: whereClause,
        include: [
            {
                model: Employee,
                as: 'employee',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
            }
        ],
        limit: Number(limit),
        offset,
        order: [['date', 'DESC']]
    });

    res.status(200).json({
        success: true,
        data: {
            attendances,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get monthly summary
export const getMonthlySummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const userId = req.user.id;
    const { month, year } = req.query;

    const employee = await Employee.findOne({ where: { userId, companyId } });
    if (!employee) {
        res.status(404).json({
            success: false,
            message: 'Employee record not found'
        });
        return;
    }

    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const attendances = await Attendance.findAll({
        where: {
            employeeId: employee.id,
            date: {
                [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
            }
        }
    });

    const summary = {
        totalDays: endDate.getDate(),
        present: attendances.filter(a => a.status === 'present').length,
        late: attendances.filter(a => a.status === 'late').length,
        absent: attendances.filter(a => a.status === 'absent').length,
        onLeave: attendances.filter(a => a.status === 'on_leave').length,
        halfDay: attendances.filter(a => a.status === 'half_day').length,
        totalWorkHours: attendances.reduce((sum, a) => sum + (Number(a.workHours) || 0), 0)
    };

    res.status(200).json({
        success: true,
        data: {
            month: currentMonth,
            year: currentYear,
            summary,
            attendances
        }
    });
});

export default {
    clockIn,
    clockOut,
    getTodayStatus,
    getAttendanceReport,
    getMonthlySummary
};
