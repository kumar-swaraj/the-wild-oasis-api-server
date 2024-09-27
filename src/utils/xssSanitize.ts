/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { NextFunction, Request, Response } from 'express';
import xss from 'xss';

const sanitizeInput = (input: any) => {
  if (typeof input === 'string') {
    return xss(input);
  }
  if (typeof input === 'object' && input !== null) {
    Object.keys(input).forEach((key) => {
      input[key] = sanitizeInput(input[key]);
    });
  }

  return input;
};

const xssSanitize = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) req.body = sanitizeInput(req.body);
    if (req.query) req.query = sanitizeInput(req.query);
    if (req.params) req.params = sanitizeInput(req.params);

    next();
  };
};

export default xssSanitize;
