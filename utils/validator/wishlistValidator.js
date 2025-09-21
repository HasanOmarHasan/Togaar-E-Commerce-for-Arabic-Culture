
const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");
const Product = require("../../models/productModel");
const { validatorMessage } = require("../../locales/i18n");

exports.addToWishlistValidator = [
  check("productId")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId"))
    .notEmpty()
    .withMessage(
      validatorMessage("validation.required", { field: "productId" })
    )
    .bail()
    .custom(async (value, { req }) => {
      const product = await Product.findById(value);
      if (!product) {
        throw new Error(
          req.t("validation.notFound", { model: req.t("model.product"), id: value })
        );
      }
      if (product.quantity === 0) {
        throw new Error(
          req.t("validation.outOfStock", { model: req.t("model.product"), id: value })
        );
      }
      return true;
    }),

  check("user")
    .optional()
    .isMongoId()
    .withMessage((value, { req }) => req.t("validation.invalidMongoId")),

  validatorMiddleware,
];

exports.removeFromWishlistValidator = [
  check("productId")
    .isMongoId()
    .withMessage((value, { req }) => req.t("validation.invalidMongoId")),

  check("user")
    .optional()
    .isMongoId()
    .withMessage((value, { req }) => req.t("validation.invalidMongoId")),

  validatorMiddleware,
];
