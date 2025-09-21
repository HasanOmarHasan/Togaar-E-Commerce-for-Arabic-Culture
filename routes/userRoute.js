const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  uploadUserImage,
  optimizeImage,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
  deleteLoggedUserData,
  ActiveLoggedUserData,
  changeLanguage,
} = require("../controller/userController");

const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changePasswordValidator,
  loggedUserchangePasswordValidator,
  updateLoggedUserValidator,
} = require("../utils/validator/userValidator");

const { protect, allowsTo } = require("../controller/authController");
const limiters = require("../Middleware/rateLimitMaddleware");

const router = express.Router();

router.use(protect);

router.put("/changeLanguage", changeLanguage);

router.get("/getMe", getLoggedUserData, getUser);
router.patch(
  "/updateMyPassword",
  limiters.auth,
  loggedUserchangePasswordValidator,
  updateLoggedUserPassword
);
router.put(
  "/updateMe",
  uploadUserImage,
  optimizeImage,
  updateLoggedUserValidator,
  updateLoggedUserData
);
router.delete("/deactivate", limiters.strict, deleteLoggedUserData);

router.put("/reactivate", limiters.strict, ActiveLoggedUserData);

router.use(allowsTo("admin", "manager"));
router
  .route("/")
  .get(getUsers)
  .post(uploadUserImage, optimizeImage, createUserValidator, createUser);
router
  .route("/:id")
  .get(getUserValidator, getUser)
  .put(uploadUserImage, optimizeImage, updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

router.put(
  "/changePassword/:id",

  changePasswordValidator,
  changeUserPassword
);

module.exports = router;
