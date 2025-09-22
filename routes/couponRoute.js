const express = require("express");

const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controller/couponController");

const {
  getCouponValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} = require("../utils/validator/couponValidator");

const { protect, allowsTo } = require("../controller/authController");

const router = express.Router();

router.use(protect, allowsTo("admin", "manager"));

router.post("/", createCouponValidator, createCoupon);
router.get("/", getCoupons);

router.get("/:id", getCouponValidator, getCoupon);
router.put("/:id", updateCouponValidator, updateCoupon);
router.delete("/:id", deleteCouponValidator, deleteCoupon);

module.exports = router;
