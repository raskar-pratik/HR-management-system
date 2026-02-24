import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SalaryStructureDetailAttributes {
    id: string;
    salaryStructureId: string;
    salaryComponentId: string;
    amount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface SalaryStructureDetailCreationAttributes extends Optional<SalaryStructureDetailAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

class SalaryStructureDetail extends Model<SalaryStructureDetailAttributes, SalaryStructureDetailCreationAttributes> implements SalaryStructureDetailAttributes {
    public id!: string;
    public salaryStructureId!: string;
    public salaryComponentId!: string;
    public amount!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SalaryStructureDetail.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        salaryStructureId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        salaryComponentId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'salary_structure_details',
        timestamps: true,
    }
);

export default SalaryStructureDetail;
