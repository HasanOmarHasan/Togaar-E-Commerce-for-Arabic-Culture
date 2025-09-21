

const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middleware/validatorMiddleware");
const Review = require("../../models/reviewModel");
const { validatorMessage } = require("../../locales/i18n");

exports.getReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),
  validatorMiddleware,
];

exports.createReviewValidator = [
  // reviewTitle validation
  check("reviewTitle")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "reviewTitle" }))
    .isLength({ min: 1 })
    .withMessage(validatorMessage("validation.tooShort", { field: "reviewTitle", min: 1 }))
    .isLength({ max: 20 })
    .withMessage(validatorMessage("validation.tooLong", { field: "reviewTitle", max: 20 })),

  // reviewDescription validation
  check("reviewDescription")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "reviewDescription" }))
    .isLength({ min: 10 })
    .withMessage(validatorMessage("validation.tooShort", { field: "reviewDescription", min: 10 }))
    .isLength({ max: 500 })
    .withMessage(validatorMessage("validation.tooLong", { field: "reviewDescription", max: 500 })),

  // rating validation
  check("rating")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "rating" }))
    .isFloat({ min: 1, max: 5 })
    .withMessage(validatorMessage("validation.invalidRating"))
    .bail()
    .custom((value) => {
      const validRatings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
      return validRatings.includes(Number(value));
    })
    .withMessage(validatorMessage("validation.invalidRating")),

  // product validation
  check("product")
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "product" }))
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  // user validation
  check("user")
    .optional()
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  // Prevent duplicate reviews
  body()
    .bail()
    .custom(async (value, { req }) => {
      if (req.user && req.body.product) {
        const existingReview = await Review.findOne({
          user: req.user._id,
          product: req.body.product,
        });

        if (existingReview) {
          throw new Error(req.t("validation.duplicate", { model: "Review" }));
        }
      }
      return true;
    }),

  validatorMiddleware,
];

exports.updateReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("reviewTitle")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage(validatorMessage("validation.tooShort", { field: "reviewTitle", min: 1 }))
    .isLength({ max: 20 })
    .withMessage(validatorMessage("validation.tooLong", { field: "reviewTitle", max: 20 })),

  check("reviewDescription")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage(validatorMessage("validation.tooShort", { field: "reviewDescription", min: 10 }))
    .isLength({ max: 500 })
    .withMessage(validatorMessage("validation.tooLong", { field: "reviewDescription", max: 500 })),

  check("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage(validatorMessage("validation.invalidRating"))
    .bail()
    .custom((value) => {
      const validRatings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
      return validRatings.includes(Number(value));
    })
    .withMessage(validatorMessage("validation.invalidRating")),

  body()
    .bail()
    .custom(async (value, { req }) => {
      const review = await Review.findById(req.params.id);
      if (!review) {
        throw new Error(req.t("validation.notFound", { model: "Review", id: req.params.id }));
      }

      if (
        review.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        throw new Error(req.t("validation.notAuthorized"));
      }

      return true;
    }),

  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId"))
    .bail()
    .custom(async (value, { req }) => {
      const review = await Review.findById(value);
      if (!review) {
        throw new Error(req.t("validation.notFound", { model: "Review", id: value }));
      }

      if (
        review.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        throw new Error(req.t("validation.notAuthorized"));
      }

      return true;
    }),

  validatorMiddleware,
];

exports.helpfulVoteValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),
  validatorMiddleware,
];

exports.reportReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage(validatorMessage("validation.invalidMongoId")),

  check("reason")
    .trim()
    .notEmpty()
    .withMessage(validatorMessage("validation.required", { field: "reason" }))
    .isLength({ min: 10 })
    .withMessage(validatorMessage("validation.tooShort", { field: "reason", min: 10 }))
    .isLength({ max: 200 })
    .withMessage(validatorMessage("validation.tooLong", { field: "reason", max: 200 })),

  validatorMiddleware,
];
