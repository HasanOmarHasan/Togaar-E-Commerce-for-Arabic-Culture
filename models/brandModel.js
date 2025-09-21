const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is require "],
      unique: [true, "Brand should be unique"],
      minLength: [3, "Too short Brand name "],
      maxLength: [30, "Too long Brand name "],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", BrandSchema);
