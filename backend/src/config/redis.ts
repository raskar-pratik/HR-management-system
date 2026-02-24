import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3) {
            console.warn('Redis connection failed. Caching will be disabled.');
            return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
    }
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
    // Only log error if not in development to avoid console spam if no redis
    if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️ Redis connection error:', err.message);
    }
});

export default redis;
