const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");

// calculate total price
const calculateTotalPrice = (cart) => {
  cart.totalPriceAfterDiscount = undefined;
  return cart.products.reduce(
    (total, productItem) => total + productItem.price * productItem.quantity,
    0
  );
};

// Massage cart
const massageSuccessCart = (req, res, cart, message, coupon = null) => {
  const data = {
    results: cart.products.length,
    totalPrice: cart.totalPrice,
    totalPriceAfterDiscount: cart.totalPriceAfterDiscount,
    cartId: cart._id,
    products: cart.products,
  };

  if (coupon) {
    data.coupon = {
      id: coupon._id,
      name: coupon.name,
      discount: coupon.discount,
    };
  }

  res.status(200).json({
    status: req.t("http.success"),
    message,
    data,
  });
};

// @des      add ptodect to  cart
// @route   Get /api/v1/carts/
// @access  private (User)
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color, quantity = 1 } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });
  const product = await Product.findById(productId);

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      products: [{ product: productId, color, price: product.price, quantity }],
      totalPrice: product.price * quantity,
      totalPriceAfterDiscount: undefined,
    });
  } else {
    if (cart.products.length > 0) {
      const isProductExist = cart.products.findIndex(
        (item) => item.product.toString() === productId && item.color === color
      );

      if (isProductExist !== -1) {
        cart.products[isProductExist].quantity += quantity;
      } else {
        cart.products.push({
          product: productId,
          color,
          price: product.price,
          quantity,
        });
      }
    }

    cart.totalPrice = calculateTotalPrice(cart);
  }

  await cart.save();

  massageSuccessCart(
    req,
    res,
    cart,
    req.t("http.added", { field: req.t("model.product") })
  );
  // "Product added to cart successfully"
});

// @des      get logged in user cart
// @route   Get /api/v1/carts/
// @access  private (User)
exports.getCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "products.product",
    " price quantity title imageCover"
  );

  if (!cart) {
    return next(new ApiError(`No cart form this id  ${req.user._id} `, 404));
  }

  massageSuccessCart(req, res, cart, req.t("http.found", { field: "cart" }));
  // "Get cart successfully"
});

// @des      remove product from cart
// @route   Delete /api/v1/carts/:id (products _id)
// @access  private (User)
exports.removeProductFromCart = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: { _id: id } } },
    { new: true }
  );
  if (!cart) {
    return next(new ApiError(`No cart form this id  ${req.user._id} `, 404));
  }
  cart.totalPrice = calculateTotalPrice(cart);

  await cart.save();

  massageSuccessCart(
    req,
    res,
    cart,
    req.t("http.deleted", { field: "product " })
  );
});

// @des      remove All product in cart
// @route   Delete /api/v1/carts/
// @access  private (User)
exports.removeAllFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndDelete({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(`No cart form this id  ${req.user._id} `, 404));
  }
  res.status(204).json({});
});

// @des      update product quantity in cart
// @route   Put /api/v1/carts/:id
// @access  private (User)
exports.updateProductQuantityInCart = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const { id } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(new ApiError(`No cart found for user ${req.user._id}`, 404));
  }

  if (cart.products.length > 0) {
    const isProductExist = cart.products.findIndex(
      (item) => item._id.toString() === id
    );
    if (isProductExist === -1) {
      return next(new ApiError(`Product not found in cart`, 404));
    }
    cart.products[isProductExist].quantity = quantity;
  }

  cart.totalPrice = calculateTotalPrice(cart);

  await cart.save();

  massageSuccessCart(
    req,
    res,
    cart,
    req.t("http.update", { field: "quantity in cart" })
  );
});

// @des  applying discount on cart
// @route   Put /api/v1/carts/discount
// @access  private (User)
exports.applyDiscount = asyncHandler(async (req, res, next) => {
  const name = req.body.coupon;
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new ApiError(`No cart found for user ${userId}`, 404));
  }
  if (cart.totalPriceAfterDiscount) {
    return next(new ApiError("Discount already applied to this cart", 400));
  }

  const coupon = await Coupon.findOne({
    name,
    active: true,
    expire: { $gt: Date.now() },
  });
  console.log(coupon);

  if (!coupon) {
    return next(
      new ApiError(`${name} Coupon is invalid, expired, or inactive`, 400)
    );
  }
  if (coupon.usedBy.includes(userId)) {
    return next(new ApiError("You already used this coupon", 400));
  }

  if (coupon.usageCount >= coupon.maxUsage) {
    return next(new ApiError("Coupon usage limit reached", 400));
  }

  cart.totalPriceAfterDiscount =
    Math.round(
      (cart.totalPrice - (cart.totalPrice * coupon.discount) / 100) * 100
    ) / 100;

  await cart.save();

  // Update coupon usage
  coupon.usageCount += 1;
  coupon.usedBy.push(userId);
  await coupon.save();

  massageSuccessCart(req, res, cart, req.t("http.success"), coupon);
});
