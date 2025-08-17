const express = require("express");
const {
  registerUser,
  loginUser,
  logOutUser,
  forgotPassword,
  resetpassword,
  getUserProfile,
  changePassword,
  updateProfile,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  deleteUser,
} = require("../controllers/authController");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logOutUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").post(resetpassword);
router.route("/myProfile").get(isAuthenticatedUser, getUserProfile);
router.route("/password/change").put(isAuthenticatedUser, changePassword);
router.route("/update").put(isAuthenticatedUser, updateProfile);

// Admin Routes
router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);
router
  .route("/admin/users/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getUserDetails)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;
