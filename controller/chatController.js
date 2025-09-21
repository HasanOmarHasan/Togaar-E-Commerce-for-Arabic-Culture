const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const askGemini = require("../utils/gemini");
const Product = require("../models/productModel");
const { caches, generateCacheKey } = require("../utils/cashe");
const factory = require("./handlersFactory");

// @desc Get all products  (Helper Function)
const getAllProducts = asyncHandler(async () => {
  if (caches.mediumTermCache_7Days.has("products-summary")) {
    return caches.mediumTermCache_7Days.get("products-summary");
  }

  const products = await Product.find({}, "title description price").lean();
  const summary = products.map((p) => ({
    title: p.title,
    description: p.description.substring(0, 150), // خليه قصير
    price: p.price,
  }));

  caches.mediumTermCache_7Days.set("products-summary", summary);
  return summary;
});

// @desc Chat with bot
// @route POST /api/v1/chats/chatbot
// @access Private
exports.chatWithBot = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  const user = req.user._id; // يفترض إن عندك auth middleware بيربط اليوزر

  let chat = await Chat.findOne({ user , type : "ai"}).sort({ createdAt: -1 });

  if (!chat) {
    chat = await Chat.create({
      user,
      messages: [],
      chatName: message.substring(0, 30) || "chatBot AI assistant",
    });
  }

  chat.messages.push({ role: "user", content: message });

  const conversationHistory = chat.messages
    .slice(-6)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const products = await getAllProducts();

  const prompt = `
You are a friendly AI shopping assistant for ${process.env.APP_NAME}.
- Always reply in ${req.language}.
- Help the user compare products, answer questions, and guide them to purchase.
- Be short, clear, and helpful.

Conversation so far:
${conversationHistory}

Available products:
${products.map((p) => `• ${p.title} (${p.price}$): ${p.description}`).join("\n")}
`;

  const botReply = await askGemini(prompt);

  chat.messages.push({ role: "assistant", content: botReply });
  if (chat.messages.length > 50) {
    chat.messages = chat.messages.slice(-50);
  }
  await chat.save();

  caches.mediumTermCache_7Days.set(generateCacheKey("chat", user), chat);

  res.status(200).json({
    status: req.t("http.success"),
    reply: botReply,
    results: chat.messages.length,
    chatName: chat.chatName,
    chat,
  });
});

// @desc Get all chats Bot
// @route GET /api/v1/chats/chatbot
// @access Private
exports.getAllChatsBots = asyncHandler(async (req, res, next) => {
  let conversationHistory;
  if (
    caches.mediumTermCache_7Days.has(generateCacheKey("chat", req.user._id))
  ) {
    conversationHistory = caches.mediumTermCache_7Days.get(
      generateCacheKey("chat", req.user._id)
    );
    return res.status(200).json({
      status: req.t("http.success"),
      cheched: true,
      chatName: conversationHistory.chatName,
      results: conversationHistory.messages ? conversationHistory.messages.length : 0,
      data: conversationHistory,
    });
  }

  const chats = await Chat.find({ user: req.user._id }).sort({ createdAt: -1 });
  caches.mediumTermCache_7Days.set(
    generateCacheKey("chat", req.user._id),
    chats
  );

  res.status(200).json({
    status: req.t("http.success"),
    results: chats.length || 0,
    cheched: false,
    chatName: chats.chatName,
    data: chats,
  });
});

// @desc clear all chat Bot
// @route DELETE /api/v1/chats/chatbot/:chatId
// @access Private
exports.clearAllChatsBots = factory.deleteOne(Chat);


// @desc chat with support make it by socket.io
// @route POST /api/v1/chats/chatSupport
// @access Private
exports.chatWithSupport = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: req.t("http.success"),
    message: req.t("http.authChatSupport"),
  });
});