const express = require("express");
const {
  createSupCategory,
  getSupCategories,
  getSupCategory,
  updateSupCategory,
  deleteSupCategory,
  
} = require("../controller/supCategoryController");

const {
  createSupCategoryValidator,
  getSupCategoryValidator,
  updateSupCategoryValidator,
  deleteSupCategoryValidator,
} = require("../utils/validator/supCategoryValidator");

const {setParamIdToBody} = require("../controller/handlersFactory");

const { protect, allowsTo } = require("../controller/authController");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .post(
    protect,
    allowsTo("admin", "manager"),
    setParamIdToBody("category"),
    createSupCategoryValidator,
    createSupCategory
  )
  .get( getSupCategories);
router
  .route("/:id")
  .get(getSupCategoryValidator, getSupCategory)
  .put(
    protect,
    allowsTo("admin", "manager"),
    updateSupCategoryValidator,
    updateSupCategory
  )
  .delete(
    protect,
    allowsTo("admin"),
    deleteSupCategoryValidator,
    deleteSupCategory
  );

module.exports = router;
