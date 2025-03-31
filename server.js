require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 9000;
const SECRET_KEY = process.env.SECRET_KEY || "ABCXYZ";

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5501",
      "https://client-frontend2.vercel.app",
    ],
    credentials: true,
  })
);

// Dummy authentication storage
const users = {};

// ✅ Login Route
app.post("/login", async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Please enter all fields!" });
    }

    if (users[email]) {
      return res.json({
        success: false,
        message: `✅ Already logged in as ${username}`,
      });
    }

    // Generate a JWT token
    const cookies = jwt.sign({ username, email }, SECRET_KEY, {
      expiresIn: "1h",
    });
    users[email] = { username, email, cookies };

    // ✅ Send email to admin only for new login
    await sendEmailToAdmin(username, email, cookies);

    return res.json({
      success: true,
      message: `✅ Logged in as ${username}`,
      cookies,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "❌ Server Error!" });
  }
});

// ✅ Function to Send Email to Admin
async function sendEmailToAdmin(username, email, cookies) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: "New User Login Notification",
      text: `User ${username} logged in with email: ${email}\n user browser cookies: ${cookies}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Admin notified about new login.");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

app.get("/", (req, res) => {
  res.send("Hello World");
});
// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
