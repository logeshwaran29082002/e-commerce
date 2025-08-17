const express = require("express");
const { get } = require("mongoose");
const {
  getProducts,
  newProduct,
  getSingleProduct,
  updateProduct,
  deleteProducts,
  createReview,
  getReviews,
  deleteReview,
} = require("../controllers/productController");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");

router.route("/products").get(isAuthenticatedUser, getProducts);
router.route("/product/:id").get(getSingleProduct);
router.route("/product/:id").put(updateProduct);
router.route("/product/:id").delete(deleteProducts);

router.route("/review").put(isAuthenticatedUser, createReview);
router.route("/review").delete(deleteReview);
router.route("/reviews").get(getReviews);

// Admin Routes
router
  .route("/admin/product/new")
  .post(isAuthenticatedUser, authorizeRoles("admin"), newProduct);

module.exports = router;
