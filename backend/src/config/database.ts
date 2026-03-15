import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration - supports both PostgreSQL (Render) and MySQL (local dev)
let sequelize: Sequelize;

if (process.env.DATABASE_URL) {
    // Production: Use DATABASE_URL from Render (PostgreSQL)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    });
} else {
    // Local development: Use individual env vars (MySQL)
    sequelize = new Sequelize({
        dialect: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME || 'hr_management_db',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    });
}

// Nuclear reset for PostgreSQL - drops everything including orphaned ENUM types
export const resetPostgresSchema = async (): Promise<void> => {
    if (process.env.DATABASE_URL) {
        console.log('🔄 Resetting PostgreSQL schema...');
        await sequelize.query('DROP SCHEMA public CASCADE;');
        await sequelize.query('CREATE SCHEMA public;');
        await sequelize.query('GRANT ALL ON SCHEMA public TO public;');
        console.log('✅ PostgreSQL schema reset complete.');
    }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        return false;
    }
};

export default sequelize;
