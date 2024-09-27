import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';

import globalErrorHandler from './controllers/errorController';
import config from './lib/config/config';
import { errorHandler, successHandler } from './lib/logger/morgan';
import routes from './routes/v1/routes';
import AppError from './utils/AppError';
import xssSanitize from './utils/xssSanitize';

const allowlist: string[] = [];

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  legacyHeaders: false,
  standardHeaders: 'draft-7',
  skip: (req) => {
    if (!req.ip) return false;
    return allowlist.includes(req.ip);
  },
});

function createApp() {
  const app = express();

  // helmet for setting secure http response headers
  app.use(helmet());

  // cross origin resource sharing
  app.use(
    cors({
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ],
      credentials: true,
    }),
  );

  // logger
  if (config.env !== 'test') {
    app.use(successHandler);
    app.use(errorHandler);
  }

  // limit requests
  app.use(limiter);

  // parse cookies with cookie-parser
  app.use(cookieParser(config.cookie.secret));

  // parse json request body
  app.use(express.json({ limit: '10kb' }));

  // data sanitization against NOSQL query injection
  app.use(mongoSanitize());

  // data sanitization against XSS
  app.use(xssSanitize());

  // prevent parameter pollution
  app.use(
    hpp({
      whitelist: [
        // bookings model
        'numNights',
        'numGuests',
        'cabinPrice',
        'extrasPrice',
        'totalPrice',
        'status',
        // cabins model
        'name',
        'maxCapacity',
        'regularPrice',
        'discount',
      ],
    }),
  );

  // compress json response
  app.use(compression());

  // mount v1 api routes
  app.use('/api/v1', routes);

  // handling unhandled routes
  app.use('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  // error handling middleware
  app.use(globalErrorHandler);

  return app;
}

export default createApp;
