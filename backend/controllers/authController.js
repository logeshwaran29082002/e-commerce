const catchAsyncErrors = require("../middlewares/catchAsyncError");
const User = require("../models/userModel");
const sendEmail = require("../utils/email");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwt");
const crypto = require("crypto");

// Create a new user http://localhost:8000/api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, avatar } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar,
  });

  sendToken(user, 201, res);
});

// Login user http://localhost:8000/api/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }
  // Find user in the database
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new c("Invalid email and password", 401));
  }
  // Check if password is correct
  const isPasswordMatched = await user.isValidPassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email and password", 401));
  }
  sendToken(user, 201, res);
});

//logout user http://localhost:8000/api/v1/logout

exports.logOutUser = (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    sucess: true,
    message: "Logged out successfully",
  });
};

// FORGET PASSWORD http://localhost:8000/api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new ErrorHandler("User not found with this email", 404));
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetToken}`;
    const message = `Your password reset token is:\n\n${resetUrl}\n\nIf you didn't request this, please ignore.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "LR Cart Password Recovery",
        message: message,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`,
      });
    } catch (emailError) {
      // Reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email sending error:", emailError);
      return next(
        new ErrorHandler(
          "Email could not be sent. Please try again later.",
          500
        )
      );
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password http://localhost:8000/api/v1/password/reset/:token
exports.resetpassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler("Reset password token is invalid or has expired", 400)
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 201, res);
});

// Get user Profile http://localhost:8000/api/v1/myProfile
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

// change password http://localhost:8000/api/v1/password/change
exports.changePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // Check if old password is correct
  const isPasswordMatched = await user.isValidPassword(req.body.oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 401));
  }

  // Update password
  user.password = req.body.newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Update user Profile http://localhost:8000/api/v1/me/update

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    sucess: true,
    message: "Profile updated successfully",
    user,
  });
});
// Admin: Get all users  http://localhost:8000/api/v1/admin/users
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

// Admin: Get specific user details http://localhost:8000/api/v1/admin/users/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id ${req.params.id}`, 400)
    );
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// Admin: Update user role http://localhost:8000/api/v1/admin/users/:id
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id ${req.params.id}`, 400)
    );
  }
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

// Admin: Delete user http://localhost:8000/api/v1/admin/users/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id ${req.params.id}`, 400)
    );
  }
  await user.deleteOne(); // or user.remove() if using older Mongoose
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
