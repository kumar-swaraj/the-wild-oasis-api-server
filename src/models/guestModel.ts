import { model, Schema } from 'mongoose';

interface IGuestBase {
  fullName: string;
  email: string;
  nationalID?: string;
  nationality?: string;
  countryFlag?: string;
}

const guestSchema = new Schema<IGuestBase>(
  {
    fullName: {
      type: String,
      trim: true,
      required: [true, 'A guest must have a fullName.'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, 'A guest must have a email.'],
    },
    nationalID: {
      type: String,
      trim: true,
    },
    nationality: {
      type: String,
      trim: true,
    },
    countryFlag: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const Guest = model('Guest', guestSchema);

export default Guest;
