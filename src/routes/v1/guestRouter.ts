import { Router } from 'express';
import apiKeyController from '../../controllers/apiKeyController';
import * as authController from '../../controllers/authController';
import guestController from '../../controllers/guestController';

const router = Router();

router
  .route('/')
  .get(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    guestController.getAllGuests,
  )
  .post(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('staff', 'manager', 'admin'),
    guestController.createGuest,
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    guestController.getGuest,
  )
  .patch(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('staff', 'manager', 'admin'),
    guestController.updateGuest,
  )
  .delete(
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    guestController.deleteGuest,
  );

export default router;
