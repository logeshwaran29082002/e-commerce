const catchAsyncErrors = require("../middlewares/catchAsyncError");
const Order = require("../models/ordermodel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
// Create New Order - api/vi/order/new
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    orderItems,
    shippingInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
  } = req.body;

  const order = await Order.create({
    orderItems,
    shippingInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    paidAt: Date.now(),
    user: req.user._id,
  });
  res.status(200).json({
    success: true,
    order,
  });
});

// Get single Order - api/vi/order/:id
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(
      new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    success: true,
    order,
  });
});

// Get logged in user orders - api/vi/myorders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// Admin :Get All Order = api/v1/orders
exports.orders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// Admin : Update Order Status = api/v1/admin/order/:id
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
 const order = await Order.findById(req.params.id);
 if(order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }
  // Update stock of the product
  order.orderItems.forEach( async orderItems =>{
  await  updateStock(orderItems.product, orderItems.quantity);

  })
  order.orderStatus = req.body.orderStatus;
  order.deliveredAt = Date.now();

  await order.save();
    res.status(200).json({
    success: true,
    
    });
});

async function updateStock(productId, quantity) {
    const product = await Product.findById(productId);
    if (!product) {
        throw new ErrorHandler(`Product not found with id: ${productId}`, 404);
    }
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false });
};


// Admin : Delete Order = api/v1/admin/order/:id
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404));
  }
  await order.deleteOne(); // preferred in modern Mongoose
  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});