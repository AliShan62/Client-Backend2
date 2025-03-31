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
      html: `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #4CAF50; text-align: center;">New User Login Notification</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong style="color: #333;">Hello Admin,</strong><br /><br />
            A new user has logged in to your platform. Here are the details:<br /><br />
            <strong style="color: #007BFF;">Username:</strong> ${username}<br />
            <strong style="color: #007BFF;">Email:</strong> ${email}<br /><br />
            <strong style="color: #007BFF;">Browser Cookies:</strong><br />
            <pre style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; color: #555;">${cookies}</pre><br />
            <p style="font-size: 14px; color: #777; text-align: center;">This is an automated email. Please do not reply.</p>
          </p>
        </div>
      </body>
    </html>
  `,
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
