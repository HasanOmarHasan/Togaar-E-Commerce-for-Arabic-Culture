const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");

exports.getCouponValidator = [
  check("id").isMongoId().withMessage("invalid Coupon Id format"),
  validatorMiddleware,
];

exports.createCouponValidator = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Coupon name is require ")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Too short Coupon name")
    .isLength({ max: 10 })
    .withMessage("Too long Coupon name "),
  check("discount")
    .trim()
    .notEmpty()
    .withMessage("Coupon discount is require ")
    .isNumeric()
    .withMessage("Discount must be a number")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),
  check("expire")
    .isDate()
    .withMessage("Coupon expire date is required")
    .notEmpty()
        .withMessage("Coupon expire date is required"),
  check("active").optional().isBoolean().withMessage("active must be boolean"),
  validatorMiddleware,
];

exports.updateCouponValidator = [
  check("id").isMongoId().withMessage("invalid Coupon Id format"),
  check("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Coupon name is require "),
  check("discount")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Coupon discount is require "),
  check("expire")
    .optional()
    .isDate()
    .withMessage("Coupon expire date is required"),
  validatorMiddleware,
];
exports.deleteCouponValidator = [
  check("id").isMongoId().withMessage("invalid Coupon Id format"),
  validatorMiddleware,
];
