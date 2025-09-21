const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      // unique: [true, "Product should be unique"],
      required: [true, "Product name is require "],
      minLength: [3, "Too short product name "],
      maxLength: [50, "Too long product name "],
      trim: true,
    },
    title_ar: {
      type: String,
      // unique: [true, "Product should be unique"],
      minLength: [3, "اسم المنتج يجب ان يكون اكثر من 3 حروف"],
      maxLength: [50, "اسم المنتج يجب ان يكون اقل من 50 حرف"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Product slug is require "],
      lowercase: true,
    },
    imageCover: {
      type: String,
      required: [true, "Product imageCover is require "],
    },
    images: [String],
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: "Brand",
      required: [true, "Product must be belong to perent brand"],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Product must be belong to perent category"],
    },
    subcategory: {
      type: [mongoose.Schema.ObjectId],
      ref: "supCategory",
      required: [true, "Product must be belong to perent subcategory"],
    },
    description: {
      type: String,
      required: [true, "Product description is require "],
      minLength: [30, "Too short product description , min 30 character"],
      maxLength: [2000, "Too long product description , max 2000 character"],
      trim: true,
    },
    description_ar: {
      type: String,
      // required: [true, "المنتج يجب ان يحتوي على وصف"],
      minLength: [30, "وصف المنتج يجب ان يكون اكثر من 30 حرف"],
      maxLength: [2000, "وصف المنتج يجب ان يكون اقل من 2000 حرف"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is require "],
      max: [250000, "Price must be below 250000.0"],
    },
    priceAfterDiscount: {
      type: Number,
      default: 0,
    },
    colors: [String],
    sizes: [String],
    quantity: {
      type: Number,
      required: [true, "Product quantity is require "],
    },
    sold: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 1,
      min: [0, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);



ProductSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

module.exports = mongoose.model("Product", ProductSchema);
