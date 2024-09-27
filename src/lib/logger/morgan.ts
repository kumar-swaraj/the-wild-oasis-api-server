import morgan from 'morgan';
import config from '../config/config';
import { Response } from 'express';
import logger from './logger';

morgan.token(
  'message',
  (req, res: Response) => (res.locals.errorMessage as string | undefined) ?? '',
);

const getIpFormat = () =>
  config.env === 'production' ? ':remote-addr - ' : '';
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

export const successHandler = morgan(successResponseFormat, {
  skip(req, res) {
    return res.statusCode >= 400;
  },
  stream: { write: (message: string) => logger.info(message.trim()) },
});

export const errorHandler = morgan(errorResponseFormat, {
  skip(req, res) {
    return res.statusCode < 400;
  },
  stream: { write: (message: string) => logger.error(message.trim()) },
});
