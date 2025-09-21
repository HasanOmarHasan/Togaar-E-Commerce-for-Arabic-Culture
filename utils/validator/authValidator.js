const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");
const User = require("../../models/userModel");
const ApiError = require("../ApiError");
const { validatorMessage } = require("../../locales/i18n");

exports.signupValidator = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "name" }))
    .bail()
    .isLength({ min: 3 })
    .withMessage(
      validatorMessage("validation.tooShort", { field: "name", min: 3 })
    )
    .bail()
    .isLength({ max: 20 })
    .withMessage(
      validatorMessage("validation.tooLong", { field: "name", max: 20 })
    ),

  check("email")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "email" }))
    .bail()
    .isEmail()
    .withMessage(validatorMessage("validation.invalidEmail"))
    .bail()
    .isLength({ max: 30 })
    .withMessage(
      validatorMessage("validation.tooLong", { field: "email", max: 30 })
    )
    .bail()
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new ApiError(
          req.t("validation.duplicate", { model: req.t("model.email") }),
          401
        );
      }
      return true;
    }),

  check("password")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "password" }))
    .bail()
    .isLength({ min: 6 })
    .withMessage(
      validatorMessage("validation.tooShort", { field: "password", min: 6 })
    )
    .bail()
    .isStrongPassword({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 0,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(validatorMessage("validation.passwordWeak"))
    .bail()
    .custom((password, { req }) => {
      if (password !== req.body.confirmPassword) {
        throw new ApiError(req.t("validation.passwordMismatch"), 401);
      }
      return true;
    }),

  check("confirmPassword")
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "confirmPassword" })
    ),

  validatorMiddleware,
];

exports.loginValidator = [
  check("email")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "email" }))
    .bail()
    .isEmail()
    .withMessage(validatorMessage("validation.invalidEmail"))
    .bail()
    .isLength({ max: 30 })
    .withMessage(
      validatorMessage("validation.tooLong", { field: "email", max: 30 })
    )
    .bail()
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(req.t("validation.invalidCredentials"), 401);
      }
      return true;
    }),

  check("password")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "password" }))
    .bail()
    .isLength({ min: 6 })
    .withMessage(
      validatorMessage("validation.tooShort", { field: "password", min: 6 })
    ),

  validatorMiddleware,
];

exports.forgotPasswordValidator = [
  check("email")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "email" }))
    .bail()
    .isEmail()
    .withMessage(validatorMessage("validation.invalidEmail"))
    .bail()
    .isLength({ max: 30 })
    .withMessage(
      validatorMessage("validation.tooLong", { field: "email", max: 30 })
    )
    .bail()
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(
          req.t("validation.notFound", {
            model: req.t("model.user"),
            id: email,
          }),
          404
        );
      }
      return true;
    }),

  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check("email")
    .isEmail()
    .withMessage(validatorMessage("validation.invalidEmail")),

  check("newPassword")
    .trim()
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "newPassword" })
    )
    .bail()
    .isLength({ min: 6 })
    .withMessage(
      validatorMessage("validation.tooShort", { field: "password", min: 6 })
    )
    .bail()
    .isStrongPassword({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 0,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(validatorMessage("validation.passwordWeak"))
    .bail()
    .custom((password, { req }) => {
      if (password !== req.body.confirmPassword) {
        throw new ApiError(req.t("validation.passwordMismatch"), 401);
      }
      return true;
    }),

  check("confirmPassword")
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "confirmPassword" })
    ),

  validatorMiddleware,
];

exports.verifyResetValidator = [
  check("resetCode")
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "resetCode" })
    )
    .bail()
    .isLength({ min: 6, max: 6 })
    .withMessage(validatorMessage("validation.invalidResetCode")),
  check("email")
    .isEmail()
    .withMessage(validatorMessage("validation.invalidEmail")),

  validatorMiddleware,
];
