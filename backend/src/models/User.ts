import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

// User roles
export type UserRole = 'super_admin' | 'company_admin' | 'hr_manager' | 'manager' | 'employee';

// User attributes interface
interface UserAttributes {
    id: string;
    companyId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// For creating new user
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'isActive' | 'isEmailVerified'> { }

// User Model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public companyId!: string;
    public email!: string;
    public password!: string;
    public firstName!: string;
    public lastName!: string;
    public phone?: string;
    public avatar?: string;
    public role!: UserRole;
    public isActive!: boolean;
    public isEmailVerified!: boolean;
    public lastLoginAt?: Date;
    public passwordResetToken?: string;
    public passwordResetExpires?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Method to check password
    public async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }

    // Get full name
    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    // Remove password from JSON output
    public toJSON(): object {
        const values = Object.assign({}, this.get());
        delete (values as any).password;
        delete (values as any).passwordResetToken;
        delete (values as any).passwordResetExpires;
        return values;
    }
}

User.init(
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
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'first_name'
        },
        lastName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'last_name'
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('super_admin', 'company_admin', 'hr_manager', 'manager', 'employee'),
            defaultValue: 'employee'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        isEmailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_email_verified'
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_login_at'
        },
        passwordResetToken: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'password_reset_token'
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'password_reset_expires'
        }
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
        hooks: {
            // Hash password before saving
            beforeCreate: async (user: User) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user: User) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        },
        indexes: [
            {
                fields: ['company_id']
            }
        ]
    }
);

export default User;
