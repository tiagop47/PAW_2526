const dotenv = require('dotenv');

dotenv.config();

const parseIntOr = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
    NODE_ENV,
    IS_PRODUCTION: NODE_ENV === 'production',
    MONGODB_URI: process.env.MONGODB_URI,
    CAPTCHA_API_KEY: process.env.CAPTCHA_API_KEY,
    CAPTCHA_API_SECRET: process.env.CAPTCHA_API_SECRET,
    JWT_SECRET: process.env.JWT_SECRET || 'fallback',
    SALT_ROUNDS: parseIntOr(process.env.SALT_ROUNDS, 10),
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    EMAIL_PORT: parseIntOr(process.env.EMAIL_PORT, 587),
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS
};
