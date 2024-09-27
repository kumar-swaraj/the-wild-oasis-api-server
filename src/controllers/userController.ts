import { Request, Response, NextFunction } from 'express';
import { decode } from 'base64-arraybuffer';
import User from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import supabase from '../services/supabase';

export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id, '-passwordChangedAt -__v');

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  },
);

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { fullName } = req.body;

    let avatar: string | undefined;

    const file = req.file;

    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        return next(new AppError('Invalid image format.', 415));
      }

      const fileBase64 = decode(file.buffer.toString('base64'));

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(
          `${req.user.fullName.replace('/', '-')}-${Date.now()}.${file.mimetype.split('/').at(1)}`,
          fileBase64,
          {
            contentType: file.mimetype,
          },
        );

      if (error) throw error;

      avatar = supabase.storage.from('avatars').getPublicUrl(data.path)
        .data.publicUrl;
    }

    const updateData = { fullName, avatar };

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
      projection: '-__v',
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  },
);
