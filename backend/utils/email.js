const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // In development, just log the email instead of sending
  if (process.env.NODE_ENV === "development") {
    console.log("\n===== DEVELOPMENT EMAIL =====");
    console.log("To:", options.email);
    console.log("Subject:", options.subject);
    console.log("Message:", options.message);
    console.log("============================\n");
    return { messageId: "dev-" + Date.now() };
  }

  // Validate environment variables
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP credentials missing in environment variables");
    throw new Error("Email service configuration error");
  }

  // Create reusable transporter object
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // For development only
    },
  });

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log("SMTP connection verified");
  } catch (error) {
    console.error("SMTP connection failed:", error);
    throw new Error("SMTP connection failed: " + error.message);
  }

  // Setup email data
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message, // HTML version if available
  };

  // Send mail with defined transport object
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email sending failed: " + error.message);
  }
};

module.exports = sendEmail;
