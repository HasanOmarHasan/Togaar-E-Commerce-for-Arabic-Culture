
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");
const Product = require("../../models/productModel");
const cart = require("../../models/cartModel");
const { validatorMessage } = require("../../locales/i18n");

exports.addToCartValidator = [
  body("productId")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "productId" }))
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId"))
    .bail()
    .custom(async (value, { req }) => {
      const product = await Product.findById(value);
      if (!product) {
        throw new Error(
          req.t("validation.notFound", { model: req.t("model.product"), id: value })
        );
      }

      // Check stock availability
      const quantity = req.body.quantity || 1;
      if (product.quantity < quantity) {
        throw new Error(
          req.t("validation.outOfStock", { model: req.t("model.product"), id: value })
        );
      }

      return true;
    }),

  body("quantity")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "quantity",
        min: 1,
        max: 100,
      })
    ),

  body("color")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "color",
        min: 1,
        max: 50,
      })
  )
    .bail()
    // .matches(/^[a-zA-Z0-9\s#-]+$/)
    .isString()
    // .isHexColor()
    // .isRgbColor()
    .withMessage(
      validatorMessage("validation.invalidString", { field: "color" })
  )
  ,

  validatorMiddleware,
];

exports.updateCartItemValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  body("quantity")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "quantity" }))
    .isInt({ min: 1, max: 100 })
    .withMessage(
      validatorMessage("validation.between", {
        field: "quantity",
        min: 1,
        max: 100,
      })
    ),

  validatorMiddleware,
];

exports.removeProductFromCartValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId"))
    .bail()
    .custom(async (value, { req }) => {
      const cartItem = await cart.findOne({
        user: req.user._id,
        "products._id": value,
      });
      if (!cartItem) {
        throw new Error(
          req.t("validation.notFound", { model: req.t("model.product"), id: value })
        );
      }
      return true;
    }),

  validatorMiddleware,
];

