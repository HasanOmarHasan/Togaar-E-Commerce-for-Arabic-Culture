/* eslint-disable no-case-declarations */
const asyncHandler = require("express-async-handler");
// eslint-disable-next-line import/no-extraneous-dependencies
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ApiError = require("../utils/ApiError");
const facory = require("./handlersFactory");
const { caches } = require("../utils/cashe");

const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

const checkProductAvailability = async (cart, productModel) => {
  if (!cart.products || cart.products.length === 0) {
    return;
  }

  const productIds = [
    ...new Set(cart.products.map((item) => item.product.toString())),
  ];

  const products = await productModel.find({
    _id: { $in: productIds },
  });

  const productMap = new Map();
  products.forEach((product) => {
    productMap.set(product._id.toString(), product);
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const [productId, totalRequested] of Object.entries(
    cart.products.reduce((acc, item) => {
      const id = item.product.toString();
      acc[id] = (acc[id] || 0) + item.quantity;
      return acc;
    }, {})
  )) {
    const product = productMap.get(productId);

    if (!product) {
      throw new ApiError(`Product ${productId} not found`, 404);
    }

    if (product.quantity < totalRequested) {
      throw new ApiError(
        `Insufficient stock for product: ${product.title}. Available: ${product.quantity}, Total requested: ${totalRequested}`,
        400
      );
    }
  }
};

// @des     get list of order
// @route   Get /api/v1/orders/
// @access  private (Admin)/admin
exports.getAllOrders = facory.getAll(Order);

// @des     get list of order
// @route   Get /api/v1/orders/
// @access  private (Admin) / user

exports.getLoggedUserOrders = facory.getAll(Order, {
  isLoggedUser: true,
});

// @des     get spicefic order by id
// @route   Get /api/v1/orders/:id
// @access  private (Admin)/user
exports.getOrder = facory.getOne(Order);

// @des     create cash order
// @route   Post /api/v1/orders/:cardId
// @access  private (Admin)/user
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  const { addressId } = req.body;
  const { cardId } = req.params;

  if (!addressId) {
    return next(new ApiError("Address ID is required", 400));
  }

  // 1) get card by cardId
  const cart = await Cart.findById(cardId);
  if (!cart) {
    return next(new ApiError(`No cart form this id  ${cardId} `, 404));
  }

  if (!cart.products || cart.products.length === 0) {
    return next(new ApiError("Cart is empty", 400));
  }

  // check product availability before create order
  await checkProductAvailability(cart, Product);

  // 2) get order price by card price check if apply discount

  const taxPrice = 0;
  const shippingPrice = 0;

  const totalPrice = (
    (cart.totalPriceAfterDiscount || cart.totalPrice) +
    taxPrice +
    shippingPrice
  ).toFixed(2);
  // 3) get addres by addressId

  if (req.user.address.length === 0 || !req.user.address) {
    return next(
      new ApiError(
        `No addresses found for this user, please add an address`,
        404
      )
    );
  }

  const shippingInfo = req.user.address.find(
    (address) => address._id.toString() === addressId.toString()
  );
  if (!shippingInfo) {
    return next(new ApiError("Address not found", 404));
  }

  // 4) create new order with default cash payment

  const order = await Order.create({
    orderItems: cart.products,
    totalPrice,
    shippingInfo,
    user: req.user._id,
  });
  // 5) after create order increment product sold and decrement product quantity
  if (order) {
    const bulkOps = cart.products.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps, {});

    // 6) clear cart
    await Cart.findByIdAndDelete(req.params.cardId);
  }

  caches.shortTermCache_20Min.clear();

  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.created", { field: req.t("model.order") }), //"Order created successfully"
    data: order,
  });
});

// @des     update order paid status to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  private (Admin)/admin-manager

exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError(`No order found for id ${req.params.id}`, 404));
  }

  if (order.isPaid) {
    return next(new ApiError("Order is already paid", 400));
  }

  if (order.orderStatus === "cancelled" || order.orderStatus === "refunded") {
    return next(new ApiError("Cannot pay a cancelled or refunded order", 400));
  }

  order.isPaid = true;
  order.paidAt = Date.now();

  order.paymentInfo.status = "completed";
  order.paymentInfo.currency = req.body.currency || "EGP";
  order.paymentInfo.gateway = req.body.gateway || "cashOnDelivery";
  order.paymentInfo.paymentMethod = req.body.paymentMethod || "cashOnDelivery";

  const updatedOrder = await order.save();

  res.status(200).json({
    status: req.t("http.success"),
    message: "Order paid successfully",
    data: updatedOrder,
  });
});

// @des     update order status to delivered
// @route   PUT /api/v1/orders/:id/deliver
// @access  private (Admin)/admin-manager

exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError(`No order found for id ${req.params.id}`, 404));
  }

  // التحقق إذا كان الطلب مدفوع
  if (!order.isPaid) {
    return next(new ApiError("Order must be paid before delivery", 400));
  }

  // التحقق إذا كان الطلب ملغي أو مرتجع
  if (order.orderStatus === "cancelled" || order.orderStatus === "refunded") {
    return next(
      new ApiError("Cannot deliver a cancelled or refunded order", 400)
    );
  }

  // التحقق إذا كان الطلب مسلم مسبقاً
  if (order.isDelivered) {
    return next(new ApiError("Order is already delivered", 400));
  }

  // تحديث حالة التوصيل
  order.orderStatus = "delivered";
  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({
    status: req.t("http.success"),
    message: "Order delivered successfully",
    data: updatedOrder,
  });
});

// @des     update order status
// @route   PUT /api/v1/orders/:id/status
// @access  private (Admin)/admin-manager

exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, cancellationReason } = req.body;

  const validStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];

  if (!validStatuses.includes(status)) {
    return next(new ApiError("Invalid order status", 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError(`No order found for id ${req.params.id}`, 404));
  }

  if (status === "cancelled" || status === "refunded") {
    if (!cancellationReason) {
      return next(
        new ApiError(
          "Cancellation reason is required for cancelled/refunded orders",
          400
        )
      );
    }
    order.cancellationReason = cancellationReason;
  }

  order.orderStatus = status;

  if (status === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  } else if (status === "cancelled" || status === "refunded") {
    order.isDelivered = false;
  }

  const updatedOrder = await order.save();

  res.status(200).json({
    status: req.t("http.success"),
    message: `Order status updated to ${status}`,
    data: updatedOrder,
  });
});

// @des     cancel order
// @route   PUT /api/v1/orders/:id/cancel
// @access  private (Admin)/user

exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const { cancellationReason } = req.body;

  if (!cancellationReason) {
    return next(new ApiError("Cancellation reason is required", 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError(`No order found for id ${req.params.id}`, 404));
  }

  if (order.orderStatus === "delivered" || order.orderStatus === "shipped") {
    return next(
      new ApiError(
        "Cannot cancel order that is already shipped or delivered",
        400
      )
    );
  }

  if (order.orderStatus === "cancelled") {
    return next(new ApiError("Order is already cancelled", 400));
  }

  order.orderStatus = "cancelled";
  order.cancellationReason = cancellationReason;

  const updatedOrder = await order.save();

  res.status(200).json({
    status: req.t("http.success"),
    message: "Order cancelled successfully",
    data: updatedOrder,
  });
});

