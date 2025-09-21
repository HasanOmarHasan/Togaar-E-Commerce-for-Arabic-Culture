const express = require("express");

const { protect, allowsTo } = require("../controller/authController");
const limiters = require("../Middleware/rateLimitMaddleware");
const {
  getAllOrders,
  getLoggedUserOrders,
  getOrder,
  createCashOrder,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus,
  cancelOrder,
  getCheckoutSession,
} = require("../controller/orderController");

const router = express.Router();

router.use(protect, limiters.auth);

// ==================== ADMIN/MANAGER ROUTES ====================

router.get("/all", allowsTo("admin", "manager"), getAllOrders);
router.put("/:id/pay", allowsTo("admin", "manager"), updateOrderToPaid);
router.put(
  "/:id/deliver",
  allowsTo("admin", "manager"),
  updateOrderToDelivered
);
router.put("/:id/status", allowsTo("admin", "manager"), updateOrderStatus);

// ==================== USER ROUTES ====================

router.use(allowsTo("user"));

router.put("/:id/cancel", cancelOrder);

router.route("/").get(getLoggedUserOrders);

router.route("/:cardId").get(getCheckoutSession).post(createCashOrder);

router.route("/:id").get(getOrder);

module.exports = router;
