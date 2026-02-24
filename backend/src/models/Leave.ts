import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Leave attributes
interface LeaveAttributes {
    id: string;
    companyId: string;
    employeeId: string;
    leaveType: 'sick' | 'casual' | 'earned' | 'maternity' | 'paternity' | 'unpaid' | 'other';
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approverId?: string;
    approverComments?: string;
    approvedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface LeaveCreationAttributes extends Optional<LeaveAttributes, 'id' | 'status'> { }

class Leave extends Model<LeaveAttributes, LeaveCreationAttributes> implements LeaveAttributes {
    public id!: string;
    public companyId!: string;
    public employeeId!: string;
    public leaveType!: 'sick' | 'casual' | 'earned' | 'maternity' | 'paternity' | 'unpaid' | 'other';
    public startDate!: Date;
    public endDate!: Date;
    public totalDays!: number;
    public reason!: string;
    public status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
    public approverId?: string;
    public approverComments?: string;
    public approvedAt?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Leave.init(
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
        employeeId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'employee_id'
        },
        leaveType: {
            type: DataTypes.ENUM('sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'other'),
            allowNull: false,
            field: 'leave_type'
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'start_date'
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'end_date'
        },
        totalDays: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: false,
            field: 'total_days'
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
            defaultValue: 'pending'
        },
        approverId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'approver_id'
        },
        approverComments: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'approver_comments'
        },
        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'approved_at'
        }
    },
    {
        sequelize,
        tableName: 'leaves',
        timestamps: true,
        underscored: true
    }
);

export default Leave;
