const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");

exports.getCategoryValidator = [
  check("id").isMongoId().withMessage("invalid Category Id format"),
  validatorMiddleware,
];
exports.createCategoryValidator = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is require ")
    // .isString()
    .isLength({ min: 3 })
    .withMessage("Too short category name")
    .isLength({ max: 10 })
    .withMessage("Too long category name "),
  validatorMiddleware,
];

exports.updateCategoryValidator = [
  check("id").isMongoId().withMessage("invalid Category Id format"),
  validatorMiddleware,
];
exports.deleteCategoryValidator = [
  check("id").isMongoId().withMessage("invalid Category Id format"),
  validatorMiddleware,
];
