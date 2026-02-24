import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SalaryStructureAttributes {
    id: string;
    companyId: string;
    employeeId: string;
    ctc: number;
    effectiveFrom: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface SalaryStructureCreationAttributes extends Optional<SalaryStructureAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

class SalaryStructure extends Model<SalaryStructureAttributes, SalaryStructureCreationAttributes> implements SalaryStructureAttributes {
    public id!: string;
    public companyId!: string;
    public employeeId!: string;
    public ctc!: number;
    public effectiveFrom!: Date;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SalaryStructure.init(
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
        ctc: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        effectiveFrom: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'salary_structures',
        timestamps: true,
    }
);

export default SalaryStructure;
