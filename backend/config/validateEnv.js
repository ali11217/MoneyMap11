const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'EMAIL_USERNAME',
  'EMAIL_APP_PASSWORD',
  'FRONTEND_URL'
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = validateEnv; 