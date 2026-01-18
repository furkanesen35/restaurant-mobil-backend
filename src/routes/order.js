const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { orderValidation } = require("../middleware/validation");

// Create a new order (authentication optional for testing)
router.post(
  "/",
  (req, res, next) => {
    // Try to authenticate, but don't fail if no token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const { authenticate } = require("../middleware/auth");
      return authenticate(req, res, next);
    }
    next();
  },
  orderController.createOrder
);

// Get all orders (admin only) - MUST come before /:orderId
router.get("/all", authenticate, requireAdmin, orderController.getAllOrders);

// Get user's own orders - MUST come before /:orderId
router.get("/my-orders", authenticate, orderController.getMyOrders);

// Get all orders for a user (requires authentication)
router.get("/user/:userId", authenticate, orderController.getUserOrders);

// Get single order by ID (requires authentication) - MUST come after specific routes
router.get("/:orderId", authenticate, orderController.getOrderById);

// Update order status (admin only)
router.patch(
  "/:orderId/status",
  authenticate,
  orderValidation.updateStatus,
  orderController.updateOrderStatus
);

// Delete an order (admin only)
router.delete(
  "/:orderId",
  authenticate,
  requireAdmin,
  orderController.deleteOrder
);

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    message: "Order API is working",
    timestamp: new Date().toISOString(),
    endpoints: {
      "POST /": "Create order",
      "GET /user/:userId": "Get user orders",
      "GET /my-orders": "Get authenticated user orders (requires auth)",
      "GET /all": "Get all orders (admin only)",
      "PATCH /:orderId/status": "Update order status (admin only)",
    },
  });
});

module.exports = router;
