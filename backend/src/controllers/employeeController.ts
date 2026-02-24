import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Employee, User, Department, Designation, Company } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { sendWelcomeEmail } from '../services/emailService';

// Get all employees (with filters and pagination)
export const getAllEmployees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;
    const {
        page = 1,
        limit = 10,
        search,
        departmentId,
        designationId,
        status,
        employmentType
    } = req.query;

    // Build where clause
    const whereClause: any = { companyId };

    if (status) {
        whereClause.employmentStatus = status;
    }

    if (employmentType) {
        whereClause.employmentType = employmentType;
    }

    if (departmentId) {
        whereClause.departmentId = departmentId;
    }

    if (designationId) {
        whereClause.designationId = designationId;
    }

    // Include user for search
    const includeClause: any[] = [
        {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'avatar', 'role', 'isActive'],
            where: search ? {
                [Op.or]: [
                    { firstName: { [Op.like]: `%${search}%` } },
                    { lastName: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } }
                ]
            } : undefined
        },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Designation, as: 'designation', attributes: ['id', 'name'] }
    ];

    // Get total count
    const total = await Employee.count({
        where: whereClause,
        include: search ? [{
            model: User, as: 'user', where: {
                [Op.or]: [
                    { firstName: { [Op.like]: `%${search}%` } },
                    { lastName: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } }
                ]
            }
        }] : []
    });

    // Get employees with pagination
    const offset = (Number(page) - 1) * Number(limit);
    const employees = await Employee.findAll({
        where: whereClause,
        include: includeClause,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        data: {
            employees,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single employee by ID
export const getEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = req.companyId;

    const employee = await Employee.findOne({
        where: { id, companyId },
        include: [
            { model: User, as: 'user', attributes: { exclude: ['password'] } },
            { model: Department, as: 'department' },
            { model: Designation, as: 'designation' },
            { model: Employee, as: 'manager', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }] }
        ]
    });

    if (!employee) {
        res.status(404).json({
            success: false,
            message: 'Employee not found'
        });
        return;
    }

    res.status(200).json({
        success: true,
        data: employee
    });
});

// Create new employee
export const createEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId!;
    const {
        email,
        password,
        firstName,
        lastName,
        phone,
        departmentId,
        designationId,
        managerId,
        dateOfBirth,
        gender,
        joinDate,
        employmentType,
        role = 'employee'
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        res.status(400).json({
            success: false,
            message: 'Email already registered'
        });
        return;
    }

    // Create user
    const newUser = await User.create({
        companyId,
        email,
        password: password || 'Welcome@123', // Default password
        firstName,
        lastName,
        phone,
        role,
        isActive: true,
        isEmailVerified: false
    });

    // Send welcome email
    try {
        await sendWelcomeEmail(newUser, password || 'Welcome@123');
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }

    // Generate employee code
    const employeeCount = await Employee.count({ where: { companyId } });
    const employeeCode = `EMP-${String(employeeCount + 1).padStart(5, '0')}`;

    // Create employee
    const newEmployee = await Employee.create({
        companyId,
        userId: newUser.id,
        employeeCode,
        departmentId: departmentId || null,
        designationId: designationId || null,
        managerId: managerId || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        joinDate: joinDate || new Date(),
        employmentType: employmentType || 'full_time',
        employmentStatus: 'active'
    });

    // Fetch complete employee data
    const employee = await Employee.findByPk(newEmployee.id, {
        include: [
            { model: User, as: 'user', attributes: { exclude: ['password'] } },
            { model: Department, as: 'department' },
            { model: Designation, as: 'designation' }
        ]
    });

    res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee
    });
});

// Update employee
export const updateEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = req.companyId;
    const updateData = req.body;

    const employee = await Employee.findOne({
        where: { id, companyId },
        include: [{ model: User, as: 'user' }]
    });

    if (!employee) {
        res.status(404).json({
            success: false,
            message: 'Employee not found'
        });
        return;
    }

    // Update user fields if provided
    if (updateData.firstName || updateData.lastName || updateData.phone) {
        await User.update({
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            phone: updateData.phone
        }, { where: { id: employee.userId } });
    }

    // Update employee fields
    await employee.update({
        departmentId: updateData.departmentId,
        designationId: updateData.designationId,
        managerId: updateData.managerId,
        dateOfBirth: updateData.dateOfBirth,
        gender: updateData.gender,
        maritalStatus: updateData.maritalStatus,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        country: updateData.country,
        zipCode: updateData.zipCode,
        emergencyContact: updateData.emergencyContact,
        emergencyPhone: updateData.emergencyPhone,
        employmentType: updateData.employmentType,
        employmentStatus: updateData.employmentStatus,
        workLocation: updateData.workLocation
    });

    // Fetch updated employee
    const updatedEmployee = await Employee.findByPk(id, {
        include: [
            { model: User, as: 'user', attributes: { exclude: ['password'] } },
            { model: Department, as: 'department' },
            { model: Designation, as: 'designation' }
        ]
    });

    res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmployee
    });
});

// Delete employee
export const deleteEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const companyId = req.companyId;

    const employee = await Employee.findOne({
        where: { id, companyId }
    });

    if (!employee) {
        res.status(404).json({
            success: false,
            message: 'Employee not found'
        });
        return;
    }

    // Deactivate user instead of hard delete
    await User.update({ isActive: false }, { where: { id: employee.userId } });
    await employee.update({ employmentStatus: 'terminated' });

    res.status(200).json({
        success: true,
        message: 'Employee deleted successfully'
    });
});

// Get employee statistics
export const getEmployeeStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = req.companyId;

    const totalEmployees = await Employee.count({ where: { companyId } });
    const activeEmployees = await Employee.count({ where: { companyId, employmentStatus: 'active' } });
    const departmentCount = await Department.count({ where: { companyId } });

    // Group by department
    const byDepartment = await Employee.findAll({
        where: { companyId },
        attributes: ['departmentId'],
        include: [{ model: Department, as: 'department', attributes: ['name'] }],
        group: ['departmentId', 'department.id', 'department.name'],
        raw: true
    });

    res.status(200).json({
        success: true,
        data: {
            totalEmployees,
            activeEmployees,
            departmentCount,
            byDepartment
        }
    });
});

export default {
    getAllEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeStats
};
