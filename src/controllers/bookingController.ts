import { eachDayOfInterval, endOfToday, startOfToday } from 'date-fns';
import { NextFunction, Request, Response } from 'express';
import mongoose, { isValidObjectId } from 'mongoose';
import Booking from '../models/bookingModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import * as factory from './handlerFactory';

const getAllBookings = factory.getAll(Booking);
const getBooking = factory.getOne(Booking);
const createBooking = factory.createOne(Booking);
const updateBooking = factory.updateOne(Booking);
const deleteBooking = factory.deleteOne(Booking);

const getStaysTodayActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stays = await Booking.aggregate([
      {
        $match: {
          $or: [
            {
              status: 'unconfirmed',
              startDate: { $gte: startOfToday(), $lte: endOfToday() },
            },
            {
              status: 'checked-in',
              endDate: { $gte: startOfToday(), $lte: endOfToday() },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'guests',
          localField: 'guest',
          foreignField: '_id',
          as: 'guest',
        },
      },
      {
        $unwind: '$guest',
      },
      {
        $project: {
          createdAt: 1,
          status: 1,
          numNights: 1,
          guest: {
            fullName: 1,
            nationality: 1,
            countryFlag: 1,
          },
        },
      },
      {
        $sort: { createdAt: -1 }, // (newest first)
      },
    ]);

    res.status(200).json({
      status: 'success',
      results: stays.length,
      data: {
        stays,
      },
    });
  },
);

const getBookedDatesByCabinId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const cabinId = req.query.cabinId;

    if (!isValidObjectId(cabinId)) {
      return next(
        new AppError('Either cabinId not found or cabinId not valid', 404),
      );
    }

    const bookings = await Booking.aggregate([
      {
        $match: {
          cabin: new mongoose.Types.ObjectId(cabinId as string),
          $or: [
            { startDate: { $gte: startOfToday() } },
            { status: 'checked-in' },
          ],
        },
      },
      {
        $project: {
          startDate: 1,
          endDate: 1,
        },
      },
      {
        $sort: { startDate: 1 },
      },
    ]);

    const bookedDates = bookings.flatMap(
      (booking: { startDate: Date; endDate: string }) =>
        eachDayOfInterval({ start: booking.startDate, end: booking.endDate }),
    );

    res.status(200).json({
      status: 'success',
      data: {
        bookedDates,
      },
    });
  },
);

export default {
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,

  getStaysTodayActivity,
  getBookedDatesByCabinId,
};
