const SupCategory = require("../models/supCategoryModel");
const factory = require("./handlersFactory");


// Nested Route
// @des     create filter object for nested routes
// @route   Get /api/v1/categories/:categoryId/supCategories


// @des     create supcategory
// @route   Post /api/v1/supCategories/
// @access  private (Admin)
exports.createSupCategory = factory.createOne(SupCategory);

// Nested Route
// @des     create filter object for nested routes
// @route   Get /api/v1/categories/:categoryId/supCategories

// @des     get list of supCategory
// @route   Get /api/v1/supCategories/
// @access  puplic (user)
// @prams page , limit
exports.getSupCategories = factory.getAll(SupCategory, {
  nestedField: "category",
  nestedIdParam: "categoryId",
});

// @des     get spicefic supcategory by id
// @route   Get /api/v1/supCategories/:id
// @access  puplic (user)
exports.getSupCategory = factory.getOne(SupCategory);

// @des     update spicefic supCategory by id
// @route   Put /api/v1/supCategories/:id:
// @access  Privet (Admin)
exports.updateSupCategory = factory.updateOne(SupCategory);

// @des     Delete spicefic supCategory by id
// @route   Delete /api/v1/supCategories/:id:
// @access  Privet (Admin)
exports.deleteSupCategory = factory.deleteOne(SupCategory);
