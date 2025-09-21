const mongoose = require("mongoose");

const SupCategrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
     required: [true, "Subcategory name is required"],  
      unique: [true, "Subcategory should be unique"],
      minLength: [2, "Too short subcategory name"],
      maxLength: [30, "Too long subcategory name"],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "SubCategoty must be belong to perent category"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("supCategory", SupCategrySchema);
