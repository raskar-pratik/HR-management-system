import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Company attributes interface
interface CompanyAttributes {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
    status: 'active' | 'inactive' | 'suspended';
    subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise';
    subscriptionEndDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// For creating new company (id is auto-generated)
interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'status' | 'subscriptionPlan'> { }

// Company Model
class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
    public id!: string;
    public name!: string;
    public email!: string;
    public phone?: string;
    public address?: string;
    public city?: string;
    public state?: string;
    public country?: string;
    public zipCode?: string;
    public logo?: string;
    public website?: string;
    public industry?: string;
    public size?: string;
    public status!: 'active' | 'inactive' | 'suspended';
    public subscriptionPlan!: 'free' | 'basic' | 'premium' | 'enterprise';
    public subscriptionEndDate?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Company.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        phone: {
            type: DataTypes.STRING(20),
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
        logo: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        website: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        industry: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        size: {
            type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active'
        },
        subscriptionPlan: {
            type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
            defaultValue: 'free',
            field: 'subscription_plan'
        },
        subscriptionEndDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'subscription_end_date'
        }
    },
    {
        sequelize,
        tableName: 'companies',
        timestamps: true,
        underscored: true
    }
);

export default Company;
