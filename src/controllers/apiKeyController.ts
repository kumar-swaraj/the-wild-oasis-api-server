import type { Request, Response, NextFunction } from 'express';
import ApiKey from '../models/apiKeyModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

const createApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { forWhom } = req.body;

    const api = await ApiKey.generateApiKey(forWhom);

    if (api === null) {
      return next(new AppError('Only one active API key is allowed', 400));
    }

    res.status(201).json({
      status: 'success',
      data: {
        apiKey: api,
      },
    });
  },
);

const checkApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      // No API key, proceed with regular authentication
      return next();
    }

    const isValidApiKey = await ApiKey.verifyApiKey(apiKey);
    if (isValidApiKey) {
      // Custom property to indicate API key validation
      req.apiKeyValid = true;

      // Bypass protect and restrictTo if API key is valid
      return next();
    } else {
      return res
        .status(401)
        .json({ status: 'fail', message: 'Invalid or expired API key' });
    }
  },
);

export default { createApiKey, checkApiKey };
