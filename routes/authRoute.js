const express = require("express");
const {
  signup,
  login,
  logout,
  refreshToken,
  ForgetPassword,
  VerifyResetCode,
  ResetPassword,
} = require("../controller/authController");

const {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyResetValidator,
} = require("../utils/validator/authValidator");

const limiters = require("../Middleware/rateLimitMaddleware");

const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/login", limiters.auth,loginValidator, login);
router.post("/logout", logout);
router.post("/refreshToken/", refreshToken);

router.post(
  "/ForgetPassword",
  limiters.strict,
  forgotPasswordValidator,
  ForgetPassword
);
router.post("/VerifyResetCode", verifyResetValidator, VerifyResetCode);
router.put("/ResetPassword", resetPasswordValidator, ResetPassword);

module.exports = router;
