import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Department attributes
interface DepartmentAttributes {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    managerId?: string;
    parentId?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'isActive'> { }

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
    public id!: string;
    public companyId!: string;
    public name!: string;
    public description?: string;
    public managerId?: string;
    public parentId?: string;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Department.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        companyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'company_id',
            references: {
                model: 'companies',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        managerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'manager_id'
        },
        parentId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'parent_id'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        }
    },
    {
        sequelize,
        tableName: 'departments',
        timestamps: true,
        underscored: true
    }
);

export default Department;
