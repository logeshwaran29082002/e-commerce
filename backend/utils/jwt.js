const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 7;

  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
    options.sameSite = "strict";
  }

  user.password = undefined;

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
