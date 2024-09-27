import { decode } from 'base64-arraybuffer';
import { Request, Response, NextFunction } from 'express';
import Cabin from '../models/cabinModel';
import * as factory from './handlerFactory';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import supabase from '../services/supabase';
// import config from '../lib/config/config';

const getAllCabins = factory.getAll(Cabin);
const getCabin = factory.getOne(Cabin);
const deleteCabin = factory.deleteOne(Cabin);

export const createCabin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, maxCapacity, regularPrice, discount } = req.body;

    if (!name || !description || !maxCapacity || !regularPrice) {
      return next(new AppError('Some required fields are missing.', 400));
    }

    const file = req.file;
    if (!file?.mimetype.startsWith('image/')) {
      return next(
        new AppError('Please upload an image file.', file ? 415 : 400),
      );
    }

    const fileBase64 = decode(file.buffer.toString('base64'));

    const { data, error } = await supabase.storage.from('cabin-images').upload(
      // fileName need to replace '/' with '-' because, if it is with '/' then supabase will create a folder. I tried it and it did.
      `${name.replace('/', '-')}-${Date.now()}.${file.mimetype.split('/').at(1)}`,
      fileBase64,
      {
        contentType: file.mimetype,
      },
    );

    if (error) {
      throw error;
    }

    const { data: image } = supabase.storage
      .from('cabin-images')
      .getPublicUrl(data.path);

    const newCabin = await Cabin.create({
      name,
      description,
      maxCapacity,
      regularPrice,
      discount,
      image: image.publicUrl,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        cabin: newCabin,
      },
    });
  },
);

const updateCabin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const oldCabin = await Cabin.findById(req.params.id);

    if (!oldCabin) {
      return next(new AppError(`No Cabin found with that ID`, 404));
    }

    const file = req.file;
    let newUploadedImageAddress: string | undefined;

    if (file) {
      if (!file.mimetype.startsWith('image/'))
        return next(new AppError('Please upload an image file.', 415));

      const fileBase64 = decode(file.buffer.toString('base64'));

      const { data, error } = await supabase.storage
        .from('cabin-images')
        .upload(
          `${oldCabin.name.replace('/', '-')}-${Date.now()}.${file.mimetype.split('/').at(1)}`,
          fileBase64,
          {
            contentType: file.mimetype,
          },
        );

      if (error) {
        throw error;
      }

      const { data: newImage } = supabase.storage
        .from('cabin-images')
        .getPublicUrl(data.path);

      newUploadedImageAddress = newImage.publicUrl;

      // delete old image
      /*
      Not needed anymore, because if user made a copy of the same cabin, then other cabin will delete that cabin image, while editing new image for previous cabin

      await supabase.storage
        .from('cabin-images')
        .remove([
          oldCabin.image.replace(
            `${config.supabase.storageUrl}/cabin-images/`,
            '',
          ),
        ]);
      */
    }

    const updateCabinData = { ...req.body };

    if (newUploadedImageAddress)
      updateCabinData.image = newUploadedImageAddress;

    const updatedCabin = await Cabin.findByIdAndUpdate(
      req.params.id,
      updateCabinData,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'success',
      data: {
        cabin: updatedCabin,
      },
    });
  },
);

const createDuplicateCabin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const originalCabin = await Cabin.findById(req.params.cabinId);

    if (!originalCabin) {
      return next(new AppError('No cabin found with that ID', 404));
    }

    const copiedCabin = await Cabin.create({
      name: `Copy of ${originalCabin?.name}`,
      description: originalCabin?.description,
      maxCapacity: originalCabin?.maxCapacity,
      regularPrice: originalCabin?.regularPrice,
      discount: originalCabin?.discount,
      image: originalCabin?.image,
    });

    res.status(201).json({
      status: 'success',
      data: {
        cabin: copiedCabin,
      },
    });
  },
);

export default {
  getAllCabins,
  getCabin,
  createCabin,
  updateCabin,
  deleteCabin,
  createDuplicateCabin,
};
