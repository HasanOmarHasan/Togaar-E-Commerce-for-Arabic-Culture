const mongoos = require("mongoose");

const ReviewSchema = new mongoos.Schema(
  {
    reviewTitle: {
      type: String,
      trim: true,
      maxlength: 20,
      required: [true, "Review title is required"],
    },
    reviewDescription: {
      type: String,
      required: [true, "Review description is required"],
      minlength: 10,
      maxlength: 500,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      required: [true, "review Rating is required"],
    },
    product: {
      type: mongoos.Schema.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    user: {
      type: mongoos.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    // ==================== METADATA & VALIDATION ====================

    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
      helpfulVotesByUsers: [{
      type: mongoos.Schema.ObjectId,
      ref: 'User',
      
    }] ,
 

    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    // ==================== INTERACTION TRACKING ====================

    flags: [
      {
        user: {
          type: mongoos.Schema.ObjectId,
          ref: "User",
        },
        reason: String,
        flaggedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

ReviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name profileImage",
  });
  next();
});

ReviewSchema.statics.calcAverageRatingsAndQuantity = async function (
  productId
) {
  const stats = await this.aggregate([
    // statge numbe one found the specific product by product id
    {
      $match: { product: productId },
    },
    // stage two calculate average rating and quantity
    {
      $group: {
        _id: "$product",
        ratingsAverage: { $avg: "$rating" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await mongoos.model("Product").findByIdAndUpdate(productId, {
      ratingsAverage: stats[0].ratingsAverage,
      ratingsQuantity: stats[0].ratingsQuantity,
    });
  } else {
    await mongoos.model("Product").findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

ReviewSchema.post("save", async function () {
  // this points to current review , call after make or update any operation in review
  await this.constructor.calcAverageRatingsAndQuantity(this.product);
});

ReviewSchema.post("deleteOne", { document: true }, async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.product);
});

module.exports = mongoos.model("Review", ReviewSchema);
