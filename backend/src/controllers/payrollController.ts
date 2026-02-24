import { Request, Response } from 'express';
import {
    SalaryComponent,
    SalaryStructure,
    SalaryStructureDetail,
    PayrollRun,
    Payslip,
    Employee,
    Company
} from '../models';
import sequelize from '../config/database';

export const getSalaryComponents = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.user!;
        const components = await SalaryComponent.findAll({
            where: { companyId, isActive: true }
        });
        res.json({ success: true, data: components });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary components' });
    }
};

export const createSalaryComponent = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.user!;
        const component = await SalaryComponent.create({ ...req.body, companyId });
        res.json({ success: true, data: component });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating salary component' });
    }
};

export const getSalaryStructure = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const structure = await SalaryStructure.findOne({
            where: { employeeId, isActive: true },
            include: [{
                model: SalaryStructureDetail,
                as: 'details',
                include: [{ model: SalaryComponent, as: 'component' }]
            }]
        });

        if (!structure) {
            return res.status(404).json({ success: false, message: 'Salary structure not found' });
        }
        res.json({ success: true, data: structure });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary structure' });
    }
};

export const createSalaryStructure = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const { companyId } = req.user!;
        const { employeeId, ctc, effectiveFrom, components } = req.body;

        // Deactivate old structure
        await SalaryStructure.update(
            { isActive: false },
            { where: { employeeId, isActive: true }, transaction: t }
        );

        const structure = await SalaryStructure.create({
            companyId,
            employeeId,
            ctc,
            effectiveFrom,
            isActive: true
        }, { transaction: t });

        const details = components.map((c: any) => ({
            salaryStructureId: structure.id,
            salaryComponentId: c.componentId,
            amount: c.amount
        }));

        await SalaryStructureDetail.bulkCreate(details, { transaction: t });

        await t.commit();
        res.json({ success: true, data: structure });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ success: false, message: 'Error creating salary structure', error });
    }
};

export const processPayroll = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const { companyId } = req.user!;
        const { month, year } = req.body;

        // Check if already processed
        // ... (omitted for brevity, assume unchanged logic)

        // Fix req.user.userId access
        const userId = (req.user as any).userId || (req.user as any).id;

        const existingRun = await PayrollRun.findOne({ where: { companyId, month, year } });
        if (existingRun && existingRun.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Payroll already processed for this month' });
        }

        // Create Payroll Run
        const payrollRun = await PayrollRun.create({
            companyId,
            month,
            year,
            status: 'processing',
            processedBy: userId,
            processedAt: new Date(),
            totalGross: 0,
            totalDeductions: 0,
            totalNet: 0,
            employeeCount: 0
        }, { transaction: t });

        // ... (fetch employees)
        const employees = await Employee.findAll({
            where: { companyId, employmentStatus: 'active' },
            include: [{
                model: SalaryStructure,
                as: 'salaryStructure',
                where: { isActive: true },
                include: [{
                    model: SalaryStructureDetail,
                    as: 'details',
                    include: [{ model: SalaryComponent, as: 'component' }]
                }]
            }]
        });

        // ... (calculations)
        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;
        const payslipsData = [];

        for (const emp of employees) {
            // ... (calculation logic same as before)
            const structure = (emp as any).salaryStructure;
            if (!structure) continue;

            let gross = 0;
            let deductions = 0;
            const earningsBreakdown: any = {};
            const deductionsBreakdown: any = {};

            for (const detail of structure.details) {
                const amount = Number(detail.amount);
                const component = detail.component;

                if (component.type === 'earning') {
                    gross += amount;
                    earningsBreakdown[component.name] = amount;
                } else {
                    deductions += amount;
                    deductionsBreakdown[component.name] = amount;
                }
            }

            const net = gross - deductions;
            totalGross += gross;
            totalDeductions += deductions;
            totalNet += net;

            payslipsData.push({
                companyId,
                employeeId: emp.id,
                payrollRunId: payrollRun.id,
                month,
                year,
                workingDays: 30,
                daysWorked: 30,
                lopDays: 0, // ADDED THIS
                grossEarnings: gross,
                totalDeductions: deductions,
                netPay: net,
                status: 'finalized',
                earningsBreakdown,
                deductionsBreakdown
            });
        }

        await Payslip.bulkCreate(payslipsData as any, { transaction: t });

        await payrollRun.update({
            status: 'completed',
            totalGross,
            totalDeductions,
            totalNet,
            employeeCount: employees.length
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, message: 'Payroll processed successfully', data: payrollRun });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error processing payroll' });
    }
};

export const getPayrollRuns = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.user!;
        const runs = await PayrollRun.findAll({
            where: { companyId },
            order: [['year', 'DESC'], ['month', 'DESC']]
        });
        res.json({ success: true, data: runs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching payroll runs' });
    }
};

export const getPayslips = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { payrollRunId } = req.query;
        const where: any = { companyId };

        if (payrollRunId) where.payrollRunId = payrollRunId;

        const payslips = await Payslip.findAll({
            where,
            include: [{
                model: Employee,
                as: 'employee',
                attributes: ['id', 'employeeCode', 'userId'], // Join user to get name if needed, but Employee usually has names? 
                // Wait, Employee model doesn't have name directly, it is linked to User.
                include: [{ model: sequelize.models.User, as: 'user', attributes: ['name', 'email'] }]
            }]
        });
        res.json({ success: true, data: payslips });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching payslips' });
    }
};
