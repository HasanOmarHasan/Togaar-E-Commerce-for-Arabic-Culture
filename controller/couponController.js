const asyncHandler = require("express-async-handler");
const Coupon = require("../models/couponModel");
const ApiError = require("../utils/ApiError");
const factory = require("./handlersFactory");

// @des     get list of Coupon
// @route   Get /api/v1/Coupons/
// @access  private (Admin , manger)
// @prams page , limit
exports.getCoupons = factory.getAll(Coupon);

// @des     get spicefic Coupon by id
// @route   Get /api/v1/Coupons/:id
// @access  private (Admin , manger)
exports.getCoupon = factory.getOne(Coupon);

// @des     create Coupon
// @route   Post /api/v1/Coupons/
// @access  private (Admin)
exports.createCoupon = factory.createOne(Coupon);

// @des     update spicefic Coupon by id
// @route   Put /api/v1/Coupons/:id
// @access  Privet (Admin)
exports.updateCoupon = factory.updateOne(Coupon);

// @des     Delete spicefic Coupon by id
// @route   Delete /api/v1/Coupons/:id
// @access  Privet (Admin)
exports.deleteCoupon = factory.deleteOne(Coupon);


