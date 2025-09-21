const User = require("../models/userModel");
const factory = require("./handlersFactory");

// @des add product to wishlist
// @route POST /api/v1/wishlist/
// @access private/user

exports.addToWishlist = factory.createUserArrayHandler("wishlist", User, "add" , {getItemFromBody : (body) => body.productId} );


// @des remove product from wishlist
// @route DELETE /api/v1/wishlist/:productId
// @access private/user
exports.removeFromWishlist = factory.createUserArrayHandler(
  "wishlist",
  User,
  "remove" , 
 {removeQuery : "productId"}
);


// @des get wishlist
// @route GET /api/v1/wishlist/
// @access private/user
exports.getWishlist = factory.createUserArrayHandler("wishlist", User, "get" ,{populate : true});


// des remove All product in wishlist
// @route DELETE /api/v1/wishlist/
// @access private/user
exports.removeAllFromWishlist = factory.createUserArrayHandler(
  "wishlist",
  User,
  "removeAll"
);
