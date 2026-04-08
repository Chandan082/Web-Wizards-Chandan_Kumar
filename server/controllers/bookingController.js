const nodemailer = require("nodemailer");
const { Parser } = require("json2csv");
const Ticket = require("../models/Ticket");

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

const buildTicketHtml = ({ name, seatNumber, ticketId }) => {
  const escapedName = String(name).replace(/[<>&"']/g, "");
  const qrData = `WEB-${ticketId}`;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your WebWizards Ticket</title>
    <style>
        body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px; color: #1f2937; }
        .ticket-wrapper { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb; }
        .ticket-header { background-color: #3b82f6; background-image: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-align: center; padding: 35px 20px; }
        .ticket-header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
        .ticket-header p { margin: 8px 0 0 0; font-size: 15px; opacity: 0.9; }
        .ticket-body { padding: 30px; }
        .event-title { font-size: 22px; font-weight: 700; margin-bottom: 5px; color: #111827; }
        .event-location { color: #64748b; font-size: 14px; margin-bottom: 25px; }
        .details-grid { display: table; width: 100%; border-top: 2px dashed #e2e8f0; border-bottom: 2px dashed #e2e8f0; padding: 20px 0; margin-bottom: 25px; }
        .col { display: table-cell; width: 50%; }
        .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
        .value { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 15px; }
        .qr-section { text-align: center; background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; }
        .qr-code { width: 160px; height: 160px; background-color: #ffffff; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 10px auto; display: block; }
        .ticket-id { font-family: monospace; font-size: 14px; color: #64748b; letter-spacing: 1px; }
        .ticket-footer { background-color: #f8fafc; text-align: center; padding: 20px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .ticket-footer a { color: #3b82f6; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
    <div class="ticket-wrapper">
        <div class="ticket-header">
            <h1>🎟️ Booking Confirmed!</h1>
            <p>You're all set. Present this ticket at the entrance.</p>
        </div>
        <div class="ticket-body">
            <div class="event-title">Technovanza 2026</div>
            <div class="event-location">📍 Central Institute of Tech, Main Auditorium</div>
            <div class="details-grid">
                <div class="col">
                    <div class="label">Date & Time</div>
                    <div class="value">Sat, Oct 25 • 10:00 AM</div>
                    <div class="label">Ticket Type</div>
                    <div class="value">General Admission</div>
                </div>
                <div class="col">
                    <div class="label">Attendee</div>
                    <div class="value">${escapedName}</div>
                    <div class="label">Seat Number</div>
                    <div class="value">${seatNumber}</div>
                </div>
            </div>
            <div class="qr-section">
                <div class="label">Scan at Entry</div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}" alt="Ticket QR Code" class="qr-code">
                <div class="ticket-id">ID: ${qrData}</div>
            </div>
        </div>
        <div class="ticket-footer">
            <p>Need help with your order? <br> Contact us at <a href="mailto:support@webwizards.com">support@webwizards.com</a></p>
        </div>
    </div>
</body>
</html>`;
};

const sendTicketEmail = async ({ to, name, college, aadharNumber, seatNumber, ticketMongoId }) => {
  const transporter = await getTransporter();
  const ticketId = String(ticketMongoId).slice(-8).toUpperCase();
  const ticketHtml = buildTicketHtml({ name, seatNumber, ticketId });
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@ticketbooking.local",
    to,
    subject: "Ticket Booking Confirmation",
    html: ticketHtml,
    text:
      `Name: ${name}\n` +
      `College: ${college}\n` +
      `Aadhar: ${aadharNumber}\n` +
      `Seat: ${seatNumber}\n` +
      `Ticket ID: WEB-${ticketId}`,
  });
  return nodemailer.getTestMessageUrl(info) || "Email sent";
};

const createBooking = async (req, res) => {
  try {
    const { name, college, aadharNumber, seatNumber } = req.body;
    if (!name || !college || !aadharNumber || !seatNumber) {
      return res.status(400).json({ message: "All fields including seat number are required" });
    }

    const numericSeat = Number(seatNumber);
    if (Number.isNaN(numericSeat) || numericSeat < 1 || numericSeat > 100) {
      return res.status(400).json({ message: "Seat number must be between 1 and 100" });
    }

    const seatTaken = await Ticket.findOne({ seatNumber: numericSeat });
    if (seatTaken) {
      return res.status(409).json({ message: "This seat is already booked. Please choose another seat." });
    }

    const ticket = await Ticket.create({
      student: req.user.id,
      name,
      college,
      aadharNumber,
      seatNumber: numericSeat,
    });

    const emailPreview = await sendTicketEmail({
      to: req.user.email,
      name,
      college,
      aadharNumber,
      seatNumber: numericSeat,
      ticketMongoId: ticket._id,
    });

    return res.status(201).json({
      message: "Booking successful",
      ticket,
      emailPreview,
    });
  } catch (error) {
    return res.status(500).json({ message: "Booking failed", error: error.message });
  }
};

const resendTicketEmail = async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).json({ message: "ticketId is required" });
    }

    const ticket = await Ticket.findOne({ _id: ticketId, student: req.user.id });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found for this user" });
    }

    const emailPreview = await sendTicketEmail({
      to: req.user.email,
      name: ticket.name,
      college: ticket.college,
      aadharNumber: ticket.aadharNumber,
      seatNumber: ticket.seatNumber,
      ticketMongoId: ticket._id,
    });

    return res.json({ message: "Ticket email sent successfully", emailPreview });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send ticket email", error: error.message });
  }
};

const getBookedSeats = async (req, res) => {
  try {
    const tickets = await Ticket.find({}, "seatNumber").sort({ seatNumber: 1 });
    return res.json({ bookedSeats: tickets.map((t) => t.seatNumber) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch seat map", error: error.message });
  }
};

const exportBookings = async (req, res) => {
  try {
    const data = await Ticket.find().populate("student", "email").sort({ createdAt: -1 });
    const rows = data.map((row) => ({
      ticketId: row._id.toString(),
      studentEmail: row.student?.email || "",
      name: row.name,
      college: row.college,
      aadharNumber: row.aadharNumber,
      seatNumber: row.seatNumber,
      createdAt: row.createdAt,
    }));

    const parser = new Parser({
      fields: ["ticketId", "studentEmail", "name", "college", "aadharNumber", "seatNumber", "createdAt"],
    });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("bookings.csv");
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: "Export failed", error: error.message });
  }
};

module.exports = { createBooking, exportBookings, getBookedSeats, resendTicketEmail };
