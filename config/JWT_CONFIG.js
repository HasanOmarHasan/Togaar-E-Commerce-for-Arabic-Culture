const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
};

module.exports = JWT_CONFIG;