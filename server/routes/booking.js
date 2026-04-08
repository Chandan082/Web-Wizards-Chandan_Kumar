const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createBooking,
  exportBookings,
  getBookedSeats,
  resendTicketEmail,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", authMiddleware, createBooking);
router.post("/resend-ticket-email", authMiddleware, resendTicketEmail);
router.get("/seats", authMiddleware, getBookedSeats);
router.get("/export", authMiddleware, exportBookings);

module.exports = router;
