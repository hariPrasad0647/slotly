
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
});

module.exports = env;

