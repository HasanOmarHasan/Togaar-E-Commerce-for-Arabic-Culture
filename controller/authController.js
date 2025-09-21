const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const dcrypt = require("bcryptjs");
const User = require("../models/userModel");
const ApiError = require("../utils/ApiError");
const { caches, generateCacheKey } = require("../utils/cashe");
// const sendEmail = require("../utils/sendEmail");
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  verifyToken,
  generateResetPasswordToken,
  sendResetPasswordEmail,
  verifyResetPasswordToken,
} = require("../utils/authUtils");
const JWT_CONFIG = require("../config/JWT_CONFIG");

// @des     Register user
// @route   Post /api/v1/auth/signup/
// @access  public
exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
  });

  //  Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  //  Set refresh token in HTTP-only cookie
  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    status: req.t("http.success"),
    message: req.t("http.created", { field: req.t("model.user") }),
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: {
        token: accessToken,
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        type: "bearer",
      },
    },
  });
});

// @des     Login user
// @route   Post /api/v1/auth/login/
// @access  public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const MAX_ATTEMPTS = 3;
  const LOCK_TIME = 1 * 60 * 1000; // 5 minutes

  const user = await User.findOne({ email }).select(
    "+password +isActive +loginAttempts +lockUntil +deactivatedAt"
  );

  if (!user) {
    return next(new ApiError(req.t("http.authInvalid"), 401));
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return next(
      new ApiError(req.t("http.authLocked", { time: remainingTime }), 429)
    );
  }

  const isPasswordCorrect = await dcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_TIME;
    }

    await user.save();
    return next(new ApiError(req.t("http.authInvalid"), 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  if (user.isActive === false) {
    // Check if deactivation period expired
    const deactivationPeriod =
      Date.now() - new Date(user.deactivatedAt).getTime();
    const daysDeactivated = Math.floor(
      deactivationPeriod / (1000 * 60 * 60 * 24)
    );

    if (daysDeactivated > 30) {
      return res.status(410).json({
        status: "permanently_deleted",
        message:
          "Account was permanently deleted after 30 days of deactivation. Please contact support if you need to reactivate your account.",
        data: {
          action: "call support",
        },
      });
    }

    const reactivationToken = jwt.sign(
      {
        id: user._id,
        purpose: "reactivation",
      },
      JWT_CONFIG.SECRET,
      {
        expiresIn: "5m",
      }
    );
    return res.status(403).json({
      status: "inactive",
      message: "Account is deactivated. Would you like to reactivate?",
      data: {
        accessToken: {
          token: reactivationToken,
          expiresIn: "5m",
          type: "bearer",
          permissions: ["reactivate_account"], // Limited scope
          deactivatedSince: `${daysDeactivated} days ago`,
          daysRemaining: `${30 - daysDeactivated} days until permanent deletion`,
        },
      },
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set refresh token in HTTP-only cookie
  setRefreshTokenCookie(res, refreshToken);

  caches.longTermCache_30Days.set(generateCacheKey("user", user._id), {
    id: user._id,
    name: user.name,
    email: user.email,
    wishList: user.wishList,
    profileImage: user.profileImage,
    language: user.language,
  });

  await req.i18n.changeLanguage(user.language);

  res.cookie("language", user.language, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.authLogin"),
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        wishList: user.wishList,
        profileImage: user.profileImage,
        language: user.language,
        // role: user.role,
      },
      accessToken: {
        token: accessToken,
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        type: "bearer",
      },
    },
  });
});

// @des     Get access token from refresh token
// @route   Post /api/v1/auth/refreshToken/
// @access  public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.headers.cookie.split("=")[1];

  if (!refreshToken) {
    return next(new ApiError("Refresh token not found", 401));
  }

  const user = await verifyToken(refreshToken, req, next, "refreshToken");

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  setRefreshTokenCookie(res, newRefreshToken);

  res.status(200).json({
    status: "success",
    message: "Access token refreshed successfully",
    data: {
      accessToken: {
        token: accessToken,
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        type: "bearer",
      },
    },
  });
});

// @des     Token Verification Middleware
// @route   Post /api/v1/auth/Protect/
// @access  private
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  const user = await verifyToken(token, req, next);

  req.user = user;
  next();
});

// @desc    Logout user to clear cookie
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  if (req.headers.cookie === undefined) {
    return next(new ApiError("Refresh token not found", 401));
  }
  if (!req.headers.cookie.split("=")[0] === "refreshToken") {
    return next(new ApiError("Refresh token not found", 401));
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    status: req.t("http.success"),
    message: "Logged out successfully",
  });
});

// @desc    Authorization User Permissions
exports.allowsTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `Access denied. User role '${req.user.role}' is not allowed. ` +
            `Required roles: ${roles.join(", ")}`,
          403
        )
      );
    }

    next();
  });

// @desc    Forget Password
// @route   POST /api/v1/auth/forgetPassword
// @access  Public
exports.ForgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Generate reset password token
  const resetPasswordToken = await generateResetPasswordToken(user);

  // Send email with reset password link
  await sendResetPasswordEmail(user, resetPasswordToken, req);

  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.authForgetPassword"),
  });
});

// @desc    Verify Reset Password Code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.VerifyResetCode = asyncHandler(async (req, res, next) => {
  const { resetCode, email } = req.body;

  const user = await User.findOne({
    email,
  }).select(
    "+passwordResetCode +passwordResetExpires +otpAttempts +otpLockUntil +otpVerified"
  );

  await verifyResetPasswordToken(user, resetCode, next);

  user.otpVerified = true;
  user.otpAttempts = 0;
  user.otpLockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  const timeRemaining = Math.floor(
    (new Date(user.passwordResetExpires) - Date.now()) / 60000
  );

  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.authResetCode", { timeRemaining }),
  });
});

// @desc    Reset Password
// @route   POST /api/v1/auth/resetPassword
// @access  Public
exports.ResetPassword = asyncHandler(async (req, res, next) => {
  const { newPassword, resetCode, email } = req.body;

  const user = await User.findOne({
    email,
  }).select(
    "+password +passwordResetCode +passwordResetExpires +passwordChangedAt +otpAttempts +otpLockUntil +otpVerified"
  );

  await verifyResetPasswordToken(user, resetCode, next);

  const isSamePassword = await dcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return next(
      new ApiError("New password cannot be the same as current password", 400)
    );
  }

  user.password = newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.otpVerified = false;
  user.otpAttempts = 0;
  user.otpLockUntil = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set refresh token in HTTP-only cookie
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    status: req.t("http.success"),
    message: "Password reset successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        passwordChangedAt: user.passwordChangedAt,
      },
      accessToken: {
        token: accessToken,
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        type: "bearer",
      },
    },
  });
});
