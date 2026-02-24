import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SalaryComponentAttributes {
    id: string;
    companyId: string;
    name: string;
    code: string;
    type: 'earning' | 'deduction';
    calculationType: 'fixed' | 'percentage';
    percentageOf?: string; // Code of the component this is a percentage of (e.g., 'BASIC')
    isTaxable: boolean;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface SalaryComponentCreationAttributes extends Optional<SalaryComponentAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

class SalaryComponent extends Model<SalaryComponentAttributes, SalaryComponentCreationAttributes> implements SalaryComponentAttributes {
    public id!: string;
    public companyId!: string;
    public name!: string;
    public code!: string;
    public type!: 'earning' | 'deduction';
    public calculationType!: 'fixed' | 'percentage';
    public percentageOf?: string;
    public isTaxable!: boolean;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SalaryComponent.init(
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('earning', 'deduction'),
            allowNull: false,
        },
        calculationType: {
            type: DataTypes.ENUM('fixed', 'percentage'),
            allowNull: false,
            defaultValue: 'fixed',
        },
        percentageOf: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isTaxable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'salary_components',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['companyId', 'code'],
            },
        ],
    }
);

export default SalaryComponent;
