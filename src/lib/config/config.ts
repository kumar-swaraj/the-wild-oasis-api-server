import path from 'node:path';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config({
  path: path.join(__dirname, '../../../.env.local'),
});

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .required(),
    HOSTNAME: Joi.string().required(),
    PORT: Joi.number().default(8000),
    CLIENT_STAFF_APP_URL: Joi.string()
      .required()
      .description('Client URL for staff app'),
    COOKIE_SECRET: Joi.string()
      .min(32)
      .required()
      .description('Signed cookie secret'),
    MONGODB_URL: Joi.string().required().description('MongoDB URL'),
    SUPABASE_PROJECT_URL: Joi.string()
      .required()
      .description('Supabase Project URL'),
    SUPABASE_ANON_KEY: Joi.string()
      .required()
      .description('Supabase Public Key'),
    SUPABASE_STORAGE_ADDRESS: Joi.string()
      .required()
      .description('Supabase Storage URL'),
    JWT_SECRET: Joi.string().min(32).required().description('JWT secret key'),
    JWT_EXPIRES_IN: Joi.string()
      .default('90d')
      .description('days after which access token will expire'),
    JWT_COOKIE_EXPIRES_IN: Joi.number()
      .default(90)
      .description('days after which cookie will expire'),
    RESET_PASSWORD_TOKEN_EXPIRES_IN_MINS: Joi.number()
      .default(10)
      .description('mins after which reset password token will expire'),
    EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_HRS: Joi.number()
      .default(24)
      .description('hrs after which email verification token will expire'),

    MAILTRAP_SMTP_HOST: Joi.string().description('MAILTRAP SMTP Host'),
    MAILTRAP_SMTP_PORT: Joi.number().description('MAILTRAP SMTP Port'),
    MAILTRAP_SMTP_USERNAME: Joi.string().description('MAILTRAP SMTP Username'),
    MAILTRAP_SMTP_PASSWORD: Joi.string().description('MAILTRAP SMTP Password'),

    EMAIL_FROM: Joi.string().description(
      'all email send from this email address',
    ),

    APIKEY_EXPIRES_IN_DAYS: Joi.number().description('API key expires in days'),
    HMAC_SECRET: Joi.string()
      .min(32)
      .description('HMAC secret for creating and verifying API key '),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  hostname: envVars.HOSTNAME,
  port: envVars.PORT,
  cookie: {
    secret: envVars.COOKIE_SECRET,
  },
  client: {
    staffAppUrl: envVars.CLIENT_STAFF_APP_URL,
  },
  mongoose: {
    url: envVars.MONGODB_URL,
  },
  supabase: {
    url: envVars.SUPABASE_PROJECT_URL,
    publicApiKey: envVars.SUPABASE_ANON_KEY,
    storageUrl: envVars.SUPABASE_STORAGE_ADDRESS,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpiration: envVars.JWT_EXPIRES_IN,
    cookieExpiration: envVars.JWT_COOKIE_EXPIRES_IN,
  },
  resetPasswordToken: {
    expiresInMins: envVars.RESET_PASSWORD_TOKEN_EXPIRES_IN_MINS,
  },
  emailVerificationToken: {
    expiresInHrs: envVars.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_HRS,
  },
  mailtrapEmailTesting: {
    smtpHost: envVars.MAILTRAP_SMTP_HOST,
    smtpPort: envVars.MAILTRAP_SMTP_PORT,
    smtpUsername: envVars.MAILTRAP_SMTP_USERNAME,
    smtpPassword: envVars.MAILTRAP_SMTP_PASSWORD,
  },
  emailFrom: envVars.EMAIL_FROM,
  apiKey: {
    expiresInDays: envVars.APIKEY_EXPIRES_IN_DAYS,
    hmacSecret: envVars.HMAC_SECRET,
  },
};

export default config;
