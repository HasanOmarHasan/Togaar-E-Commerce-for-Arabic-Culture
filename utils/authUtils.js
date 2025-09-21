const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const sendEmail = require("./sendEmail");
const ApiError = require("./ApiError");
const User = require("../models/userModel");

// Default JWT configuration

const JWT_CONFIG = require("../config/JWT_CONFIG");

exports.generateAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      type: "access",
    },
    JWT_CONFIG.SECRET,
    {
      expiresIn: JWT_CONFIG.EXPIRES_IN,
    }
  );

exports.generateRefreshToken = (user) =>
  // Generate refresh token
  jwt.sign(
    {
      id: user._id,
      type: "refresh",
    },
    JWT_CONFIG.REFRESH_SECRET,
    {
      expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
    }
  );

exports.setRefreshTokenCookie = (res, refreshToken) =>
  // Set refresh token in HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

// verify token , user exists , password changed
exports.verifyToken = asyncHandler(
  async (token, req, next, tokenType = "access") => {
    const secure =
      tokenType === "access" ? JWT_CONFIG.SECRET : JWT_CONFIG.REFRESH_SECRET;

    if (!token) {
      return next(new ApiError(req.t("http.authTokenNotFound"), 401));
    }
    // verify token
    const decoded = jwt.verify(token, secure);

    // Check if user still exists
    const user = await User.findById(decoded.id).select(
      "+passwordChangedAt +isActive +deactivatedAt"
    );

    if (!user) {
      return next(
        new ApiError(
          req.t("http.notFound", {
            model: req.t("model.user"),
            id: decoded.id,
          }),
          401
        )
      );
    }

    if (user.isActive === false) {
      const allowedRoutes = ["/api/v1/users/reactivate/"];
      if (allowedRoutes.includes(req.originalUrl)) {
        return user;
      }

      const daysSinceDeactivation = Math.floor(
        (new Date() - user.deactivatedAt) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceDeactivation > 30) {
        return next(
          new ApiError(
            "Our hearts are heavy 💔 - Your account was permanently deleted after 30 days of inactivity. " +
              "But every ending is a new beginning! Would you like to create a new account and start fresh? Or call support",
            410
          )
        );
      }

      return next(
        new ApiError(
          "Your account is taking a little break 😴 - It's already deactivated but waiting for your return! " +
            `You have ${30 - daysSinceDeactivation} days left to log in and pick up right where you left off.`,
          409
        )
      );
    }

    // Check if user changed password after token was issued
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(
        user.passwordChangedAt.getTime() / 1000,
        10
      );

      if (changedTimestamp > decoded.iat) {
        return next(
          new ApiError("Password changed recently. Please login again.", 401)
        );
      }
    }
    return user;
  }
);

exports.generateResetPasswordToken = async (user) => {
  const resetPasswordToken = crypto.randomBytes(3).toString("hex");
  const hashedResetPasswordToken = crypto
    .createHash("sha256")
    .update(resetPasswordToken)
    .digest("hex");

  user.passwordResetCode = hashedResetPasswordToken;
  user.passwordResetExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

  await user.save();
  return resetPasswordToken;
};

