import { model, ObjectId, Query, Schema, Document } from 'mongoose';

interface IBookingBase {
  createdAt: Date;
  startDate: Date;
  endDate: Date;
  numNights: number;
  numGuests: number;
  cabinPrice: number;
  extrasPrice?: number;
  totalPrice: number;
  status: 'checked-in' | 'checked-out' | 'unconfirmed';
  hasBreakfast?: boolean;
  isPaid?: boolean;
  observations?: string;
  cabin: ObjectId;
  guest: ObjectId;
}

const bookingSchema = new Schema<IBookingBase>({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startDate: {
    type: Date,
    required: [true, 'Booking must have a startDate.'],
  },
  endDate: {
    type: Date,
    required: [true, 'Booking must have a endDate.'],
  },
  numNights: {
    type: Number,
    required: [true, 'Booking must have a numNights.'],
  },
  numGuests: {
    type: Number,
    required: [true, 'Booking must have a numGuests.'],
  },
  cabinPrice: {
    type: Number,
    required: [true, 'Booking must have a cabinPrice.'],
  },
  extrasPrice: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: [true, 'Booking must have a totalPrice.'],
  },
  status: {
    type: String,
    required: [true, 'Booking must have a status'],
    enum: {
      values: ['checked-in', 'checked-out', 'unconfirmed'],
      message: 'Status is either: checked-in, checked-out or unconfirmed.',
    },
  },
  hasBreakfast: {
    type: Boolean,
    default: false,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  observations: {
    type: String,
    trim: true,
  },
  cabin: {
    type: Schema.ObjectId,
    ref: 'Cabin',
    required: [true, 'Booking must belong to a cabin.'],
  },
  guest: {
    type: Schema.ObjectId,
    ref: 'Guest',
    required: [true, 'Booking must belong to a guest.'],
  },
});

bookingSchema.pre<Query<any, Document<IBookingBase>>>(/^find/, function (next) {
  this.populate({ path: 'guest', select: '-__v' }).populate({
    path: 'cabin',
    select: '-__v',
  });

  next();
});

const Booking = model('Booking', bookingSchema);

export default Booking;
