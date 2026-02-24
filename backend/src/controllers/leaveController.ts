import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Leave, Employee, User } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { sendLeaveApplicationNotification, sendLeaveStatusNotification } from '../services/emailService';

// Apply for leave
export const applyLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = (req as any).companyId!;
    const userId = (req as any).user.id;
    const { leaveType, startDate, endDate, reason } = req.body;

    // Get employee with user details and manager
    const employee = await Employee.findOne({
        where: { userId, companyId },
        include: [
            { model: User, as: 'user' },
            {
                model: Employee,
                as: 'manager',
                include: [{ model: User, as: 'user' }]
            }
        ]
    });

    if (!employee) {
        res.status(404).json({
            success: false,
            message: 'Employee record not found'
        });
        return;
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
        where: {
            employeeId: employee.id,
            status: { [Op.in]: ['pending', 'approved'] },
            [Op.or]: [
                {
                    startDate: { [Op.between]: [startDate, endDate] }
                },
                {
                    endDate: { [Op.between]: [startDate, endDate] }
                },
                {
                    [Op.and]: [
                        { startDate: { [Op.lte]: startDate } },
                        { endDate: { [Op.gte]: endDate } }
                    ]
                }
            ]
        }
    });

    if (overlapping) {
        res.status(400).json({
            success: false,
            message: 'Leave overlaps with an existing leave application'
        });
        return;
    }

    // Create leave application
    const leave = await Leave.create({
        companyId,
        employeeId: employee.id,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        status: 'pending'
    });

    // Send email notification to manager (if exists) or company admin
    if ((employee as any).manager && (employee as any).manager.user) {
        await sendLeaveApplicationNotification((employee as any).user, leave, (employee as any).manager.user.email);
    }

    res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        data: leave
    });
});

// ... getAllLeaves and getLeave ...

// Approve leave
export const approveLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = (req as any).companyId;
    const { comments } = req.body;
    const userId = (req as any).user.id;

    // Find leave with employee details
    const leave = await Leave.findOne({
        where: { id, companyId },
        include: [
            {
                model: Employee,
                as: 'employee',
                include: [{ model: User, as: 'user' }]
            }
        ]
    });

    if (!leave) {
        res.status(404).json({
            success: false,
            message: 'Leave not found'
        });
        return;
    }

    if (leave.status !== 'pending') {
        res.status(400).json({
            success: false,
            message: 'Leave has already been processed'
        });
        return;
    }

    // Get approver employee ID
    const approverEmployee = await Employee.findOne({
        where: { userId },
        include: [{ model: User, as: 'user' }]
    });

    await leave.update({
        status: 'approved',
        approverId: approverEmployee?.id,
        approverComments: comments,
        approvedAt: new Date()
    });

    // Send notification to applicant
    if ((leave as any).employee && (leave as any).employee.user && approverEmployee) {
        await sendLeaveStatusNotification(
            (leave as any).employee.user,
            leave,
            'approved',
            (approverEmployee as any).user
        );
    }

    res.status(200).json({
        success: true,
        message: 'Leave approved successfully',
        data: leave
    });
});

// Reject leave
export const rejectLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = (req as any).companyId;
    const { comments } = req.body;
    const userId = (req as any).user.id;

    const leave = await Leave.findOne({
        where: { id, companyId },
        include: [
            {
                model: Employee,
                as: 'employee',
                include: [{ model: User, as: 'user' }]
            }
        ]
    });

    if (!leave) {
        res.status(404).json({
            success: false,
            message: 'Leave not found'
        });
        return;
    }

    if (leave.status !== 'pending') {
        res.status(400).json({
            success: false,
            message: 'Leave has already been processed'
        });
        return;
    }

    const approverEmployee = await Employee.findOne({
        where: { userId },
        include: [{ model: User, as: 'user' }]
    });

    await leave.update({
        status: 'rejected',
        approverId: approverEmployee?.id,
        approverComments: comments,
        approvedAt: new Date()
    });

    // Send notification to applicant
    if ((leave as any).employee && (leave as any).employee.user && approverEmployee) {
        await sendLeaveStatusNotification(
            (leave as any).employee.user,
            leave,
            'rejected',
            (approverEmployee as any).user
        );
    }

    res.status(200).json({
        success: true,
        message: 'Leave rejected',
        data: leave
    });
});

