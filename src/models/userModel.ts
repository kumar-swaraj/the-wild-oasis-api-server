import crypto from 'node:crypto';
import { Document, model, Schema, Query } from 'mongoose';
import { isEmail } from 'validator';
import bcrypt from 'bcryptjs';
import config from '../lib/config/config';

export type TUserRole = 'demo' | 'staff' | 'manager' | 'admin';

interface IUserBase {
  fullName: string;
  email: string;
  avatar: string;
  role: TUserRole;
  password: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  isEmailVerified?: boolean;
  isActive?: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  lastSignIn?: Date;
}

export interface IUser extends IUserBase, Document {
  createEmailVerificationToken: () => string;
  correctPassword: (
    candidatePassword: string,
    hashedUserPassword: string,
  ) => Promise<boolean>;
  changePasswordAfter: (JWTTimestamp: number) => boolean;
  createPasswordResetToken: () => string;
}

const userSchema = new Schema<IUserBase>(
  {
    fullName: {
      type: String,
      trim: true,
      required: [true, 'Please tell us your full name!'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, 'Please provide your email'],
      validate: [isEmail, 'Please provide a valid email'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    password: {
      type: String,
      minlength: 8,
      select: false,
      required: [true, 'Please provide a password'],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'password and confirm password are not the same!',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    avatar: {
      type: String,
      trim: true,
      default:
        'https://kmftbtarceppupbiwldj.supabase.co/storage/v1/object/public/avatars/default-user.jpg',
    },
    role: {
      type: String,
      enum: ['demo', 'staff', 'manager', 'admin'],
      default: 'staff',
    },
    isActive: {
      type: Boolean,
      // will make true after email verification
      default: false,
      select: false,
    },
    lastSignIn: Date,
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (this: IUser, next) {
  if (!this.isModified('password') || this.isNew) return next();

  // 1s before
  const curDateTime = new Date();
  curDateTime.setSeconds(curDateTime.getSeconds() - 1);
  this.passwordChangedAt = curDateTime;

  next();
});

// unselect NOT ACTIVE users
userSchema.pre<Query<any, IUserBase>>(/^find/, function (next) {
  if (!this.getOptions().skipInactiveCheck) {
    this.find({ isActive: { $ne: false } });
  }

  next();
});

// Instance Method - will be available on all documents of 'users' collection
userSchema.methods.createEmailVerificationToken = function (this: IUser) {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = new Date(
    Date.now() + config.emailVerificationToken.expiresInHrs * 60 * 60 * 1000,
  );

  return verificationToken;
};

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  hashedUserPassword: string,
) {
  return await bcrypt.compare(candidatePassword, hashedUserPassword);
};

userSchema.methods.changePasswordAfter = function (
  this: IUser,
  JWTTimestamp: number,
) {
  if (this.passwordChangedAt) {
    return this.passwordChangedAt.getTime() / 1000 > JWTTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function (this: IUser) {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = new Date(
    Date.now() + config.resetPasswordToken.expiresInMins * 60 * 1000,
  );

  return resetToken;
};

const User = model<IUser>('User', userSchema as any);

export default User;
