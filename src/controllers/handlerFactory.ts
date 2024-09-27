import { Request, Response, NextFunction } from 'express';
import { Model as MongooseModel } from 'mongoose';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import APIFeatures from '../utils/APIFeatures';

export const getAll = <T>(Model: MongooseModel<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Build the query
    const features = new APIFeatures<T>(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields();

    // Count the total documents after filtering
    const totalDocuments = await features.query.clone().lean().countDocuments();

    // Apply pagination
    features.paginate();

    // Execute the query to get paginated results
    const docs = await features.query;

    // Send the response
    res.status(200).json({
      status: 'success',
      results: docs.length,
      totalDocuments,
      data: {
        [`${Model.modelName.toLowerCase()}s`]: docs,
      },
    });
  });
};

export const getOne = <T>(Model: MongooseModel<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findById(req.params.id, '-__v');

    if (!doc) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        [Model.modelName.toLowerCase()]: doc,
      },
    });
  });
};

export const createOne = <T>(Model: MongooseModel<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        [Model.modelName.toLowerCase()]: doc,
      },
    });
  });
};

export const updateOne = <T>(Model: MongooseModel<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        [Model.modelName.toLowerCase()]: doc,
      },
    });
  });
};

export const deleteOne = <T>(Model: MongooseModel<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404,
        ),
      );
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};
