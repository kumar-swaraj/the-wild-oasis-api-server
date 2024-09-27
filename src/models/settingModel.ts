import { model, Schema } from 'mongoose';

interface ISettingBase {
  minBookingLength: number;
  maxBookingLength: number;
  maxGuestsPerBooking: number;
  breakfastPrice: number;
}

const settingSchema = new Schema<ISettingBase>(
  {
    minBookingLength: {
      type: Number,
      required: [true, 'Setting must have minBookingLength'],
      validate: {
        validator: function (this: ISettingBase, val: number): boolean {
          return val <= this.maxBookingLength;
        },
        message:
          'minBookingLength ({VALUE}) should be lesser or equal to maxBookingLength',
      },
    },
    maxBookingLength: {
      type: Number,
      required: [true, 'Setting must have a maxBookingLength'],
      validate: {
        validator: function (this: ISettingBase, val: number): boolean {
          return val >= this.minBookingLength;
        },
        message:
          'maxBookingLength ({VALUE}) should be greater or equal to minBookingLength',
      },
    },
    maxGuestsPerBooking: {
      type: Number,
      required: [true, 'Setting must have a maxGuestsPerBooking'],
    },
    breakfastPrice: {
      type: Number,
      required: [true, 'Setting must have a breakfastPrice'],
    },
  },
  { timestamps: true },
);

const Setting = model('Setting', settingSchema);

export default Setting;
