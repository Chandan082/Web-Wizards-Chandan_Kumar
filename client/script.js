const API_BASE = "http://localhost:5000/api";
const TOKEN_KEY = "ticket_booking_token";
const PENDING_BOOKING_KEY = "ticket_booking_pending";
const LAST_TICKET_KEY = "ticket_booking_last_ticket";

const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const getToken = () => localStorage.getItem(TOKEN_KEY);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const bookingForm = document.getElementById("bookingForm");
const exportBtn = document.getElementById("exportBtn");
const logoutBtn = document.getElementById("logoutBtn");
const result = document.getElementById("result");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      setToken(data.token);
      window.location.href = "./booking.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");
      alert("Registration successful. Please login.");
      registerForm.reset();
    } catch (error) {
      alert(error.message);
    }
  });
}

if (bookingForm) {
  if (!getToken()) window.location.href = "./login.html";
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const college = document.getElementById("college").value.trim();
    const aadharNumber = document.getElementById("aadharNumber").value.trim();
    if (!name || !college || !aadharNumber) {
      result.textContent = "Please fill all details.";
      return;
    }
    localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify({ name, college, aadharNumber }));
    window.location.href = "./seats.html";
  });
}

if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    try {
      const response = await fetch(`${API_BASE}/bookings/export`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bookings.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    clearToken();
    localStorage.removeItem(PENDING_BOOKING_KEY);
    window.location.href = "./login.html";
  });
}

// Seat selection page logic
const seatGrid = document.getElementById("seat-grid");
const confirmSeatBtn = document.getElementById("confirmSeatBtn");
const seatMessage = document.getElementById("seat-message");
const summary = document.getElementById("booking-summary");
const backBtn = document.getElementById("backBtn");
let selectedSeat = null;

const renderSeats = (bookedSeats) => {
  seatGrid.innerHTML = "";
  for (let i = 1; i <= 100; i += 1) {
    const seat = document.createElement("button");
    seat.type = "button";
    seat.className = "seat";
    seat.textContent = i;
    seat.dataset.seat = String(i);

    if (bookedSeats.includes(i)) {
      seat.classList.add("booked");
      seat.disabled = true;
    } else {
      seat.addEventListener("click", () => {
        const prev = seatGrid.querySelector(".seat.selected");
        if (prev) prev.classList.remove("selected");
        seat.classList.add("selected");
        selectedSeat = i;
        seatMessage.textContent = `Selected seat: ${i}`;
      });
    }

    seatGrid.appendChild(seat);
  }
};

if (seatGrid) {
  if (!getToken()) window.location.href = "./login.html";

  const pendingRaw = localStorage.getItem(PENDING_BOOKING_KEY);
  if (!pendingRaw) {
    window.location.href = "./booking.html";
  } else {
    const pending = JSON.parse(pendingRaw);
    summary.textContent = `Name: ${pending.name} | College: ${pending.college} | Aadhar: ${pending.aadharNumber}`;
  }

  fetch(`${API_BASE}/bookings/seats`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load seats");
      renderSeats(data.bookedSeats || []);
    })
    .catch((err) => {
      seatMessage.textContent = err.message;
      seatMessage.style.color = "#ef4444";
    });
}

if (confirmSeatBtn) {
  confirmSeatBtn.addEventListener("click", async () => {
    seatMessage.style.color = "#111827";
    const pending = localStorage.getItem(PENDING_BOOKING_KEY);
    if (!pending) {
      seatMessage.textContent = "Booking data missing. Go back and fill details again.";
      return;
    }
    if (!selectedSeat) {
      seatMessage.textContent = "Please select one seat.";
      return;
    }

    try {
      const payload = { ...JSON.parse(pending), seatNumber: selectedSeat };
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Booking failed");

      const ticketIdShort = `WEB-${String(data.ticket._id).slice(-8).toUpperCase()}`;
      const ticketPayload = {
        id: data.ticket._id,
        name: payload.name,
        college: payload.college,
        seatNumber: payload.seatNumber,
        ticketId: ticketIdShort,
      };
      localStorage.setItem(LAST_TICKET_KEY, JSON.stringify(ticketPayload));
      localStorage.removeItem(PENDING_BOOKING_KEY);
      seatMessage.style.color = "#16a34a";
      seatMessage.textContent = `Booking confirmed. Redirecting to ticket page... ${data.emailPreview ? `Preview: ${data.emailPreview}` : ""}`;
      setTimeout(() => {
        window.location.href = "./ticket.html";
      }, 900);
    } catch (error) {
      seatMessage.style.color = "#ef4444";
      seatMessage.textContent = error.message;
    }
  });
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "./booking.html";
  });
}

// Ticket page logic
const ticketName = document.getElementById("t-name");
const ticketSeat = document.getElementById("t-seat");
const ticketCollege = document.getElementById("t-college");
const ticketId = document.getElementById("t-id");
const ticketQr = document.getElementById("t-qr");
const printBtn = document.getElementById("printBtn");
const downloadBtn = document.getElementById("downloadBtn");
const logoutLink = document.getElementById("logoutLink");

if (ticketName && ticketSeat && ticketCollege && ticketId && ticketQr) {
  if (!getToken()) window.location.href = "./login.html";
  const raw = localStorage.getItem(LAST_TICKET_KEY);
  if (!raw) {
    window.location.href = "./booking.html";
  } else {
    const t = JSON.parse(raw);
    ticketName.textContent = t.name || "-";
    ticketSeat.textContent = String(t.seatNumber || "-");
    ticketCollege.textContent = t.college || "-";
    ticketId.textContent = `ID: ${t.ticketId || "-"}`;
    ticketQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(t.ticketId || "WEB-TICKET")}`;
  }
}

if (printBtn) {
  printBtn.addEventListener("click", () => window.print());
}

if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    const raw = localStorage.getItem(LAST_TICKET_KEY);
    if (raw) {
      try {
        const t = JSON.parse(raw);
        if (t.id) {
          const response = await fetch(`${API_BASE}/bookings/resend-ticket-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ ticketId: t.id }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Failed to send ticket email");
          alert(`Ticket email sent. ${data.emailPreview ? `Preview: ${data.emailPreview}` : ""}`);
        }
      } catch (error) {
        alert(error.message);
      }
    }

    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ticket.html";
    a.click();
    URL.revokeObjectURL(url);
  });
}

if (logoutLink) {
  logoutLink.addEventListener("click", () => {
    clearToken();
    localStorage.removeItem(PENDING_BOOKING_KEY);
    localStorage.removeItem(LAST_TICKET_KEY);
  });
}
