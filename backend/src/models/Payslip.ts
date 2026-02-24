import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PayslipAttributes {
    id: string;
    companyId: string;
    employeeId: string;
    payrollRunId: string;
    month: number;
    year: number;
    workingDays: number;
    daysWorked: number;
    lopDays: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    status: 'draft' | 'finalized' | 'paid';
    paymentDate?: Date;
    paymentMethod?: string;
    earningsBreakdown: any; // JSON
    deductionsBreakdown: any; // JSON
    createdAt?: Date;
    updatedAt?: Date;
}

interface PayslipCreationAttributes extends Optional<PayslipAttributes, 'id' | 'status' | 'paymentDate' | 'paymentMethod' | 'earningsBreakdown' | 'deductionsBreakdown' | 'createdAt' | 'updatedAt'> { }

class Payslip extends Model<PayslipAttributes, PayslipCreationAttributes> implements PayslipAttributes {
    public id!: string;
    public companyId!: string;
    public employeeId!: string;
    public payrollRunId!: string;
    public month!: number;
    public year!: number;
    public workingDays!: number;
    public daysWorked!: number;
    public lopDays!: number;
    public grossEarnings!: number;
    public totalDeductions!: number;
    public netPay!: number;
    public status!: 'draft' | 'finalized' | 'paid';
    public paymentDate?: Date;
    public paymentMethod?: string;
    public earningsBreakdown!: any;
    public deductionsBreakdown!: any;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Payslip.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        companyId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        employeeId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        payrollRunId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        workingDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        daysWorked: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: false,
        },
        lopDays: {
            type: DataTypes.DECIMAL(4, 1),
            defaultValue: 0,
            allowNull: false,
        },
        grossEarnings: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        totalDeductions: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        netPay: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('draft', 'finalized', 'paid'),
            defaultValue: 'draft',
            allowNull: false,
        },
        paymentDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        earningsBreakdown: {
            type: DataTypes.JSON,
            defaultValue: {},
        },
        deductionsBreakdown: {
            type: DataTypes.JSON,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'payslips',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['payrollRunId', 'employeeId'],
            },
        ],
    }
);

export default Payslip;
