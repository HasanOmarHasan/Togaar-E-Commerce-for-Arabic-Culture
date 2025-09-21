const asyncHandler = require("express-async-handler");
const factory = require("./handlersFactory");
const Review = require("../models/reviewModel");
const ApiError = require("../utils/ApiError");

// Nested Route
// @des     create filter object for nested routes
// @route   Get /api/v1/products/:productId/reviews

// @des     get list of review
// @route   Get /api/v1/reviews/
// @access  puplic (user)
// @prams page , limit
exports.getReviews = factory.getAll(Review, {
  nestedField: "product",
  nestedIdParam: "productId",
});

// Nested Route
// @des     create filter object for nested routes
// @route   Get /api/v1/products/:productId/reviews/:reviewid

// @des     get spicefic Review by id
// @route   Get /api/v1/Reviews/:id
// @access  puplic (user)
exports.getReview = factory.getOne(Review);

// @des     create Review
// @route   Post /api/v1/Reviews/
// @access  private (Admin)/user
exports.createReview = factory.createOne(Review);

// @des     update spicefic Review by id
// @route   Put /api/v1/Reviews/:id
// @access  Privet (Admin)/user
exports.updateReview = factory.updateOne(Review);

// @des     Delete spicefic Review by id
// @route   Delete /api/v1/Reviews/:id
// @access  Privet (Admin)/user, manger , admin
exports.deleteReview = factory.deleteOne(Review);

// @des  Vote of the revew found is helpful
// @route   Patch /api/v1/Reviews/:id
// @access  Privet (user)
exports.toggleHelpfulVote = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  let updateOperation;
  let message;

  const review = await Review.findById(id);

  if (!review) {
    return next(new ApiError(req.t("http.notFound", { model: "Review", id }), 404));
  }

  const hasUserVoted = review.helpfulVotesByUsers.some(
    (userId) => userId.toString() === req.user._id.toString()
  );
  if (hasUserVoted) {
    message =
      "Vote removed successfully ,You have already voted for this review ";
    updateOperation = {
      $inc: { helpfulVotes: -1 },
      $pull: { helpfulVotesByUsers: req.user._id },
    };
  } else {
    message = "You have successfully added a voted for this review ";
    updateOperation = {
      $inc: { helpfulVotes: 1 },
      $addToSet: { helpfulVotesByUsers: req.user._id },
    };
  }
  const docment = await Review.findOneAndUpdate({ _id: id }, updateOperation, {
    new: true,
  });

  res.status(200).json({
    status: req.t("http.success"),
    message,
    data: {
      helpfulVotes: docment.helpfulVotes,
      hasVoted: !hasUserVoted,
    },
  });
});
// @des  report revew
// @route   post /api/v1/Reviews/:id
// @access  Privet (user)
exports.reportReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const docment = await Review.findOneAndUpdate(
    { _id: id, "flags.user": { $ne: req.user._id } },
    {
      $addToSet: {
        flags: {
          user: req.user._id,
          reason: req.body.reason,
        },
      },
    },
    {
      new: true,
    }
  );
  if (!docment) {
    return next(
      new ApiError(req.t("http.notFound", { model: "Review", id }), 404)
    );
  }
  res.status(200).json({
    status: req.t("http.success"),
    message: "we received your report , will take action soon",
    data: docment.flags,
  });
});