exports.sendResetPasswordEmail = async (user, resetPasswordToken, req) => {
  const message = `
${req.t("resetVerification.greeting", { name: user.name })}

${req.t("resetVerification.intro")}

${req.t("resetVerification.codeLabel")} ${resetPasswordToken}

${req.t("resetVerification.warningTitle")}
- ${req.t("resetVerification.expiry", { minutes: 5 })}
- ${req.t("resetVerification.noShare")}
- ${req.t("resetVerification.codeInstruction")}

${req.t("resetVerification.securityNote")}

${req.t("resetVerification.outro")}

${req.t("resetVerification.team")}
${req.t("resetVerification.support")}: support@ecommerce.com
    `.trim();

  const htmlMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        /* Base styles */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f7f9fc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .email-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        
        .email-body {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d3748;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 25px;
            line-height: 1.8;
        }
        
        .code-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 2px dashed #e2e8f0;
        }
        
        .code-label {
            font-size: 14px;
            color: #718096;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .reset-code {
            font-size: 32px;
            font-weight: 700;
            color: #2d3748;
            letter-spacing: 3px;
            padding: 15px;
            background-color: #ffffff;
            border-radius: 6px;
            margin: 10px 0;
            display: inline-block;
            border: 2px solid #e2e8f0;
            font-family: 'Courier New', monospace;
        }
        
        .warning {
            background-color: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
            text-align: center;
        }
        
        .warning-icon {
            color: #e53e3e;
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .expiry {
            color: #e53e3e;
            font-weight: 600;
            font-size: 16px;
        }
        
        .footer {
            text-align: center;
            padding: 25px 20px;
            background-color: #edf2f7;
            color: #718096;
            font-size: 14px;
        }
        
        .brand {
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 10px;
        }
        
        .support {
            margin-top: 15px;
            font-size: 13px;
        }
        
        .support a {
            color: #667eea;
            text-decoration: none;
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
            .email-body {
                padding: 25px 20px;
            }
            
            .reset-code {
                font-size: 24px;
                padding: 12px;
            }
            
            .email-header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>${req.t("resetVerification.header")}</h1>
        </div>
        
        <div class="email-body">
            <div class="greeting">${req.t("resetVerification.greeting", { name: user.name })},</div>
            
            <div class="message">
               ${req.t("resetVerification.intro")}
            </div>
            
            <div class="code-container">
                <div class="code-label">${req.t("resetVerification.codeLabel")}</div>
                <div class="reset-code">${resetPasswordToken}</div>
                <div class="code-label">${req.t("resetVerification.codeInstruction")}</div>
            </div>
            
            <div class="warning">
                <div class="warning-icon">${req.t("resetVerification.warningTitle")}</div>
                <div class="message">

                    ${req.t("resetVerification.expiry", { minutes: `<span class="expiry">5 minutes</span>` })}
                    
                    . 
                    ${req.t("resetVerification.noShare")}
                </div>
            </div>
            
            <div class="message">
               ${req.t("resetVerification.securityNote")}
                 <p>${req.t("resetVerification.outro")}</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="brand">${req.t("resetVerification.team")}</div>
            <div>${req.t("resetVerification.thanks")}</div>
            <div class="support">
                Need help? <a href="mailto:support@ecommerce.com">${req.t("resetVerification.support")}:</a>
            </div>
        </div>
    </div>
</body>
</html>
    `;

  try {
    await sendEmail({
      email: user.email,
      subject: req.t("resetVerification.subject"),
      message,
      html: htmlMessage,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    throw new ApiError(
      "There was an error sending the email. Please try again later.",
      500
    );
  }
};

exports.verifyResetPasswordToken = async (
  user,
  resetCode,
  next,
) => {
  if (!user) {
    return next(new ApiError(`Invalid or expired reset code.`, 400));
  }

  // check lock
  if (user.otpLockUntil && user.otpLockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.otpLockUntil - Date.now()) / 60000);
    return next(
      new ApiError(
        `Too many attempts. Try again in ${minutesLeft} minute(s)`,
        429
      )
    );
  }


  // check expiry
  if (
    !user.passwordResetCode ||
    !user.passwordResetExpires ||
    (user.passwordResetExpires && user.passwordResetExpires < Date.now())
  ) {
    return next(new ApiError("Invalid or expired reset code", 400));
  }

  const hashedResetPassword = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  if (hashedResetPassword !== user.passwordResetCode) {
    // wrong attempt
    user.otpAttempts = (user.otpAttempts || 0) + 1;

    if (user.otpAttempts === 5) {
      // lock for 5 minutes
      user.otpLockUntil = Date.now() + 5 * 60 * 1000;
    } else if (user.otpAttempts === 10) {
      // lock for 10 minutes
      user.otpLockUntil = Date.now() + 10 * 60 * 1000;
    } else if (user.otpAttempts === 15) {
      // lock for 15 minutes
      user.otpLockUntil = Date.now() + 15 * 60 * 1000;
    }

    await user.save({ validateBeforeSave: false });

    return next(new ApiError(`Invalid reset code`, 400));
  }

  return true;
};
