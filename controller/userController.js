const asyncHandler = require("express-async-handler");
const dcrypt = require("bcryptjs");
const User = require("../models/userModel");
const factory = require("./handlersFactory");
const {
  uploadSingleImage,
  MainOptimizeImage,
} = require("../Middleware/uploadImageMiddleware");
const ApiError = require("../utils/ApiError");
const { caches, generateCacheKey } = require("../utils/cashe");

const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} = require("../utils/authUtils");
const JWT_CONFIG = require("../config/JWT_CONFIG");
const sendEmail = require("../utils/sendEmail");

// @des     upload user profile image
exports.uploadUserImage = uploadSingleImage("profileImage");
exports.optimizeImage = MainOptimizeImage("users", "profileImage", 400, 400);

// @des     get list of user
// @route   Get /api/v1/users/
// @access  private (Admin)
// @prams page , limit
exports.getUsers = factory.getAll(User);

// @des     get spicefic user by id
// @route   Get /api/v1/users/:id
// @access  private (Admin)
exports.getUser = factory.getOne(User);

// @des     create user
// @route   Post /api/v1/users/
// @access  private (Admin)
exports.createUser = factory.createOne(User);

// @des     update spicefic user by id
// @route   Put /api/v1/users/:id:
// @access  Privet (Admin)
exports.updateUser = factory.updateOne(User, [
  "name",
  "email",
  "role",
  "phone",
  "profileImage",
]);

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const docment = await User.findOneAndUpdate(
    { _id: id },
    { password: await dcrypt.hash(req.body.password, 12) },
    {
      new: true,
    }
  );
  if (!docment) {
    return next(new ApiError(req.t("http.notFound" , { model: req.t("model.user"), id }), 404));
  }
  res.status(200).json({status: req.t("http.success"), message: req.t("http.passwordUpdated"), data: docment });
});

// @des     Delete spicefic user by id for ever
// @route   Delete /api/v1/users/:id:
// @access  Privet (Admin)
exports.deleteUser = factory.deleteOne(User);

// @des     get logged user data
// @route   Get /api/v1/users/getMe
// @access  puplic (user)
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {

  req.params.id = req.user._id;
  next();
});

// @des     update logged user data
// @route   patch /api/v1/users/updateMe
// @access  puplic (user)
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const docment = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      profileImage: req.body.profileImage,
    },
    {
      new: true,
    }
  );
  if (!docment || docment.isActive === false) {
    return next(new ApiError(req.t("http.notFound" , { model: req.t("model.user"), id: req.user._id }), 404));
  }
  caches.longTermCache_30Days.delete(generateCacheKey("user", req.user._id));
  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.updated"),
    data: {
      user: {
        id: docment._id,
        name: docment.name,
        email: docment.email,
        role: docment.role,
      },
    },
  });
});

// @des     update logged user password
// @route   patch /api/v1/users/updateMyPassword
// @access  puplic (user)
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  const docment = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await dcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  if (!docment || docment.isActive === false) {
    return next(new ApiError(req.t("http.notFound" , { model: req.t("model.user"), id: req.user._id }), 404));
  }
  caches.longTermCache_30Days.delete(generateCacheKey("user", req.user._id));

  const accessToken = generateAccessToken(docment);
  const refreshToken = generateRefreshToken(docment);
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.passwordUpdated"),
    data: {
      user: {
        id: docment._id,
        name: docment.name,
        email: docment.email,
        role: docment.role,
      },
      accessToken: {
        token: accessToken,
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        type: "bearer",
      },
    },
  });
});

