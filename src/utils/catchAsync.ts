import { NextFunction, Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
