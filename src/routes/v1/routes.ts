import { Router } from 'express';

import cabinsRouter from './cabinRouter';
import guestRouter from './guestRouter';
import settingRouter from './settingRouter';
import bookingRouter from './bookingRouter';
import userRouter from './userRouter';
import apiKeyRouter from './apiKeyRouter';

const router = Router();

router.use('/cabins', cabinsRouter);
router.use('/guests', guestRouter);
router.use('/settings', settingRouter);
router.use('/bookings', bookingRouter);
router.use('/users', userRouter);
router.use('/api-management', apiKeyRouter);

export default router;
