import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuditLog, User } from '../models';
import { Op } from 'sequelize';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;
    const { page = 1, limit = 20, entity, action, userId, startDate, endDate } = req.query;

    const whereClause: any = { companyId };

    if (entity) whereClause.entity = entity;
    if (action) whereClause.action = action;
    if (userId) whereClause.userId = userId;

    if (startDate && endDate) {
        whereClause.createdAt = {
            [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await AuditLog.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
    });

    res.status(200).json({
        success: true,
        data: {
            logs: rows,
            pagination: {
                total: count,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(count / Number(limit))
            }
        }
    });
});

export const getAuditLogStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;

    // Recent activity count
    const recentCount = await AuditLog.count({
        where: {
            companyId,
            createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
    });

    res.status(200).json({
        success: true,
        data: {
            recentActivity24h: recentCount
        }
    });
});
