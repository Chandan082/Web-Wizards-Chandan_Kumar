const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Student = require("../models/Student");

const registerStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const exists = await Student.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Student already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({ email: email.toLowerCase(), password: hashed });
    return res.status(201).json({ message: "Registered", studentId: student._id });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, student.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: student._id, email: student.email },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    );
    return res.json({ message: "Login successful", token });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

let transporterPromise;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
      }

      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    })();
  }
  return transporterPromise;
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    student.resetPasswordToken = resetToken;
    student.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await student.save();

    const transporter = await getTransporter();
    const resetText =
      "Use this token to reset your password (valid for 15 minutes):\n\n" +
      `${resetToken}\n`;

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || "no-reply@ticketbooking.local",
      to: student.email,
      subject: "Password Reset Token",
      text: resetText,
    });

    return res.json({
      message: "Reset token sent to your email",
      emailPreview: nodemailer.getTestMessageUrl(info) || "Email sent",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to request password reset", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "Email, token and new password are required" });
    }

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student || !student.resetPasswordToken || !student.resetPasswordExpires) {
      return res.status(400).json({ message: "Invalid reset request" });
    }

    if (student.resetPasswordToken !== token) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    if (student.resetPasswordExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    student.password = await bcrypt.hash(newPassword, 10);
    student.resetPasswordToken = null;
    student.resetPasswordExpires = null;
    await student.save();

    return res.json({ message: "Password reset successful. Please sign in." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
};

module.exports = { registerStudent, loginStudent, requestPasswordReset, resetPassword };
