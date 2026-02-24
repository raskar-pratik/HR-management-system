import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Attendance attributes
interface AttendanceAttributes {
    id: string;
    companyId: string;
    employeeId: string;
    date: string | Date;
    clockIn?: Date;
    clockOut?: Date;
    workHours?: number;
    breakHours?: number;
    status: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'holiday' | 'weekend';
    notes?: string;
    ipAddress?: string | undefined;
    location?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'status'> { }

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
    public id!: string;
    public companyId!: string;
    public employeeId!: string;
    public date!: string | Date;
    public clockIn?: Date;
    public clockOut?: Date;
    public workHours?: number;
    public breakHours?: number;
    public status!: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'holiday' | 'weekend';
    public notes?: string;
    public ipAddress?: string;
    public location?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Attendance.init(
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        clockIn: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'clock_in'
        },
        clockOut: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'clock_out'
        },
        workHours: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true,
            field: 'work_hours'
        },
        breakHours: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true,
            field: 'break_hours'
        },
        status: {
            type: DataTypes.ENUM('present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend'),
            defaultValue: 'present'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ipAddress: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'ip_address'
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'attendance',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['employee_id', 'date']
            },
            {
                fields: ['company_id']
            },
            {
                fields: ['date']
            }
        ]
    }
);

export default Attendance;
