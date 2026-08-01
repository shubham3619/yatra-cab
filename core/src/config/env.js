// Central, lazily-read access to environment variables shared by both
// backend services. Values are read through getters so they always reflect
// the current process.env — each service loads its own .env (via dotenv)
// BEFORE importing @yatracab/core, and these getters pick that up.

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  get isProd() {
    return this.nodeEnv === 'production';
  },
  get mongoUri() {
    return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yatracab';
  },
  jwt: {
    get accessSecret() {
      return process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';
    },
    get refreshSecret() {
      return process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
    },
    get accessExpires() {
      return process.env.JWT_ACCESS_EXPIRES || '15m';
    },
    get refreshExpires() {
      return process.env.JWT_REFRESH_EXPIRES || '30d';
    },
  },
  otp: {
    get channel() {
      return process.env.OTP_CHANNEL || 'email';
    },
    get gmailUser() {
      return process.env.GMAIL_USER || '';
    },
    get gmailAppPassword() {
      return process.env.GMAIL_APP_PASSWORD || '';
    },
    get fromName() {
      return process.env.OTP_FROM_NAME || 'YatraCab';
    },
    get devOtp() {
      return process.env.DEV_OTP || '123456';
    },
    // Demo mode: skip email entirely, return the code in the API response and
    // accept the fixed devOtp — used on hosts (e.g. Render free) that block
    // outbound SMTP so email OTP can't be delivered.
    get demoMode() {
      return process.env.DEMO_OTP === 'true';
    },
    get ttlMs() {
      return num(process.env.OTP_TTL_MS, 5 * 60 * 1000);
    },
  },
  payment: {
    get provider() {
      return process.env.PAYMENT_PROVIDER || 'mock';
    },
    get razorpayKeyId() {
      return process.env.RAZORPAY_KEY_ID || '';
    },
    get razorpayKeySecret() {
      return process.env.RAZORPAY_KEY_SECRET || '';
    },
  },
  business: {
    get feePercent() {
      return num(process.env.DEFAULT_FEE_PERCENT, 10);
    },
    get freeCancelWindowHours() {
      return num(process.env.FREE_CANCEL_WINDOW_HOURS, 6);
    },
    get cancelProcessingFee() {
      return num(process.env.CANCEL_PROCESSING_FEE, 50);
    },
    // Pay-to-Connect: commission charged to the driver's wallet on accept.
    get commissionPercent() {
      return num(process.env.COMMISSION_PERCENT, 8);
    },
    // Referral rewards.
    get referralSignupPoints() {
      return num(process.env.REFERRAL_SIGNUP_POINTS, 50);
    },
    get driverReferralPercent() {
      return num(process.env.DRIVER_REFERRAL_PERCENT, 10); // % of platform commission
    },
    get pointValue() {
      return num(process.env.POINT_VALUE, 1); // ₹ per point on redemption
    },
    get driverWelcomeCredit() {
      return num(process.env.DRIVER_WELCOME_CREDIT, 200); // free starter wallet credit
    },
  },
  get logLevel() {
    return process.env.LOG_LEVEL || 'info';
  },
};
