import { Router } from 'express';
import multer, { memoryStorage } from 'multer';

import apiKeyController from '../../controllers/apiKeyController';
import cabinController from '../../controllers/cabinController';
import * as authController from '../../controllers/authController';

const upload = multer({ storage: memoryStorage() });

const router = Router();

router
  .route('/')
  .get(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    cabinController.getAllCabins,
  )
  .post(upload.single('image'), cabinController.createCabin);

router
  .route('/:id')
  .get(
    apiKeyController.checkApiKey,
    authController.protect,
    authController.restrictTo('demo', 'staff', 'manager', 'admin'),
    cabinController.getCabin,
  )
  .put(
    authController.protect,
    authController.restrictTo('staff', 'manager', 'admin'),
    upload.single('image'),
    cabinController.updateCabin,
  )
  .delete(
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    cabinController.deleteCabin,
  );

router
  .route('/:cabinId/duplicate')
  .post(
    authController.protect,
    authController.restrictTo('manager', 'admin'),
    cabinController.createDuplicateCabin,
  );

export default router;
