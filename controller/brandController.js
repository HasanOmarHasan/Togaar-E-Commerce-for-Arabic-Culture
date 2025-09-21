const Brand = require("../models/brandModel");
const factory = require("./handlersFactory");
const { uploadSingleImage , MainOptimizeImage } = require("../Middleware/uploadImageMiddleware");



// @des     upload category image
exports.uploadBrandImage = uploadSingleImage("image");
exports.optimizeImage = MainOptimizeImage("brands");

// @des     get list of brand
// @route   Get /api/v1/Brands/
// @access  puplic (user)
// @prams page , limit
exports.getBrands = factory.getAll(Brand );


// @des     get spicefic brand by id
// @route   Get /api/v1/Brands/:id
// @access  puplic (user)
exports.getBrand = factory.getOne(Brand);


// @des     create brand
// @route   Post /api/v1/Brands/
// @access  private (Admin)
exports.createBrand = factory.createOne(Brand);


// @des     update spicefic brand by id
// @route   Put /api/v1/Brands/:id:
// @access  Privet (Admin)
exports.updateBrand = factory.updateOne(Brand);


// @des     Delete spicefic brand by id
// @route   Delete /api/v1/Brands/:id:
// @access  Privet (Admin)
exports.deleteBrand = factory.deleteOne(Brand);

