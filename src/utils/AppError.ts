class AppError extends Error {
  public statusCode: number;

  public status: string;

  public isOperational = true;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = Math.floor((statusCode / 100) % 10) === 4 ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
