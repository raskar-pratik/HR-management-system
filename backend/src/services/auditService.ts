import { AuditLog } from '../models';

export interface AuditLogData {
    companyId: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    oldValues?: object;
    newValues?: object;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
}

class AuditService {
    /**
     * Log an action to the audit table
     */
    async log(data: AuditLogData) {
        try {
            await AuditLog.create({
                companyId: data.companyId,
                userId: data.userId,
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                oldValues: data.oldValues,
                newValues: data.newValues,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                details: data.details
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw error to avoid blocking main operation
        }
    }

    /**
     * Calculate changes between old and new objects
     */
    calculateChanges(oldObj: any, newObj: any): { oldValues: any, newValues: any } {
        const oldValues: any = {};
        const newValues: any = {};

        const keys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

        keys.forEach(key => {
            // Skip ignored fields
            if (['createdAt', 'updatedAt', 'password'].includes(key)) return;

            const val1 = oldObj ? oldObj[key] : undefined;
            const val2 = newObj ? newObj[key] : undefined;

            if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                if (val1 !== undefined) oldValues[key] = val1;
                if (val2 !== undefined) newValues[key] = val2;
            }
        });

        return { oldValues, newValues };
    }
}

export default new AuditService();
