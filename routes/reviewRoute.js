const express = require("express");

const { protect, allowsTo } = require("../controller/authController");
const {
  getReview,
  getReviews,
  createReview,
  updateReview,
  deleteReview,

  toggleHelpfulVote,
  reportReview,
} = require("../controller/reviewController");

const {
  getReviewValidator,
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
  helpfulVoteValidator,
  reportReviewValidator,
} = require("../utils/validator/reviewValidator");

const { setParamIdToBody } = require("../controller/handlersFactory");

const router = express.Router({ mergeParams: true });

// router.route("/").get(getReviews).post(
//   protect,
//   allowsTo("user"),

//   createReviewValidator,
//   createReview
// );
// router
//   .route("/:id")
//   .get(
//     getReviewValidator,
//     getReview
//   )
//   .put(
//     protect,
//     allowsTo("user"),

//     updateReviewValidator,
//     updateReview
//   )
//   .delete(
//     protect,
//     allowsTo("user" , "admin" , "manager"),
//     deleteReviewValidator,
//     deleteReview
// );

router.get("/", getReviews);
router.get("/:id", getReviewValidator, getReview);

// router.get()

router.delete(
  "/:id",
  protect,
  allowsTo("admin", "manager", "user"),
  deleteReviewValidator,
  deleteReview
);
router.use(protect, allowsTo("user"));

router.post(
  "/",
  setParamIdToBody("product"),
  createReviewValidator,
  createReview
);
router.put("/:id", updateReviewValidator, updateReview);

// Additional routes for your new features
router.patch('/:id', helpfulVoteValidator, toggleHelpfulVote);
router.post('/:id', reportReviewValidator, reportReview);

module.exports = router;
