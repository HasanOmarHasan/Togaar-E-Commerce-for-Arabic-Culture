// const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const factory = require("./handlersFactory");

// @des add address
// @route POST /api/v1/address/
// @access private/user
exports.addAddress = factory.createUserArrayHandler("address" , User , "add" );


// @des Update address
// @route  put/api/v1/address/:addressId
// @access private/user
exports.updateAddress = factory.createUserArrayHandler("address", User, "update");


// @des remove address
// @route DELETE /api/v1/address/:addressId
// @access private/user
exports.removeAddress = factory.createUserArrayHandler("address", User, "remove" ,{paramKey : "addressId"});


// @des get Logged user address
// @route GET /api/v1/address/
// @access private/user
exports.getAddress = factory.createUserArrayHandler("address", User, "get");


