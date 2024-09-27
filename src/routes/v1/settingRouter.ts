import { Router } from 'express';
import apiKeyController from '../../controllers/apiKeyController';
import settingController from '../../controllers/settingController';
import * as authController from '../../controllers/authController';

const router = Router();

router
  .route('/')
  .get(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    settingController.getSettings,
  )
  .post(
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    settingController.createSettings,
  )
  .patch(
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    settingController.updateSettings,
  )
  .delete(
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    settingController.deleteSettings,
  );

export default router;
