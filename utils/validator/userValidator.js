
// userValidator.js
const bcrypt = require("bcryptjs");
const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");
const User = require("../../models/userModel");
const { validatorMessage } = require("../../locales/i18n");

// ✅ Get User
exports.getUserValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),
  validatorMiddleware,
];

// ✅ Create User
exports.createUserValidator = [
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
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error(req.t("validation.duplicate", { model: req.t("model.email") }));
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
    .custom((password, { req }) => {
      if (password !== req.body.confirmPassword) {
        throw new Error(req.t("validation.passwordMismatch"));
      }
      return true;
    }),

  check("confirmPassword")
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "confirmPassword" })
    ),

  check("phone")
    .trim()
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(validatorMessage("validation.invalidPhone")),

  check("profileImage")
    .optional()
    .isString()
    .withMessage(validatorMessage("validation.invalidURL")),

  check("role")
    .optional()
    .isString()
    .withMessage(validatorMessage("validation.invalidString")),

  validatorMiddleware,
];

// ✅ Update User
exports.updateUserValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("name")
    .trim()
    .optional()
    .isLength({ min: 3 })
    .withMessage(
      validatorMessage("validation.tooShort", { field: "name", min: 3 })
    )
    .bail()
    .isLength({ max: 10 })
    .withMessage(
      validatorMessage("validation.tooLong", { field: "name", max: 10 })
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
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error(req.t("validation.duplicate", { model: req.t("model.email") }));
      }
      return true;
    }),

  check("phone")
    .trim()
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(validatorMessage("validation.invalidPhone")),

  check("profileImage")
    .optional()
    .isString()
    .withMessage(validatorMessage("validation.invalidURL")),

  check("role")
    .optional()
    .isString()
    .withMessage(validatorMessage("validation.invalidString")),

  validatorMiddleware,
];

// ✅ Update Logged User
exports.updateLoggedUserValidator = [
  check("email")
    .trim()
    .optional()
    .isEmail()
    .withMessage(validatorMessage("validation.invalidEmail"))
    .bail()
    .isLength({ min: 5, max: 255 })
    .withMessage(
      validatorMessage("validation.tooLong", { field: "email", max: 255 })
    )
    .custom(async (email, { req }) => {
      if (!email) return true;
      const user = await User.findOne({ email });
      if (user && user._id.toString() !== req.user._id.toString()) {
        throw new Error(req.t("validation.duplicate", { model: req.t("model.email") }));
      }
      return true;
    }),

  check("phone")
    .trim()
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(validatorMessage("validation.invalidPhone")),

  check("profileImage")
    .optional()
    .isString()
    .withMessage(validatorMessage("validation.invalidURL")),

  validatorMiddleware,
];

// ✅ Delete User
exports.deleteUserValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),
  validatorMiddleware,
];

// ✅ Change Password
exports.changePasswordValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("confirmPassword")
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "confirmPassword" })
    ),

  check("currentPassword")
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "currentPassword" })
    ),

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
    .custom(async (password, { req }) => {
      const user = await User.findById(req.params.id).select("+password");
      if (!user)
        throw new Error(
          req.t("validation.notFound", { model: req.t("model.user"), id: req.params.id })
        );
      if (!user.password)
        throw new Error(req.t("validation.required", { field: "password" }));

      const match = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!match) throw new Error(req.t("validation.passwordMismatch"));

      if (password !== req.body.confirmPassword) {
        throw new Error(req.t("validation.passwordMismatch"));
      }
      return true;
    }),

  validatorMiddleware,
];

// ✅ Logged User Change Password
exports.loggedUserchangePasswordValidator = [
  check("confirmPassword")
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "confirmPassword" })
    ),

  check("currentPassword")
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "currentPassword" })
    ),

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
    .custom(async (password, { req }) => {
      const user = await User.findById(req.user._id).select("+password");
      if (!user)
        throw new Error(
          req.t("validation.notFound", { model: req.t("model.user"), id: req.user._id })
        );
      if (!user.password)
        throw new Error(req.t("validation.required", { field: "password" }));

      const match = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!match) throw new Error(req.t("validation.passwordMismatch"));

      if (password !== req.body.confirmPassword) {
        throw new Error(req.t("validation.passwordMismatch"));
      }
      return true;
    }),

  validatorMiddleware,
];
