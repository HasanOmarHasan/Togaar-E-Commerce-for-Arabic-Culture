const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Cart must be belong to a user"],
    },
    products: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: [true, "Cart must be belong to a productId"],
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, "Quantity must be at least 1"],
        },
        color: {
          type: String,
          trim: true,
        },
        price: {
          type: Number,
          required: [true, "Cart must be belong to a product price"],
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPriceAfterDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", CartSchema);