// @des     deactivate logged user data
// @route   Delete /api/v1/users/deactivate
// @access  puplic (user)
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(
      new ApiError(req.t("http.notFound", { model: req.t("model.user") }), 400)
    );
  }

  if (user.isActive === false) {
    return next(new ApiError(req.t("http.userAlreadyDeactivated"), 409));
  }

  const { password } = req.body;
  const isMatch = await dcrypt.compare(password, user.password);

  if (!password) {
    return next(new ApiError(req.t("http.passwordRequired"), 401));
  }
  if (!isMatch && user.isActive === true) {
    return next(
      new ApiError(
        req.t("http.incorrectPassword"),

        401
      )
    );
  }

  await User.findByIdAndUpdate(req.user._id, {
    isActive: false,
    deactivatedAt: new Date(),
  });

  caches.longTermCache_30Days.delete(generateCacheKey("user", req.user._id));

  const subject = req.t("deactivation.subject");
  const htmlMessage = `
  <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .heart {
            color: #ff6b6b;
            font-size: 24px;
            margin: 0 5px;
        }
        .emoji {
            font-size: 24px;
            margin-right: 10px;
        }
        .message-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
        }
        .important {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
        .signature {
            font-style: italic;
            color: #667eea;
            margin-top: 20px;
        }
    </style>
</head>
<body>

    <div class="container">
      <div class="header">
        <h1>${req.t("deactivation.header")}</h1>
      </div>
      <p>${req.t("deactivation.greeting", { name: user.name })}</p>
      <p>${req.t("deactivation.intro")}</p>

      <div class="message-box">
        <h3>${req.t("deactivation.accountDetails")}</h3>
        <p><strong>${req.t("deactivation.email")}:</strong> ${user.email}</p>
        <p><strong>${req.t("deactivation.date")}:</strong> ${new Date().toLocaleDateString(
          req.locale, // 👈 دي من i18next
          { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        )}</p>
      </div>

      <div class="important">
        <h3>${req.t("deactivation.importantHeader")}</h3>
        <p>${req.t("deactivation.importantText1")}</p>
        <p>${req.t("deactivation.importantText2")}</p>
      </div>

      <center>
        <a href="${process.env.BASE_URL}/login" class="button">
          ${req.t("deactivation.button")}
        </a>
      </center>

      <p>${req.t("deactivation.finalWarning")}</p>
      <p>${req.t("deactivation.goodbye")}</p>

      <div class="signature">
        <p>${req.t("deactivation.signatureThanks")}</p>
        <p><strong>${req.t("deactivation.team", { appName: process.env.APP_NAME || "Our Community" })}</strong></p>
        <p>${req.t("deactivation.motivation")}</p>
      </div>

      <div class="footer">
        <p>${req.t("deactivation.support")}</p>
        <p>${req.t("deactivation.copyright", {
          year: new Date().getFullYear(),
          appName: process.env.APP_NAME || "Our Service",
        })}</p>
      </div>
    </div>

</body>
</html>
  `;

  const plainTextMessage = `
${req.t("deactivation.greeting", { name: user.name })}

${req.t("deactivation.intro")}

📅 ${req.t("deactivation.accountDetails")}
${req.t("deactivation.email")}: ${user.email}
${req.t("deactivation.date")}: ${new Date().toLocaleDateString()}

⏰ ${req.t("deactivation.importantHeader")}
${req.t("deactivation.importantText1").replace(/<[^>]*>?/gm, "")}
${req.t("deactivation.importantText2").replace(/<[^>]*>?/gm, "")}

🔗 ${req.t("deactivation.button")}: ${process.env.BASE_URL}/login

${req.t("deactivation.finalWarning")}
${req.t("deactivation.goodbye")}

${req.t("deactivation.signatureThanks")}
${req.t("deactivation.team", { appName: process.env.APP_NAME || "Our Community" })}
${req.t("deactivation.motivation")}

${req.t("deactivation.support")}
  `.trim();

  await sendEmail({
    email: user.email,
    subject,
    message: plainTextMessage,
    html: htmlMessage,
  });

  // Invalidate current session
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("deactivation.header"),
    data: {
      deactivatedAt: user.deactivatedAt,
      reactivationWindow: "30 days",
      note: req.t("deactivation.finalWarning"),
    },
  });
});

