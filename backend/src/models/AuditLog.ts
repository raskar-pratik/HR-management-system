import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AuditLogAttributes {
    id: string;
    companyId: string;
    userId: string;
    action: string; // CREATE, UPDATE, DELETE, LOGIN, etc.
    entity: string; // User, Employee, Leave, etc.
    entityId: string;
    oldValues?: object;
    newValues?: object;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id'> { }

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    public id!: string;
    public companyId!: string;
    public userId!: string;
    public action!: string;
    public entity!: string;
    public entityId!: string;
    public oldValues?: object;
    public newValues?: object;
    public ipAddress?: string;
    public userAgent?: string;
    public details?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

AuditLog.init(
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
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id'
        },
        action: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        entity: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        entityId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'entity_id'
        },
        oldValues: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'old_values'
        },
        newValues: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'new_values'
        },
        ipAddress: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'ip_address'
        },
        userAgent: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'user_agent'
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'audit_logs',
        timestamps: true,
        underscored: true
    }
);

export default AuditLog;
