import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import config from '../lib/config/config';
import logger from '../lib/logger/logger';
import User, { type IUser, type TUserRole } from '../models/userModel';
import Email from '../services/Email';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';

interface IJwtPayload {
  id: string;
  iat: number;
  exp: number;
}

const signToken = (id: string) =>
  jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiration,
  });

const verifyToken = (accesToken: string): Promise<IJwtPayload> =>
  new Promise((resolve, reject) =>
    jwt.verify(accesToken, config.jwt.secret, (err: any, decoded: any) => {
      if (err) {
        return reject(err as Error);
      }

      resolve(decoded);
    }),
  );

const createSendToken = async (
  user: IUser,
  statusCode: number,
  res: Response,
) => {
  const accessToken = signToken(user.id);

  user.lastSignIn = new Date();
  const updatedUser = await user.save({ validateModifiedOnly: true });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    signed: true,
    sameSite: 'none',
    expires: new Date(
      Date.now() + config.jwt.cookieExpiration * 24 * 60 * 60 * 1000,
    ),
  });

  // DON'T SEND PASSWORD IN RESPONSE, CURRENT USER HAS AS PROPERTY
  const userWithoutPass = updatedUser as any;
  userWithoutPass.password = undefined;
  userWithoutPass.passwordChangedAt = undefined;
  userWithoutPass.isEmailVerified = undefined;
  userWithoutPass.isActive = undefined;
  userWithoutPass.__v = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      user: userWithoutPass,
    },
  });
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = {
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    };

    const newUser = await User.create(userData);

    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateModifiedOnly: true });

    const emailVerificationLink = `${config.client.staffAppUrl}/verify-email/?emailVerificationToken=${verificationToken}`;

    try {
      const email = new Email(newUser, emailVerificationLink);
      await email.sendWelcome();

      // note: our all users are created internally by either 'manager' or 'admin' and there is no need to send token just after signing up, we will just send newly created inactive user detail in response
      // createSendToken(newUser, 201, res);

      // DON'T SEND PASSWORD IN RESPONSE, CURRENT USER HAS AS PROPERTY
      const userWithoutPass = newUser as any;
      userWithoutPass.password = undefined;
      userWithoutPass.isActive = undefined;
      userWithoutPass.isEmailVerified = undefined;
      userWithoutPass.emailVerificationToken = undefined;
      userWithoutPass.emailVerificationExpires = undefined;
      userWithoutPass.__v = undefined;

      return res.status(201).json({
        status: 'success',
        message: "Email verification link sent to user's email",
        data: {
          user: newUser,
        },
      });
    } catch (err) {
      logger.error(err);

      await User.findByIdAndDelete(newUser._id).setOptions({
        skipInactiveCheck: true,
      });

      return next(
        new AppError(
          "There was an issue while sending email on user's email address. Please, try to create the account later",
          500,
        ),
      );
    }
  },
);

export const verifyEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.verificationToken)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).setOptions({ skipInactiveCheck: true });

    if (!user) {
      return next(
        new AppError(
          'Either email verification link is invalid or has expired',
          400,
        ),
      );
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.isEmailVerified = true;
    user.isActive = true;
    const updatedUser = await user.save({ validateModifiedOnly: true });

    await createSendToken(updatedUser, 200, res);
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    await createSendToken(user, 200, res);
  },
);

export const logout = (req: Request, res: Response, next: NextFunction) => {
  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: true,
    signed: true,
    sameSite: 'none',
    expires: new Date(0),
  });

  res.status(200).json({ status: 'success' });
};

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.apiKeyValid) {
      return next();
    }

    const { accessToken } = req.signedCookies;
    if (!accessToken) {
      return next(
        new AppError(
          'You are not logged in! Please log in to get access.',
          401,
        ),
      );
    }

    const decoded = await verifyToken(accessToken);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exist.', 401),
      );
    }

    if (currentUser.changePasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please login again.',
          401,
        ),
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  },
);

export const restrictTo =
  (...roles: TUserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.apiKeyValid) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(
        new AppError(
          'There is no active user with provided email address',
          404,
        ),
      );
    }

    // 2. Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateModifiedOnly: true });

    // 3. Send reset token on user's email
    const resetLink = `${config.client.staffAppUrl}/reset-password/?resetToken=${resetToken}`;

    try {
      const email = new Email(user, resetLink);
      await email.sendPasswordReset();

      return res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to your email!',
      });
    } catch (err) {
      logger.error(err);

      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateModifiedOnly: true });

      return next(
        new AppError(
          'There was an error while sending the email. Please, try again later!',
          500,
        ),
      );
    }
  },
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // 2) If token has not expired, set the new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    const updatedUser = await user.save({ validateBeforeSave: true });

    // 3) Log the user in
    await createSendToken(updatedUser, 200, res);
  },
);

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, password, passwordConfirm } = req.body;

    const user = (await User.findById(req.user.id).select('+password'))!;

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new AppError('Your current password is incorrect', 401));
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    await createSendToken(user, 200, res);
  },
);
