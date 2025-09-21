
const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");
const { validatorMessage } = require("../../locales/i18n");

exports.addAddressValidator = [
  // Alias validation
  check("alias")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "alias" }))
    .isLength({ min: 2, max: 20 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "alias",
        min: 2,
        max: 20,
      })
    )
    .trim(),

  // Phone validation
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(validatorMessage("validation.invalidPhone")),

  // Address validation
  check("address")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "address" }))
    .isLength({ min: 5, max: 200 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "address",
        min: 5,
        max: 200,
      })
    )
    .trim(),

  // City validation
  check("city")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "city",
        min: 2,
        max: 50,
      })
    )
    .trim(),

  // State validation
  check("state")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "state",
        min: 2,
        max: 50,
      })
    )
    .trim(),

  // Postal code validation
  check("postalCode")
    .optional()
    .isPostalCode("any")
    .withMessage(validatorMessage("validation.invalidPostalCode"))
    .isInt({ min: 10000, max: 9999999 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "postalCode",
        min: 5,
        max: 7,
      })
    ),

  validatorMiddleware,
];

exports.updateAddressValidator = [
  // Address ID validation
  check("addressId")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  // Alias validation
  check("alias")
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "alias",
        min: 2,
        max: 20,
      })
    )
    .trim(),

  // Phone validation
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(validatorMessage("validation.invalidPhone")),

  // Address validation
  check("address")
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "address",
        min: 5,
        max: 200,
      })
    )
    .trim(),

  // City validation
  check("city")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "city",
        min: 2,
        max: 50,
      })
    )
    .trim(),

  // State validation
  check("state")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "state",
        min: 2,
        max: 50,
      })
    )
    .trim(),

  // Postal code validation
  check("postalCode")
    .optional()
    .isPostalCode("any")
    .withMessage(validatorMessage("validation.invalidPostalCode"))
    .isInt({ min: 100000, max: 999999 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "postalCode",
        min: 6,
        max: 6,
      })
    ),

  validatorMiddleware,
];

// ==================== REMOVE ADDRESS VALIDATOR ====================
exports.removeAddressValidator = [
  check("addressId")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  validatorMiddleware,
];
