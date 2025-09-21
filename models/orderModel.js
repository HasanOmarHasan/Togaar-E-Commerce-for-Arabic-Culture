const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
      },
      phone: {
        type: Number,
        required: true,
      },
      country: {
        type: String,
      
      },
      postalCode: {
        type: Number,
       
      },
    },
    orderItems: [
      {
        color: {
          type: String,
          
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },

        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    paymentInfo: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        sparse: true, // Allow null for pending payments
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"], // Standardized statuses
        default: "pending",
      },
      gateway: String, // e.g., "stripe", "paypal"
      currency: {
        type: String,
        default: "EGP",
        uppercase: true,
        length: 3,
      },
      paymentMethod: {
        type: String,
        required: true,
        default: "cashOnDelivery",
        enum: ["cashOnDelivery", "card", "wallet", "bankTransfer"], // Expanded options
      },
    },
    paidAt: {
      type: Date,
    //   required: true,
    },
    isPaid: {
      type: Boolean,
      //   required: true,
      default: false,
    },
    
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    orderStatus: {
      type: String,
      required: true,

      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    isDelivered: {
      type: Boolean,
        required: true,
      default: false,
    },
    deliveredAt: Date,
    cancellationReason: String, // Required if cancelled
  },
  {
    timestamps: true,
  }
);

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "orderItems.product" ,
    select: "title  imageCover"
  });
    
  next();
});

module.exports = mongoose.model("Order", orderSchema);
