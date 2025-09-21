

const Category = require("../models/categoryModel");
const factory = require("./handlersFactory");
const { uploadSingleImage , MainOptimizeImage } = require("../Middleware/uploadImageMiddleware");





// @des     upload category image
exports.uploadCategoryImage = uploadSingleImage("image");
exports.optimizeImage = MainOptimizeImage("categories");


// @des     get list of category
// @route   Get /api/v1/Categories/
// @access  puplic (user)
// @prams page , limit
exports.getCategories = factory.getAll(Category);

// @des     get spicefic category by id
// @route   Get /api/v1/Categories/:id
// @access  puplic (user)
exports.getCategory = factory.getOne(Category);

// @des     create category
// @route   Post /api/v1/Categories/
// @access  private (Admin)
exports.createCategory = factory.createOne(Category);

// @des     update spicefic category by id
// @route   Put /api/v1/Categories/:id:
// @access  Privet (Admin)
exports.updateCategory = factory.updateOne(Category);

// @des     Delete spicefic category by id
// @route   Delete /api/v1/Categories/:id:
// @access  Privet (Admin)
exports.deleteCategory = factory.deleteOne(Category);
