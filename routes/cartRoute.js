const express = require("express");

const { protect, allowsTo } = require("../controller/authController");
const {
  addProductToCart,
  getCart,
  removeProductFromCart,
  removeAllFromCart,
    updateProductQuantityInCart,
  applyDiscount
} = require("../controller/cartController");

const {
  addToCartValidator,
    updateCartItemValidator,
  removeProductFromCartValidator
} = require("../utils/validator/cartValidator");

const router = express.Router();

router.use(protect, allowsTo("user"));

router
  .route("/")
  .post(addToCartValidator, addProductToCart)
  .get(getCart)
  .delete(removeAllFromCart);

router
  .route("/:id")
  .delete(removeProductFromCartValidator , removeProductFromCart)
    .put(updateCartItemValidator, updateProductQuantityInCart);
  
    router.patch("/discount", applyDiscount);

module.exports = router;
