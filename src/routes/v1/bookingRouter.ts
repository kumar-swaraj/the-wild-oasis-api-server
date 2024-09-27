import { Router } from 'express';
import apiKeyController from '../../controllers/apiKeyController';
import * as authController from '../../controllers/authController';
import bookingController from '../../controllers/bookingController';

const router = Router();

router
  .route('/')
  .get(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    bookingController.getAllBookings,
  )
  .post(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    bookingController.createBooking,
  );

router
  .route('/stays-today-activity')
  .get(
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    bookingController.getStaysTodayActivity,
  );

router
  .route('/get-booked-dates-by-cabin-id')
  .get(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    bookingController.getBookedDatesByCabinId,
  );

router
  .route('/:id')
  .get(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    bookingController.getBooking,
  )
  .patch(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('staff', 'manager', 'admin'),
    bookingController.updateBooking,
  )
  .delete(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    bookingController.deleteBooking,
  );

export default router;
