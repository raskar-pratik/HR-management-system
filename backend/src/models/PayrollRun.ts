import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PayrollRunAttributes {
    id: string;
    companyId: string;
    month: number;
    year: number;
    status: 'draft' | 'processing' | 'completed' | 'paid';
    processedBy?: string;
    processedAt?: Date;
    totalGross?: number;
    totalDeductions?: number;
    totalNet?: number;
    employeeCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface PayrollRunCreationAttributes extends Optional<PayrollRunAttributes, 'id' | 'status' | 'processedBy' | 'processedAt' | 'totalGross' | 'totalDeductions' | 'totalNet' | 'employeeCount' | 'createdAt' | 'updatedAt'> { }

class PayrollRun extends Model<PayrollRunAttributes, PayrollRunCreationAttributes> implements PayrollRunAttributes {
    public id!: string;
    public companyId!: string;
    public month!: number;
    public year!: number;
    public status!: 'draft' | 'processing' | 'completed' | 'paid';
    public processedBy?: string;
    public processedAt?: Date;
    public totalGross?: number;
    public totalDeductions?: number;
    public totalNet?: number;
    public employeeCount?: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

PayrollRun.init(
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
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('draft', 'processing', 'completed', 'paid'),
            defaultValue: 'draft',
            allowNull: false,
        },
        processedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        processedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        totalGross: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            defaultValue: 0,
        },
        totalDeductions: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            defaultValue: 0,
        },
        totalNet: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            defaultValue: 0,
        },
        employeeCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'payroll_runs',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['companyId', 'month', 'year'],
            },
        ],
    }
);

export default PayrollRun;
