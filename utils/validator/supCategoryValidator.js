
const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");
const { validatorMessage } = require("../../locales/i18n");

exports.getSupCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),
  validatorMiddleware,
];

exports.createSupCategoryValidator = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "name" }))
    .isLength({ min: 2 })
    .withMessage(
      validatorMessage("validation.tooShort", { field: "name", min: 2 })
    )
    .isLength({ max: 30 })
    .withMessage(
      validatorMessage("validation.tooLong", { field: "name", max: 30 })
    ),

  check("category")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "category" }))
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  validatorMiddleware,
];

exports.updateSupCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("category")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "category" }))
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("name")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "name" }))
    .isLength({ min: 2 })
    .withMessage(
      validatorMessage("validation.tooShort", { field: "name", min: 2 })
    )
    .isLength({ max: 30 })
    .withMessage(
      validatorMessage("validation.tooLong", { field: "name", max: 30 })
    ),

  validatorMiddleware,
];

exports.deleteSupCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),
  validatorMiddleware,
];
