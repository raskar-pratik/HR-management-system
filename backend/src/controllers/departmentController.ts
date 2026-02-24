import { Request, Response } from 'express';
import { Department, Employee, User } from '../models';
import { asyncHandler } from '../middleware/errorHandler';

// Get all departments
export const getAllDepartments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;

    const departments = await Department.findAll({
        where: { companyId },
        include: [
            {
                model: Employee,
                as: 'manager',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
            },
            {
                model: Department,
                as: 'parent',
                attributes: ['id', 'name']
            }
        ],
        order: [['name', 'ASC']]
    });

    res.status(200).json({
        success: true,
        data: departments
    });
});

// Get single department
export const getDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = req.companyId;

    const department = await Department.findOne({
        where: { id, companyId },
        include: [
            {
                model: Employee,
                as: 'manager',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
            },
            {
                model: Employee,
                as: 'employees',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
            }
        ]
    });

    if (!department) {
        res.status(404).json({
            success: false,
            message: 'Department not found'
        });
        return;
    }

    res.status(200).json({
        success: true,
        data: department
    });
});

// Create department
export const createDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const { name, description, managerId, parentId } = req.body;

    // Check for duplicate name
    const existing = await Department.findOne({
        where: { companyId, name }
    });

    if (existing) {
        res.status(400).json({
            success: false,
            message: 'Department with this name already exists'
        });
        return;
    }

    const department = await Department.create({
        companyId,
        name,
        description,
        managerId: managerId || null,
        parentId: parentId || null,
        isActive: true
    });

    res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department
    });
});

// Update department
export const updateDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = req.companyId;
    const { name, description, managerId, parentId, isActive } = req.body;

    const department = await Department.findOne({ where: { id, companyId } });

    if (!department) {
        res.status(404).json({
            success: false,
            message: 'Department not found'
        });
        return;
    }

    await department.update({
        name,
        description,
        managerId,
        parentId,
        isActive
    });

    res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: department
    });
});

// Delete department
export const deleteDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = req.companyId;

    const department = await Department.findOne({ where: { id, companyId } });

    if (!department) {
        res.status(404).json({
            success: false,
            message: 'Department not found'
        });
        return;
    }

    // Check if department has employees
    const employeeCount = await Employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
        res.status(400).json({
            success: false,
            message: `Cannot delete department with ${employeeCount} employees. Please reassign employees first.`
        });
        return;
    }

    await department.destroy();

    res.status(200).json({
        success: true,
        message: 'Department deleted successfully'
    });
});

export default {
    getAllDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment
};
