import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Designation attributes
interface DesignationAttributes {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    level?: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface DesignationCreationAttributes extends Optional<DesignationAttributes, 'id' | 'isActive'> { }

class Designation extends Model<DesignationAttributes, DesignationCreationAttributes> implements DesignationAttributes {
    public id!: string;
    public companyId!: string;
    public name!: string;
    public description?: string;
    public level?: number;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Designation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        companyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'company_id'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        }
    },
    {
        sequelize,
        tableName: 'designations',
        timestamps: true,
        underscored: true
    }
);

export default Designation;
