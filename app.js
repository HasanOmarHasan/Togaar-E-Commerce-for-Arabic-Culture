/* eslint-disable import/no-extraneous-dependencies */
const pahFile = require("path");

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const helmet = require("helmet");
const { Server } = require("socket.io");
const http = require("http");
const dotenv = require("dotenv").config({ path: "./config/setting.env" });

const dbConnection = require("./config/db");
const ApiError = require("./utils/ApiError");
const errorMiddleware = require("./Middleware/errorMiddleware");
const limiters = require("./Middleware/rateLimitMaddleware");
const { i18nextMiddleware } = require("./locales/i18n");

// Socket handler
const socketHandler = require("./utils/socket");

// Route
const MountRoutes = require("./routes");
const { webhookCheckout } = require("./controller/orderController"); // webhook for online payment handel by stripe

// Constants
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV === "dev";
const isProduction = process.env.NODE_ENV === "production";

// Initialize Express app
const app = express();

// Connect to database
dbConnection();

app.set("trust proxy", 1);
// ========================
// SOCKET.IO CONFIG
// ========================
const SocketServer = http.createServer(app);

const io = new Server(SocketServer, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = ["http://localhost:3000"];
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || isDevelopment) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Pass io to socketHandler
socketHandler(io);

// ========================
// SECURITY MIDDLEWARES
// ========================

// Helmet for setting security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // ليس ضرورياً للـ API
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,

    // تفعيل الميزات المهمة
    hidePoweredBy: true, // إخفاء Express
    hsts: isProduction
      ? {
          maxAge: 31536000, // سنة واحدة
          includeSubDomains: true,
          preload: true,
        }
      : false,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: false,
    frameguard: { action: "deny" },
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",

      // Add your production domains here
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Auth-Token",
    "X-API-Key",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range", "X-Total-Count"],
};

app.use(cors(corsOptions));

app.use("/api/v1/", limiters.normal);

app.use(i18nextMiddleware);

// ========================
// BODY PARSING MIDDLEWARES
// ========================

// Mount webhook route BEFORE any other middleware
app.post(
  "/api/v1/orders/webhook",
  express.raw({ type: "application/json" }),
  webhookCheckout
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// Serve static files
app.use(
  express.static(pahFile.join(__dirname, "uploads"), {
    maxAge: isProduction ? "30d" : "0", // Cache static assets in production
    setHeaders: (res, path) => {
      // caching مختلف لأنواع الملفات
      if (
        path.endsWith(".jpg") ||
        path.endsWith(".png") ||
        path.endsWith(".webp")
      ) {
        res.setHeader("Cache-Control", "public, max-age=2592000"); // 30 يوم للصور
      } else if (path.endsWith(".js") || path.endsWith(".css")) {
        res.setHeader("Cache-Control", "public, max-age=86400"); // 1 يوم للأصول
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// ========================
// PERFORMANCE MIDDLEWARES
// ========================

// Compression (gzip)
app.use(
  compression({
    level: 6,
    // threshold: 10000,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"] || req.path.includes("webhook")) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);
// app.use(compression())

// ========================
// LOGGING MIDDLEWARES
// ========================

// Morgan logging
if (isDevelopment) {
  app.use(morgan("dev"));
  console.log(`Mode : ${process.env.NODE_ENV}`);
} else {
  app.use(
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400, // Only log errors in production
      stream: process.stderr,
    })
  );

  app.use(
    morgan("combined", {
      skip: (req, res) => res.statusCode >= 400, // Log all successful requests
      stream: process.stdout,
    })
  );
}

// Debugging middleware - only in development
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`\n--- NEW REQUEST ---`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.originalUrl}`);
    console.log(`IP: ${req.ip}`);
    console.log("User Agent:", req.get("User-Agent"));
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("--- END REQUEST ---\n");
    next();
  });
}

// ========================
// MOUNT ROUTES
// ========================

MountRoutes(app);

// ========================
// HEALTH CHECK
// ========================
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", env: process.env.NODE_ENV });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());
// ========================
// 404 HANDLER
// ========================

app.use((req, res, next) => {
  next(new ApiError(`Cant find this route ${req.originalUrl}`, 404));
});

// ========================
// GLOBAL ERROR HANDLER
// ========================
// global Error handel Middleware
app.use(errorMiddleware);

// ========================
// GRACEFUL SHUTDOWN
// ========================

// const server = app.listen(PORT, "0.0.0.0", () => {
//   console.log(`
//   🚀 Server is running on http://localhost:${PORT}
//   📁 Environment: ${process.env.NODE_ENV}
//   ⏰ Started at: ${new Date().toISOString()}
//   `);
// });

const server = SocketServer.listen(PORT, "0.0.0.0", () => {
  console.log(`
  🚀 Server is running on http://localhost:${PORT}
  📁 Environment: ${process.env.NODE_ENV}
  ⏰ Started at: ${new Date().toISOString()}
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`UNHANDLED REJECTION! 💥 Shutting down... ${err}`);
  console.error(err.name, err.message);

  // Gracefully close server
  server.close(() => {
    console.error("💥 Process terminated!", err.name, err.message);
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle SIGTERM for graceful shutdown (e.g., in Docker)
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
