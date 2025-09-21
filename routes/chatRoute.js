const express = require("express");

const { protect, allowsTo } = require("../controller/authController");
const { chatWithBot , clearAllChatsBots , getAllChatsBots} = require("../controller/chatController");

const limiters = require("../Middleware/rateLimitMaddleware");

const router = express.Router();

router.use(protect, allowsTo("user") , limiters.strict);

// Routes for AI chatbot
router.route("/chatBot").post(chatWithBot).get(getAllChatsBots)
router.delete("/chatBot/:id", clearAllChatsBots);


module.exports = router;
