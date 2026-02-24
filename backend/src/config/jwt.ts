import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface JwtConfig {
    secret: string;
    refreshSecret: string;
    expiry: string;
    refreshExpiry: string;
}

const jwtConfig: JwtConfig = {
    secret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    expiry: process.env.JWT_EXPIRY || '24h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
};

export default jwtConfig;
