import { NextFunction, Request, Response } from 'express';
import Setting from '../models/settingModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

const getSettings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Setting.findOne().select('-__v');

    if (!doc) {
      return next(new AppError('Setting document not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        setting: doc,
      },
    });
  },
);

const updateSettings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Setting.findOneAndUpdate({}, req.body, {
      new: true,
    });

    if (!doc) {
      return next(new AppError('Setting document not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        setting: doc,
      },
    });
  },
);

const createSettings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const existingDoc = await Setting.findOne();

    if (existingDoc) {
      return next(
        new AppError(
          "There can be only one setting document and it already exists so you can't create a new one. Only modification of that setting document is possible",
          404,
        ),
      );
    }

    const doc = await Setting.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        setting: doc,
      },
    });
  },
);

const deleteSettings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await Setting.deleteMany();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);

export default { getSettings, updateSettings, createSettings, deleteSettings };
