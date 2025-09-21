const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");

exports.getBrandValidator = [
  check("id").isMongoId().withMessage("invalid Brand Id format"),
  validatorMiddleware,
];
exports.createBrandValidator = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Brand name is require ")
    // .isString()
    .isLength({ min: 3 })
    .withMessage("Too short Brand name")
    .isLength({ max: 10 })
    .withMessage("Too long Brand name "),
  validatorMiddleware,
];

exports.updateBrandValidator = [
  check("id").isMongoId().withMessage("invalid Brand Id format") , check("name").trim().optional(),
  validatorMiddleware,
];
exports.deleteBrandValidator = [
  check("id").isMongoId().withMessage("invalid Brand Id format"),
  validatorMiddleware,
];
