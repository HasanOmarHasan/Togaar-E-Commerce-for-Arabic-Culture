const express = require("express");
const {
  getProduct,
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  optimizeProductImageCover,
  optimizeProductImages,
  recommendationsProducts,
} = require("../controller/productController");

const {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/validator/productValidator");
const { protect, allowsTo } = require("../controller/authController");

const router = express.Router();

router.use("/:productId/reviews", require("./reviewRoute"));

router
  .route("/")
  .get(getProducts)
  .post(
    protect,
    allowsTo("admin", "manager"),
    uploadProductImages,
    optimizeProductImageCover,
    optimizeProductImages,
    createProductValidator,
    createProduct
  );
router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .put(
    protect,
    allowsTo("admin", "manager"),
    uploadProductImages,
    optimizeProductImageCover,
    optimizeProductImages,
    updateProductValidator,
    updateProduct
  )
  .delete(protect, allowsTo("admin"), deleteProductValidator, deleteProduct);

router.get(
  "/:id/recommendations",
  protect,
  allowsTo("user"),
  getProductValidator,
  recommendationsProducts
);

module.exports = router;