// @des     ReActive logged user data
// @route   put /api/v1/users/reactivate
// @access  puplic (user)
exports.ActiveLoggedUserData = asyncHandler(async (req, res, next) => {
  if (req.user.isActive === true) {
    return next(new ApiError(req.t("http.userAlreadyActive"), 400));
  }

  const user = await User.findByIdAndUpdate(req.user._id, {
    isActive: true,
    deactivatedAt: undefined,
  });

  if (!user) {
    return next(
      new ApiError(
        req.t("http.notFound", {
          model: req.t("model.user"),
          id: req.user._id,
        }),
        404
      )
    );
  }

  caches.longTermCache_30Days.delete(generateCacheKey("user", req.user._id));

  const subject = req.t("activation.subject", { name: user.name });
  const htmlMessage = `
    <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
              background: white;
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              border: 1px solid #e0e0e0;
          }
          .header {
              text-align: center;
              margin-bottom: 30px;
          }
          .welcome {
              color: #28a745;
              font-size: 24px;
              margin: 0 5px;
          }
          .emoji {
              font-size: 24px;
              margin-right: 10px;
          }
          .message-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              border-left: 4px solid #28a745;
              margin: 20px 0;
          }
          .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
          }
          .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
          }
      </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${req.t("activation.header", { name: user.name })}</h1>
      </div>
      <p>${req.t("activation.intro")}</p>

      <div class="message-box">
        <h3>${req.t("activation.detailsHeader")}</h3>
        <p><strong>${req.t("activation.reactivatedOn")}:</strong> ${new Date().toLocaleDateString(
          req.locale,
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )}</p>
        <p><strong>${req.t("activation.status")}:</strong> ${req.t("activation.activeStatus")}</p>
      </div>

      <center>
        <a href="${process.env.BASE_URL}/dashboard" class="button">
          ${req.t("activation.button")}
        </a>
      </center>

      <p>${req.t("activation.outro1")}</p>
      <p>${req.t("activation.outro2")}</p>

      <div class="footer">
        <p>${req.t("activation.footer", { appName: process.env.APP_NAME || "Our Community" })}</p>
        <p>${req.t("activation.copyright", {
          year: new Date().getFullYear(),
          appName: process.env.APP_NAME || "Our Service",
        })}</p>
      </div>
    </div>
      </body>
  </html>
  `;

  const plainTextMessage = `
${req.t("activation.header", { name: user.name })}

${req.t("activation.intro")}

✅ ${req.t("activation.detailsHeader")}
${req.t("activation.reactivatedOn")}: ${new Date().toLocaleDateString()}
${req.t("activation.status")}: ${req.t("activation.activeStatus")}

🔗 ${req.t("activation.button")}: ${process.env.BASE_URL}/dashboard

${req.t("activation.outro1")}
${req.t("activation.outro2")}

${req.t("activation.footer", { appName: process.env.APP_NAME || "Our Community" })}
  `.trim();

  await sendEmail({
    email: user.email,
    subject,
    message: plainTextMessage,
    html: htmlMessage,
  });

  // 3. GENERATE NEW TOKENS
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 4. SET NEW COOKIE
  setRefreshTokenCookie(res, refreshToken);
  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.accountReactivated"),
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
    accessToken: {
      token: accessToken,
      expiresIn: JWT_CONFIG.EXPIRES_IN,
      type: "bearer",
    },
  });
});

// @des     change user language
// @route   PUT /api/v1/users/language
// @access  private (user)
exports.changeLanguage = asyncHandler(async (req, res, next) => {
  const { language } = req.body;

  const supportedLanguages = req.i18n.options.supportedLngs;

  const filteredLangs = supportedLanguages.filter((lang) => lang !== "cimode");


  if (!filteredLangs.includes(language)) {
    return next(new ApiError(req.t("http.language_not_supported"), 400));
  }

  if (req.user && req.user.language !== language) {
    caches.longTermCache_30Days.delete(generateCacheKey("user", req.user._id));

    await User.findByIdAndUpdate(req.user._id, { language });
  }

  await req.i18n.changeLanguage(language);


  res.cookie("language", language, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.language_changed", { language }),
    data: { language },
  });
});
