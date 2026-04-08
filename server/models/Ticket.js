const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    name: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true },
    aadharNumber: { type: String, required: true, trim: true },
    seatNumber: { type: Number, required: true, min: 1, max: 100, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
