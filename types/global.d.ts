declare namespace Express {
  interface Request {
    apiKeyValid?: boolean;
    user?: any;
  }
}