// @des     get Checkout session url  by Stripe hosted page
// @route   post /api/v1/orders/:cardId
// @access  private (Admin)/admin
exports.getCheckoutSession = asyncHandler(async (req, res, next) => {
  const { cardId } = req.params;

  // 1) get card by cardId
  const cart = await Cart.findById(cardId);
  if (!cart) {
    return next(new ApiError(`No cart form this id  ${cardId} `, 404));
  }

  if (!cart.products || cart.products.length === 0) {
    return next(new ApiError("Cart is empty", 400));
  }

  // 2) get order price by card price check if apply discount

  const taxPrice = 0;
  const shippingPrice = 0;

  const totalPrice = (
    (cart.totalPriceAfterDiscount || cart.totalPrice) +
    taxPrice +
    shippingPrice
  ).toFixed(2);

  const dynamicUrl = `${req.protocol}://${req.get("host")}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: [
      "card",
      "paypal",
      "crypto",
      "alipay",
      "amazon_pay",
      "samsung_pay",
    ],
    mode: "payment",
    client_reference_id: cardId,
    customer_email: req.user.email,
    phone_number_collection: {
      enabled: true,
    },

    metadata: {
      userId: req.user._id.toString(),
      cartId: cart._id.toString(),
      // address: req.user.address,
    },
    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: `Order for ${req.user.name}`,
          },
          unit_amount: Math.round(totalPrice * 100), // تحويل إلى قرش (100 قرش = 1 جنيه)
        },
        quantity: 1,
      },
    ],
    shipping_address_collection: {
      allowed_countries: ["EG", "SA", "AE"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: shippingPrice * 100,
            currency: "egp",
          },
          display_name: "Standard shipping",
        },
      },
    ],

    success_url: `${dynamicUrl}/order`,
    cancel_url: `${dynamicUrl}/cart`,
  });

  res.status(200).json({
    status: req.t("http.success"),
    session,
  });
});

const createOrderFromSession = async (session) => {
  const { userId, cartId } = session.metadata;
  const shippingAddress = session.customer_details.address || {};
  const { phone } = session.customer_details || "";
  const totalPrice = session.amount_total / 100; // Convert from cents to currency unit
  const isPaid = session.payment_status === "paid";
  const isComplete = session.status === "complete";

  if (!isComplete) return;

  const mapPaymentStatus = (stripeStatus) => {
    switch (stripeStatus) {
      case "paid":
        return "completed";
      case "unpaid":
        return "pending";
      case "no_payment_required":
        return "completed";
      default:
        return "pending";
    }
  };

  const cart = await Cart.findById(cartId);
  if (!cart) {
    throw new Error("Cart not found");
  }

  const orderItems = cart.products.map((item) => ({
    product: item.product._id,
    quantity: item.quantity,
    price: item.price,
    color: item.color || "default", // Provide default if color is missing
  }));

  const order = await Order.create({
    user: userId,
    orderItems: orderItems,
    shippingInfo: {
      phone,
      address: `${shippingAddress.line1} and ${shippingAddress.line2}`,
      city: shippingAddress.city,
      state: shippingAddress.state,
      country: shippingAddress.country,
      postalCode: shippingAddress.postal_code,
    },
    paymentInfo: {
      status: mapPaymentStatus(session.payment_status),
      gateway: session.payment_method_types[0],
      currency: session.currency.toUpperCase() || "EGP",
      paymentMethod: session.payment_method_types[0] || "card",
    },
    isPaid,
    paidAt: isPaid ? Date.now() : null,

    orderStatus: "processing",
    totalPrice,
    taxPrice: 0,
    shippingPrice: 0,
    isDelivered: false,
  });

  if (order) {
    const bulkOps = cart.products.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps, {});

    // 6) clear cart
    await Cart.findByIdAndDelete(cartId);
  }

  caches.shortTermCache_20Min.clear();

  return order;
};

// @ des     create webhook checkout
// @ route   post /api/v1/orders/webhook
// @ access  private (Admin)/admin
exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_KEY
    );
  } catch (err) {
    return res
      .status(400)
      .send(`Webhook Error: ${err.message} in order controller`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log(session, "NOTE session from webhook");

      // Create order logic here
      await createOrderFromSession(session);
      break;

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      break;

    default:
  }
  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});
