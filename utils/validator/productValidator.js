
const { check } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");
const categoryModel = require("../../models/categoryModel");
const supCategoryModel = require("../../models/supCategoryModel");
const brandModel = require("../../models/brandModel");
const { validatorMessage } = require("../../locales/i18n");

// Get product validator
exports.getProductValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),
  validatorMiddleware,
];

// Create product validator
exports.createProductValidator = [
  // Title
  check("title")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "title" }))
    .isLength({ min: 3 })
    .withMessage(validatorMessage("validation.tooShort", { field: "title", min: 3 }))
    .isLength({ max: 30 })
    .withMessage(validatorMessage("validation.tooLong", { field: "title", max: 30 })),

  // Image cover
  check("imageCover")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "imageCover" }))
    .isURL({ require_tld: false, protocols: ["http", "https"] })
    .withMessage(validatorMessage("validation.invalidURL")),

  // Images
  check("images")
    .optional()
    .isArray()
    .withMessage(validatorMessage("validation.invalidArray")),
  check("images.*")
    .isURL({ require_tld: false, protocols: ["http", "https"] })
    .withMessage(validatorMessage("validation.invalidURL")),

  // Brand
  check("brand")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "brand" }))
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId"))
    .bail()
    .custom(async (brandId, { req }) => {
      const brand = await brandModel.findById(brandId);
      if (!brand) {
        throw new Error(req.t("validation.notFound", { model: "Brand", id: brandId }));
      }
      return true;
    }),

  // Category
  check("category")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "category" }))
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId"))
    .bail()
    .custom(async (categoryId, { req }) => {
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        throw new Error(req.t("validation.notFound", { model: "Category", id: categoryId }));
      }
      return true;
    }),

  // Subcategory
  check("subcategory")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "subcategory" }))
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId"))
    .bail()
    .custom(async (value, { req }) => {
      if (Array.isArray(value) && value.length > 5) {
        throw new Error(req.t("validation.tooLong", { field: "subcategory", max: 5 }));
      }
      const foundSubcategories = await supCategoryModel.find({ _id: { $in: value } });
      if (!foundSubcategories.length) {
        throw new Error(req.t("validation.notFound", { model: "Subcategory", id: value }));
      }
      return true;
    })
    .bail()
    .custom(async (value, { req }) => {
      const subcategoryIds = Array.isArray(value) ? value : [value];
      const categoryId = req.body.category;
      const found = await supCategoryModel.find({
        _id: { $in: subcategoryIds },
        category: categoryId,
      });
      if (found.length !== subcategoryIds.length) {
        throw new Error(req.t("validation.notFound", { model: "Subcategory", id: subcategoryIds.join(", ") }));
      }
      return true;
    }),

  // Description
  check("description")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "description" }))
    .isLength({ min: 30, max: 2000 })
    .withMessage(validatorMessage("validation.between", { field: "description", min: 30, max: 2000 })),

  // Price
  check("price")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "price" }))
    .isNumeric()
    .withMessage(validatorMessage("validation.invalidNumber"))
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage(validatorMessage("validation.between", { field: "price", min: 0.01, max: 250000 })),

  // Price after discount
  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage(validatorMessage("validation.invalidNumber"))
    .isFloat({ min: 0 })
    .withMessage(validatorMessage("validation.tooShort", { field: "priceAfterDiscount", min: 0 }))
    .custom((value, { req }) => {
      if (value && req.body.price && value >= req.body.price) {
        throw new Error(req.t("validation.lessThan", { field: "priceAfterDiscount", compare: "price" }));
      }
      return true;
    }),

  // Colors
  check("colors")
    .optional()
    .isArray()
    .withMessage(validatorMessage("validation.invalidArray")),

  // Sizes
  check("sizes")
    .optional()
    .isArray()
    .withMessage(validatorMessage("validation.invalidArray")),

  // Quantity
  check("quantity")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "quantity" }))
    .isInt({ min: 0 })
    .withMessage(validatorMessage("validation.between", { field: "quantity", min: 0, max: 10000 })),

  // Ratings average
  check("ratingsAverage")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage(validatorMessage("validation.between", { field: "ratingsAverage", min: 1, max: 5 })),

  // Ratings quantity
  check("ratingsQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage(validatorMessage("validation.between", { field: "ratingsQuantity", min: 0, max: 100000 })),

  validatorMiddleware,
];

// Update product validator
exports.updateProductValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "title" }))
    .isLength({ min: 3, max: 30 })
    .withMessage(
      validatorMessage("validation.between", { field: "title", min: 3, max: 30 })
    ),

  check("imageCover")
    .optional()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "imageCover" }))
    .isURL({ require_tld: false, protocols: ["http", "https"] })
    .withMessage(validatorMessage("validation.invalidURL")),

  check("images")
    .optional()
    .isArray()
    .withMessage(validatorMessage("validation.invalidArray")),

  check("images.*")
    .isURL({ require_tld: false, protocols: ["http", "https"] })
    .withMessage(validatorMessage("validation.invalidURL")),

  check("brand")
    .optional()
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("category")
    .optional()
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("subcategory")
    .optional()
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "description" }))
    .isLength({ min: 30, max: 2000 })
    .withMessage(
      validatorMessage("validation.between", { field: "description", min: 30, max: 2000 })
    ),

  check("price")
    .optional()
    .isNumeric()
    .withMessage(validatorMessage("validation.invalidNumber"))
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage(
      validatorMessage("validation.between", { field: "price", min: 0.01, max: 100000 })
    ),

  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage(validatorMessage("validation.invalidNumber"))
    .isFloat({ min: 0 })
    .withMessage(validatorMessage("validation.positive", { field: "priceAfterDiscount" }))
    .bail()
    .custom((priceAfterDiscount, { req }) => {
      if (priceAfterDiscount && req.body.price && priceAfterDiscount >= req.body.price) {
        throw new Error(
          validatorMessage("validation.lessThan", { field: "priceAfterDiscount", compare: "price" })(null, { req })
        );
      }
      return true;
    }),

  check("colors")
    .optional()
    .isArray()
    .withMessage(validatorMessage("validation.invalidArray")),

  check("sizes")
    .optional()
    .isArray()
    .withMessage(validatorMessage("validation.invalidArray")),

  check("quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage(validatorMessage("validation.nonNegative", { field: "quantity" })),

  check("ratingsAverage")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage(
      validatorMessage("validation.between", { field: "ratingsAverage", min: 1, max: 5 })
    ),

  check("ratingsQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage(validatorMessage("validation.nonNegative", { field: "ratingsQuantity" })),

  validatorMiddleware,
];

// Delete product validator
exports.deleteProductValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),
  validatorMiddleware,
];