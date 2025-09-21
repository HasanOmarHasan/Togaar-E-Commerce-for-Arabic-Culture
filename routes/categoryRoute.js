const express = require("express");

const { protect, allowsTo } = require("../controller/authController");

const {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  optimizeImage,
} = require("../controller/categoryController");

const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../utils/validator/categoryValidator");
const SupCategoryRoute = require("./supCategoryRoute");

const router = express.Router();

router.use("/:categoryId/supcategories", SupCategoryRoute);

router
  .route("/")
  .get(getCategories)
  .post(
    protect,
    allowsTo("admin", "manager"),
    uploadCategoryImage,
    optimizeImage,
    createCategoryValidator,
    createCategory
  );
router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    protect,
    allowsTo("admin", "manager"),
    uploadCategoryImage,
    optimizeImage,
    updateCategoryValidator,
    updateCategory
  )
  .delete(protect, allowsTo("admin"), deleteCategoryValidator, deleteCategory);

module.exports = router;
