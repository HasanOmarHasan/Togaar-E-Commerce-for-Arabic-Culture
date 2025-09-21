const express = require("express");

const { protect, allowsTo } = require("../controller/authController");
const limiters = require("../Middleware/rateLimitMaddleware");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  removeAllFromWishlist,
} = require("../controller/wishlistController");

const {
  addToWishlistValidator,
  removeFromWishlistValidator,
} = require("../utils/validator/wishlistValidator");

const router = express.Router();

router.use(protect, allowsTo("user"), limiters.auth);

router
  .route("/")
  .post(addToWishlistValidator, addToWishlist)
  .get(getWishlist)
  .delete(removeAllFromWishlist);

router
  .route("/:productId")
  .delete(removeFromWishlistValidator, removeFromWishlist);

module.exports = router;
