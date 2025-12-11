import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.message}`, err.stack);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }

    // Default to 500 Server Error
    return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error'
    });
};
