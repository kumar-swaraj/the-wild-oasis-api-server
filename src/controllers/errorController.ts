import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import AppError from '../utils/AppError';
import config from '../lib/config/config';
import logger from '../lib/logger/logger';
import mongoose from 'mongoose';

const handleMulterError = (err: any) => {
  const message = `Incorrect field name '${err.field}'.`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  if (
    mongoose.Types.ObjectId.isValid(Object.values(err.keyValue).at(0) as any)
  ) {
    return new AppError(`Duplicate entry not allowed.`, 400);
  }

  const message = `Duplicate field value: ${Object.values(err.keyValue) as any}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map(
    (el: any) => `${el.path}: ${el.message}`,
  );

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('You token has expired! Please log in again.', 401);

const sendErrorProd = (
  err: any,
  statusCode: number,
  status: string,
  res: Response,
) => {
  if (err.isOperational) {
    res.status(statusCode).json({
      status,
      message: err.message,
    });
  } else {
    logger.error(`💥💥💥`, err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

function sendErrorDev(
  err: any,
  statusCode: number,
  status: string,
  res: Response,
) {
  res.status(statusCode).json({
    status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
}

function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // logger.error(err.stack);

  if (config.env === 'development') {
    sendErrorDev(err, err.statusCode ?? 500, err.status ?? 'error', res);
  } else {
    let error = Object.create(err);

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'MulterError') {
      error = handleMulterError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, error.statusCode ?? 500, error.status ?? 'error', res);
  }
}

const typedGlobalErrorHandler: ErrorRequestHandler =
  globalErrorHandler as ErrorRequestHandler;

export default typedGlobalErrorHandler;
