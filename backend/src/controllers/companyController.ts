import { Request, Response } from 'express';
import { Company } from '../models';
import { asyncHandler } from '../middleware/errorHandler';

// Get company profile
export const getCompany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;

    const company = await Company.findByPk(companyId);

    if (!company) {
        res.status(404).json({
            success: false,
            message: 'Company not found'
        });
        return;
    }

    res.status(200).json({
        success: true,
        data: company
    });
});

// Update company profile
export const updateCompany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;
    const updateData = req.body;

    const company = await Company.findByPk(companyId);

    if (!company) {
        res.status(404).json({
            success: false,
            message: 'Company not found'
        });
        return;
    }

    await company.update({
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        country: updateData.country,
        zipCode: updateData.zipCode,
        logo: updateData.logo,
        website: updateData.website,
        industry: updateData.industry,
        size: updateData.size
    });

    res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: company
    });
});

// Get company statistics
export const getCompanyStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;

    // Import models here to avoid circular dependency
    const { Employee, Department, Leave, Attendance } = require('../models');

    const totalEmployees = await Employee.count({ where: { companyId } });
    const activeEmployees = await Employee.count({ where: { companyId, employmentStatus: 'active' } });
    const totalDepartments = await Department.count({ where: { companyId } });

    // Get pending leaves
    const pendingLeaves = await Leave.count({ where: { companyId, status: 'pending' } });

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const presentToday = await Attendance.count({
        where: {
            companyId,
            date: today,
            status: ['present', 'late']
        }
    });

    res.status(200).json({
        success: true,
        data: {
            totalEmployees,
            activeEmployees,
            totalDepartments,
            pendingLeaves,
            presentToday,
            attendancePercentage: totalEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0
        }
    });
});

export default {
    getCompany,
    updateCompany,
    getCompanyStats
};
