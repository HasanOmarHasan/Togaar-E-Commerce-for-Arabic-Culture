const mongoose = require("mongoose");
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name is require "],
    },
    email: {
      type: String,
      required: [true, "User email is require "],
      unique: [
        true,
        "Email is already registered user ,User email should be unique  ",
      ],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "User password is require "],
      minLength: [6, "Too short User password "],
      select: false,
    },
    passwordResetCode: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    otpVerified: { type: Boolean, default: false, select: false },
    otpAttempts: { type: Number, default: 0, select: false }, // attempts to verify OTP
    otpLockUntil: { type: Date, select: false }, // lock until date if too many attempts

    profileImage: String,
    phone: String,
    slug: {
      type: String,
      lowercase: true,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "manager"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivatedAt: {
      type: Date,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    address: [
      {
        id: mongoose.Schema.Types.ObjectId,
        alias: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        country: String,
        postalCode: Number,
      },
    ],
    language: {
      type: String,
      enum: ["ar-EG", "en", "ar"],
      default: "en",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (this.isNew) return next();

  // set passwordChangedAt if not new
   if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  // this.passwordChangedAt = Date.now() - 1000;

  next();
});
module.exports = mongoose.model("User", userSchema);
