import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Employee, User, Department, Designation } from '../models';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';

interface EmployeeImportRow {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    joinDate: any;
    status: string;
    rowNumber: number;
    isValid: boolean;
    errors: string[];
}

// Preview Import - Parses file and validates data
export const previewImport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
        res.status(400).json({ success: false, message: 'Invalid Excel file' });
        return;
    }

    const rows: EmployeeImportRow[] = [];
    const departments = await Department.findAll({ where: { companyId: req.companyId } });
    const designations = await Designation.findAll({ where: { companyId: req.companyId } });

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const rowData: EmployeeImportRow = {
            firstName: row.getCell(1).text,
            lastName: row.getCell(2).text,
            email: row.getCell(3).text,
            phone: row.getCell(4).text,
            department: row.getCell(5).text,
            designation: row.getCell(6).text,
            joinDate: row.getCell(7).value,
            status: row.getCell(8).text || 'active',
            rowNumber,
            isValid: true,
            errors: []
        };

        // Validation Logic
        if (!rowData.firstName) rowData.errors.push('First Name is required');
        if (!rowData.lastName) rowData.errors.push('Last Name is required');
        if (!rowData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowData.email)) {
            rowData.errors.push('Valid Email is required');
        }

        // Check Department existence
        if (rowData.department) {
            const deptParams = departments.find(d => d.name.toLowerCase() === rowData.department.toLowerCase());
            if (!deptParams) rowData.errors.push(`Department '${rowData.department}' not found`);
        }

        // Check Designation existence
        if (rowData.designation) {
            const desigParams = designations.find(d => d.name.toLowerCase() === rowData.designation.toLowerCase());
            if (!desigParams) rowData.errors.push(`Designation '${rowData.designation}' not found`);
        }

        if (rowData.errors.length > 0) rowData.isValid = false;
        rows.push(rowData);
    });

    // Check for duplicate emails within the file
    const emails = rows.map(r => r.email);
    const duplicates = emails.filter((item, index) => emails.indexOf(item) !== index);

    rows.forEach(row => {
        if (duplicates.includes(row.email)) {
            row.isValid = false;
            row.errors.push('Duplicate email in file');
        }
    });

    // Check against database for existing emails
    const existingUsers = await User.findAll({ where: { email: emails } });
    const existingEmails = existingUsers.map(u => u.email);

    rows.forEach(row => {
        if (existingEmails.includes(row.email)) {
            row.isValid = false;
            row.errors.push('Email already exists in system');
        }
    });

    res.status(200).json({
        success: true,
        data: {
            rows,
            totalRows: rows.length,
            validRows: rows.filter(r => r.isValid).length,
            invalidRows: rows.filter(r => !r.isValid).length
        }
    });
});

// Import Data - Saves valid rows to DB
export const processImport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rows } = req.body; // Expecting validated rows from frontend
    const companyId = req.companyId!;

    // Re-fetch deps for mapping IDs
    const departments = await Department.findAll({ where: { companyId } });
    const designations = await Designation.findAll({ where: { companyId } });

    const results = {
        success: 0,
        failed: 0,
        errors: [] as any[]
    };

    for (const row of rows) {
        if (!row.isValid) continue;

        try {
            const defaultPassword = await bcrypt.hash('Welcome@123', 10);

            // 1. Create User
            const newUser = await User.create({
                companyId,
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                password: defaultPassword,
                phone: row.phone,
                role: 'employee',
                isActive: true,
                isEmailVerified: false
            });

            // Get IDs
            const dept = departments.find(d => d.name.toLowerCase() === row.department?.toLowerCase());
            const desig = designations.find(d => d.name.toLowerCase() === row.designation?.toLowerCase());

            // Generate Code
            const employeeCode = `EMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

            // 2. Create Employee
            await Employee.create({
                companyId,
                userId: newUser.id,
                employeeCode,
                departmentId: dept?.id,
                designationId: desig?.id,
                joinDate: new Date(row.joinDate || Date.now()),
                employmentStatus: row.status || 'active',
                employmentType: 'full_time'
            });

            results.success++;

        } catch (error: any) {
            results.failed++;
            results.errors.push({
                row: row.rowNumber,
                email: row.email,
                error: error.message
            });
        }
    }

    res.status(200).json({
        success: true,
        message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
        data: results
    });
});
