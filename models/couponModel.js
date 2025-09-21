const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: [true, "Coupon code should be unique"],
      trim: true,
    },
    discount: {
      type: Number,
      required: [true, "Coupon discount is required"],
    },
    active: {
      type: Boolean,
      default: true,
    },
    expire: {
      type: Date,
      required: [true, "Coupon expire date is required"],
    },
    maxUsage: {
      type: Number,
      required: [true, "Maximum usage limit is required"],
      min: [1, "Usage limit must be at least 1"],
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", CouponSchema);
