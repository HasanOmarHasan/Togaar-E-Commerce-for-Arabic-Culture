// Route
const CategoryRoute = require("./categoryRoute");
const SupCategoryRoute = require("./supCategoryRoute");
const BrandRoute = require("./brandRoute");
const ProductRoute = require("./productRoute");
const UserRoute = require("./userRoute");
const AuthRoute = require("./authRoute");
const ReviewRoute = require("./reviewRoute");
const wishlistRoute = require("./wishlistRoute");
const addressRoute = require("./addressRoute");
const couponRoute = require("./couponRoute");
const cartRoute = require("./cartRoute");
const orderRoute = require("./orderRoute");
const chatRoute = require("./chatRoute");


const MountRoutes = (app) => {
    
    // Mount Routes
    app.use("/api/v1/categories", CategoryRoute);
    app.use("/api/v1/supCategories", SupCategoryRoute);
    app.use("/api/v1/Brands", BrandRoute);
    app.use("/api/v1/Products", ProductRoute);
    app.use("/api/v1/users", UserRoute);
    app.use("/api/v1/auth", AuthRoute);
    app.use("/api/v1/reviews", ReviewRoute);
    app.use("/api/v1/wishlists", wishlistRoute);
    app.use("/api/v1/address", addressRoute);
    app.use("/api/v1/coupons", couponRoute);
    app.use("/api/v1/carts", cartRoute);
    app.use("/api/v1/orders", orderRoute);
    app.use("/api/v1/chats", chatRoute);
}

module.exports = MountRoutes;