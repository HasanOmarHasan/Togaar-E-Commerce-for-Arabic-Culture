const mongoose = require("mongoose");

const CategrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is require "],
      unique: [true, "Category should be unique"],
      minLength: [3, "Too short category name "],
      maxLength: [30, "Too long category name "],
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

const CategoryModel = mongoose.model("Category", CategrySchema);

module.exports = CategoryModel;
