import app from './app';
import sequelize, { testConnection, resetPostgresSchema } from './config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async (): Promise<void> => {
    try {
        // Test database connection
        const isConnected = await testConnection();

        if (!isConnected) {
            console.error('❌ Failed to connect to database. Please check your configuration.');
            console.log('\n📝 Troubleshooting tips:');
            console.log('1. Make sure MySQL is running');
            console.log('2. Check your .env file has correct DB_PASSWORD');
            console.log('3. Create the database if it doesn\'t exist');
            process.exit(1);
        }

        // Sync database models
        const forceSync = process.env.FORCE_DB_SYNC === 'true';
        
        if (forceSync) {
            console.log('🔄 FORCE_DB_SYNC enabled - performing nuclear schema reset...');
            await resetPostgresSchema();
        }
        
        try {
            await sequelize.sync({ force: forceSync });
            console.log('✅ Database models synchronized.');
        } catch (syncError: any) {
            console.error('❌ FULL SYNC ERROR:', JSON.stringify(syncError, null, 2));
            console.error('❌ Error message:', syncError?.message);
            console.error('❌ Original error:', syncError?.original);
            console.error('❌ SQL:', syncError?.sql);
            throw syncError;
        }
        console.log('✅ Database models synchronized.');

        // Start Express server
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 HR Management System Backend                      ║
║                                                        ║
║   Server running on: http://localhost:${PORT}            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                        ║
║   Health check: http://localhost:${PORT}/health          ║
║   API Base URL: http://localhost:${PORT}/api/v1          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
        });

    } catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
startServer();
