import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

// Cache middleware
export const cache = (duration: number) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Skip caching if request is not GET
        if (req.method !== 'GET') {
            next();
            return;
        }

        const key = `cache:${req.originalUrl || req.url}`;

        try {
            // Check if redis connected
            if (redis.status !== 'ready') {
                next();
                return;
            }

            const cachedBody = await redis.get(key);

            if (cachedBody) {
                const parsedBody = JSON.parse(cachedBody);
                res.status(200).json(parsedBody);
                return;
            }

            // Hook into res.send (or res.json) to cache the response
            const originalSend = res.json.bind(res);

            res.json = (body: any): Response<any, Record<string, any>> => {
                // Restore original method
                res.json = originalSend;

                // Cache response if success
                if (res.statusCode === 200) {
                    // Don't await this, let it happen in background
                    redis.setex(key, duration, JSON.stringify(body)).catch(err => {
                        console.error('Redis save error:', err);
                    });
                }

                return originalSend(body);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

export const clearCache = async (pattern: string) => {
    try {
        if (redis.status !== 'ready') return;

        const keys = await redis.keys(`cache:${pattern}*`);
        if (keys.length > 0) {
            await redis.del(keys);
        }
    } catch (error) {
        console.error('Clear cache error:', error);
    }
};
