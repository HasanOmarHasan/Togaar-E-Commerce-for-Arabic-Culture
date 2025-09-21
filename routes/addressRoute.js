const express = require("express");

const { protect, allowsTo } = require("../controller/authController");
const limiters = require("../Middleware/rateLimitMaddleware");
const {
  addAddress,
removeAddress,
  getAddress,
updateAddress
} = require("../controller/addressController");

const {
  addAddressValidator,
updateAddressValidator,
removeAddressValidator
} = require("../utils/validator/addressValidator");


const router = express.Router();

router.use(protect, allowsTo("user") , limiters.auth);

router.route("/").post( addAddressValidator,addAddress).get(getAddress)

router
  .route("/:addressId")
  .delete(removeAddressValidator,removeAddress).put(updateAddressValidator , updateAddress);

module.exports = router;