// Get all leaves (with filters)
export const getAllLeaves = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const { status, employeeId, leaveType, startDate, endDate, page = 1, limit = 10 } = req.query;

    const whereClause: any = { companyId };

    if (status) whereClause.status = status;
    if (leaveType) whereClause.leaveType = leaveType;
    if (employeeId) whereClause.employeeId = employeeId;

    if (startDate && endDate) {
        whereClause.startDate = {
            [Op.between]: [startDate, endDate]
        };
    }

    // For regular employees, only show their own leaves
    if (req.user.role === 'employee') {
        const employee = await Employee.findOne({ where: { userId: req.user.id } });
        if (employee) {
            whereClause.employeeId = employee.id;
        }
    }

    const total = await Leave.count({ where: whereClause });
    const offset = (Number(page) - 1) * Number(limit);

    const leaves = await Leave.findAll({
        where: whereClause,
        include: [
            {
                model: Employee,
                as: 'employee',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
            },
            {
                model: Employee,
                as: 'approver',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
            }
        ],
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        data: {
            leaves,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single leave
export const getLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = req.companyId;

    const leave = await Leave.findOne({
        where: { id, companyId },
        include: [
            {
                model: Employee,
                as: 'employee',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
            },
            {
                model: Employee,
                as: 'approver',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
            }
        ]
    });

    if (!leave) {
        res.status(404).json({
            success: false,
            message: 'Leave not found'
        });
        return;
    }

    res.status(200).json({
        success: true,
        data: leave
    });
});



// Cancel leave
export const cancelLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = req.companyId;
    const userId = req.user.id;

    const employee = await Employee.findOne({ where: { userId, companyId } });
    const leave = await Leave.findOne({ where: { id, companyId, employeeId: employee?.id } });

    if (!leave) {
        res.status(404).json({
            success: false,
            message: 'Leave not found'
        });
        return;
    }

    if (leave.status !== 'pending') {
        res.status(400).json({
            success: false,
            message: 'Can only cancel pending leaves'
        });
        return;
    }

    await leave.update({ status: 'cancelled' });

    res.status(200).json({
        success: true,
        message: 'Leave cancelled successfully',
        data: leave
    });
});

// Get leave balance
export const getLeaveBalance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

    // Get current year leaves
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const leaves = await Leave.findAll({
        where: {
            employeeId: employee.id,
            status: 'approved',
            startDate: {
                [Op.between]: [startOfYear, endOfYear]
            }
        }
    });

    // Default leave entitlements (can be customized per company)
    const entitlements = {
        sick: 12,
        casual: 12,
        earned: 15,
        maternity: 180,
        paternity: 15,
        unpaid: 0
    };

    const used = {
        sick: 0,
        casual: 0,
        earned: 0,
        maternity: 0,
        paternity: 0,
        unpaid: 0
    };

    leaves.forEach(leave => {
        if (leave.leaveType in used) {
            (used as any)[leave.leaveType] += Number(leave.totalDays);
        }
    });

    const balance = {
        sick: entitlements.sick - used.sick,
        casual: entitlements.casual - used.casual,
        earned: entitlements.earned - used.earned,
        maternity: entitlements.maternity - used.maternity,
        paternity: entitlements.paternity - used.paternity
    };

    res.status(200).json({
        success: true,
        data: {
            entitlements,
            used,
            balance
        }
    });
});

export default {
    applyLeave,
    getAllLeaves,
    getLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    getLeaveBalance
};
