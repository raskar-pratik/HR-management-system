import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

// Process validation errors
export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        // Check for errors
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            next();
            return;
        }

        // Format errors
        const formattedErrors = errors.array().map(error => ({
            field: (error as any).path || (error as any).param,
            message: error.msg
        }));

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    };
};

export default validate;
