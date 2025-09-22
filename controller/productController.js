const path = require("path");

const sharp = require("sharp");
const asyncHandler = require("express-async-handler");

const Product = require("../models/productModel");
const factory = require("./handlersFactory");
const {
  uploadMultipleImage,
  MainOptimizeImage,
} = require("../Middleware/uploadImageMiddleware");

exports.uploadProductImages = uploadMultipleImage([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);
exports.optimizeProductImageCover = MainOptimizeImage(
  "products",
  "imageCover",
  2000,
  1333
);

exports.optimizeProductImages = asyncHandler(async (req, res, next) => {
  if (!req.files) return next();

  if (req.files.images && req.files.images.length > 0) {
    const uploadPath = path.join(__dirname, "..", "uploads", `products`);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    req.body.images = req.body.images || [];
    await Promise.all(
      req.files.images.map(async (file, index) => {
        const filename = `products-${Date.now()}-${Math.round(Math.random() * 1e9)}-${index + 1}.webp`;
        const fullPath = path.join(uploadPath, filename);
        await sharp(file.buffer)
          .resize({
            width: 600,
            height: 600,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 90, effort: 6, nearLossless: true })
          .toFile(fullPath);
        req.body.images.push(`${baseUrl}/products/${filename}`);
      })
    );
  }
  next();
});

// @des     get list of Product
// @route   Get /api/v1/Products/
// @access  puplic (user)
// @prams page , limit
exports.getProducts = factory.getAll(Product, { isProduct: true });

// @des     get spicefic Product by id
// @route   Get /api/v1/Products/:id
// @access  puplic (user)
exports.getProduct = factory.getOne(Product, {
  popOpations: {
    path: "category brand subcategory reviews",
    select: "name  reviewTitle reviewDescription rating helpfulVotes",
  },
});

// @des     create Product
// @route   Post /api/v1/Products/
// @access  private (Admin)
exports.createProduct = factory.createOne(Product);

// @des     update spicefic Product by id
// @route   Put /api/v1/Products/:id:
// @access  Privet (Admin)
exports.updateProduct = factory.updateOne(Product);

// @des     Delete spicefic Product by id
// @route   Delete /api/v1/Products/:id:
// @access  Privet (Admin)
exports.deleteProduct = factory.deleteOne(Product);

// @des     get list of recommendations Product
// @route   Get /api/v1/Products/:id/recommendations
// @access  puplic (user)
exports.recommendationsProducts = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    return res.status(404).json({
      status: req.t("http.error"),
      message: req.t("product.notFound"),
    });
  }

  const subcategoryIds = product.subcategory.map((sub) => sub._id);

  const recommendations = await Product.find({
    category: product.category._id,
    subcategory: { $in: subcategoryIds },
    _id: { $ne: product._id },
  })
    .limit(5)
    .select(" title title_ar imageCover price priceAfterDiscount ")
    .lean();

  res.status(200).json({
    status: req.t("http.success"),
    results: recommendations.length,
    data: {
      recommendations,
    },
  });
});
