import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import * as authController from '../../controllers/authController';
import * as userController from '../../controllers/userController';

const upload = multer({ storage: memoryStorage() });

const router = Router();

router
  .route('/signup')
  .post(
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    authController.signup,
  );
router
  .route('/verify-email/:verificationToken')
  .patch(authController.verifyEmail);

router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);

router.route('/forgot-password').post(authController.forgotPassword);
router.route('/reset-password/:resetToken').patch(authController.resetPassword);

router
  .route('/me')
  .get(
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    userController.getMe,
  );

router
  .route('/update-my-password')
  .patch(
    authController.protect,
    authController.restrictTo('staff', 'manager', 'admin'),
    authController.updatePassword,
  );

router
  .route('/update-me')
  .patch(
    authController.protect,
    authController.restrictTo('staff', 'manager', 'admin'),
    upload.single('avatar'),
    userController.updateMe,
  );

export default router;
