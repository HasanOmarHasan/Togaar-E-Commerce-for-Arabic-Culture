const express = require("express");


const { protect, allowsTo } = require("../controller/authController");
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  optimizeImage,
} = require("../controller/brandController");

const {
  getBrandValidator,
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require("../utils/validator/brandValidator");



const router = express.Router();

router
  .route("/")
  .get(getBrands)
  .post(
    protect,
    allowsTo("admin", "manager"),
    uploadBrandImage,
    optimizeImage,
    createBrandValidator,
    createBrand
  );
router
  .route("/:id")
  .get(getBrandValidator, getBrand)
  .put(
    protect,
    allowsTo("admin", "manager"),
    uploadBrandImage,
    optimizeImage,
    updateBrandValidator,
    updateBrand
  )
  .delete(protect, allowsTo("admin"), deleteBrandValidator, deleteBrand);

module.exports = router;
