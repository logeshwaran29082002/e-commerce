const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");


//get all products - GET /api/v1/products
exports.getProducts = async (req, res, next) => {
  const resPerPage = 5;
  const apiFeatures = new APIFeatures(Product.find(), req.query)
    .search()
    .filter()
    .paginate(resPerPage);

  const products = await apiFeatures.query;
  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
};

// Create a new product - POST /api/v1/product/new
exports.newProduct = catchAsyncError(async (req, res, next) => {
  req.body.user = req.user.id; // Assuming user is authenticated and user ID is available in req.user
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

// Get a single product - GET /api/v1/product/:id
exports.getSingleProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found ", 404));
  }

  res.status(201).json({
    success: true,
    product,
  });
};

//Update a product - PUT /api/v1/product/:id
exports.updateProduct = async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    product,
  });
};

// Delete a product - DELETE /api/v1/product/:id
exports.deleteProducts = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }
  await Product.deleteOne({ _id: req.params.id }); // or use findByIdAndDelete
  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
};
exports.createReview = catchAsyncError(async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  const review = {
    user: req.user.id,
    rating,
    comment,
  };

  // Find product
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Check if user already reviewed
  const isReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user.id.toString()
  );

  if (isReviewed) {
    // Update review
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user.id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    // Add new review
    product.reviews.push(review);
  }

  // Update number of reviews
  product.numOfReviews = product.reviews.length;

  // Calculate average rating
  product.ratings =
    product.reviews.reduce((acc, review) => review.rating + acc, 0) /
    product.reviews.length;
  product.ratings = isNaN(product.ratings) ? 0 : product.ratings;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review created successfully",
  });
});


// Get Reviews of a product - GET /api/v1/reviews?id=productId

exports.getReviews = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews
  });
});


// Delete review - DELETE /api/v1/review
exports.deleteReview = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Filter out the review to be deleted
  const reviews = product.reviews.filter(review => 
    review._id.toString() !== req.query.id.toString()
  );

  // Update number of reviews
  const numOfReviews = reviews.length;

  // Calculate new average rating
  let ratings = reviews.reduce((acc, review) => review.rating + acc, 0) / reviews.length;
  ratings = isNaN(ratings) ? 0 : ratings;

  // Update the product document
  await Product.findByIdAndUpdate(req.query.productId, {
    reviews,
    numOfReviews,
    ratings
  });

  res.status(200).json({
    success: true,
    message: "Review deleted successfully"
  });
});