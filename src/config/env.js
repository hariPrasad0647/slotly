
const dotenv = require("dotenv");
const { cleanEnv, str, num, bool } = require("envalid");

dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),

  PORT: num({
    default: 5000,
  }),

  DATABASE_URL: str(),

  JWT_SECRET: str(),

  JWT_EXPIRES_IN: str({
    default: "7d",
  }),

  REFRESH_TOKEN_EXPIRES_DAYS: num({
    default: 30,
  }),

  RESET_TOKEN_EXPIRES_IN: str({
    default: "10m",
  }),

  OTP_LENGTH: num({
    default: 6,
  }),

  OTP_EXPIRY_MINUTES: num({
    default: 10,
  }),

  OTP_MAX_ATTEMPTS: num({
    default: 5,
  }),

  BCRYPT_SALT_ROUNDS: num({
    default: 10,
  }),

  FRONTEND_URL: str(),

  BACKEND_URL: str(),

  SMTP_HOST: str(),

  SMTP_PORT: num(),

  SMTP_USER: str(),

  SMTP_PASS: str(),

  SMTP_FROM: str(),

  RAZORPAY_KEY_ID: str(),

  RAZORPAY_KEY_SECRET: str(),

  RAZORPAY_WEBHOOK_SECRET: str(),

  PAYMENT_HOLD_MINUTES: num({
    default: 15,
  }),

  REDIS_URL: str({
    default: "",
  }),

  ZOOM_CLIENT_ID: str({
    default: "",
  }),

  ZOOM_CLIENT_SECRET: str({
    default: "",
  }),

  ZOOM_ACCOUNT_ID: str({
    default: "",
  }),

  ENABLE_JOBS: bool({
    default: true,
  }),

  REMINDER_CRON: str({
    default: "*/5 * * * *",
  }),

  DAILY_AGENDA_CRON: str({
    default: "0 6 * * *",
  }),
});

module.exports = env;

