const express = require("express");
const {
  registerStudent,
  loginStudent,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;
