import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Employee attributes
interface EmployeeAttributes {
    id: string;
    companyId: string;
    userId: string;
    employeeCode: string;
    departmentId?: string;
    designationId?: string;
    managerId?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    nationality?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    joinDate: Date;
    confirmationDate?: Date;
    resignationDate?: Date;
    lastWorkingDate?: Date;
    employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
    employmentStatus: 'active' | 'probation' | 'notice_period' | 'resigned' | 'terminated';
    workLocation?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'id' | 'employmentType' | 'employmentStatus'> { }

class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
    public id!: string;
    public companyId!: string;
    public userId!: string;
    public employeeCode!: string;
    public departmentId?: string;
    public designationId?: string;
    public managerId?: string;
    public dateOfBirth?: Date;
    public gender?: 'male' | 'female' | 'other';
    public maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    public nationality?: string;
    public address?: string;
    public city?: string;
    public state?: string;
    public country?: string;
    public zipCode?: string;
    public emergencyContact?: string;
    public emergencyPhone?: string;
    public joinDate!: Date;
    public confirmationDate?: Date;
    public resignationDate?: Date;
    public lastWorkingDate?: Date;
    public employmentType!: 'full_time' | 'part_time' | 'contract' | 'intern';
    public employmentStatus!: 'active' | 'probation' | 'notice_period' | 'resigned' | 'terminated';
    public workLocation?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Employee.init(
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
            field: 'user_id',
            unique: true
        },
        employeeCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'employee_code'
        },
        departmentId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'department_id'
        },
        designationId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'designation_id'
        },
        managerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'manager_id'
        },
        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'date_of_birth'
        },
        gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            allowNull: true
        },
        maritalStatus: {
            type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'),
            allowNull: true,
            field: 'marital_status'
        },
        nationality: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        address: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        state: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        country: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        zipCode: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'zip_code'
        },
        emergencyContact: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'emergency_contact'
        },
        emergencyPhone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'emergency_phone'
        },
        joinDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'join_date'
        },
        confirmationDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'confirmation_date'
        },
        resignationDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'resignation_date'
        },
        lastWorkingDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'last_working_date'
        },
        employmentType: {
            type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'intern'),
            defaultValue: 'full_time',
            field: 'employment_type'
        },
        employmentStatus: {
            type: DataTypes.ENUM('active', 'probation', 'notice_period', 'resigned', 'terminated'),
            defaultValue: 'active',
            field: 'employment_status'
        },
        workLocation: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'work_location'
        }
    },
    {
        sequelize,
        tableName: 'employees',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['company_id']
            },
            {
                fields: ['department_id']
            },
            {
                fields: ['designation_id']
            },
            {
                fields: ['user_id']
            }
        ]
    }
);

export default Employee;
