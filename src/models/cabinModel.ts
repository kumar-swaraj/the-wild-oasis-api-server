import { model, Schema } from 'mongoose';
import slugify from 'slugify';

export interface ICabinBase {
  name: string;
  slug: string;
  description: string;
  maxCapacity: number;
  regularPrice: number;
  discount?: number;
  image: string;
}

const cabinSchema = new Schema<ICabinBase>(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, 'A cabin must have a name.'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A cabin must have a description.'],
    },
    maxCapacity: {
      type: Number,
      required: [true, 'A cabin must have a maxCapactiy.'],
    },
    regularPrice: {
      type: Number,
      required: [true, 'A cabin must have a regular Price.'],
    },
    discount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      trim: true,
      required: [true, 'A cabin must have a image.'],
    },
  },
  { timestamps: true },
);

cabinSchema.index({ maxCapacity: 1 });

cabinSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

const Cabin = model('Cabin', cabinSchema);

export default Cabin;
