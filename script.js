const API_BASE = "http://localhost:5000";

function qs(id) {
  return document.getElementById(id);
}

function setMessage(text, type = "ok") {
  const el = qs("message");
  if (!el) return;
  el.hidden = false;
  el.textContent = text;
  el.classList.remove("alert--ok", "alert--err");
  el.classList.add(type === "err" ? "alert--err" : "alert--ok");
}

function clearMessage() {
  const el = qs("message");
  if (!el) return;
  el.hidden = true;
  el.textContent = "";
  el.classList.remove("alert--ok", "alert--err");
}

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "./login.html";
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    const next = encodeURIComponent(window.location.pathname.split("/").pop() + window.location.search);
    window.location.href = `./login.html?next=${next}`;
    return null;
  }
  return token;
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.message ? data.message : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function page() {
  return document.body.dataset.page;
}

async function initLogin() {
  // If already logged in, go to events
  if (getToken()) window.location.href = "./events.html";

  const form = qs("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    try {
      const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
      setToken(data.token);
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next ? `./${next}` : "./events.html";
    } catch (err) {
      setMessage(err.message, "err");
    }
  });
}

async function initRegister() {
  if (getToken()) window.location.href = "./events.html";

  const form = qs("registerForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    try {
      const data = await api("/api/auth/register", { method: "POST", body: { email, password } });
      setToken(data.token);
      window.location.href = "./events.html";
    } catch (err) {
      setMessage(err.message, "err");
    }
  });
}

function bindLogoutIfPresent() {
  const btn = qs("logoutBtn");
  if (btn) btn.addEventListener("click", logout);
}

function renderEventCard(event) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <h2>${event.name}</h2>
    <p class="muted">Date: <strong>${event.date}</strong></p>
    <p class="muted">Seats: <strong>${event.availableSeats}</strong></p>
    <p class="muted">Prices: <strong>${event.priceOptions.map((p) => `₹${p}`).join(", ")}</strong></p>
    <div style="margin-top:12px">
      <a class="btn" href="./booking.html?eventId=${encodeURIComponent(event.id)}">Book</a>
    </div>
  `;
  return div;
}

async function initEvents() {
  const token = requireAuth();
  if (!token) return;
  bindLogoutIfPresent();

  try {
    const data = await api("/api/events");
    const grid = qs("eventsGrid");
    grid.innerHTML = "";
    data.events.forEach((evt) => grid.appendChild(renderEventCard(evt)));
  } catch (err) {
    setMessage(err.message, "err");
  }
}

async function initBooking() {
  const token = requireAuth();
  if (!token) return;
  bindLogoutIfPresent();

  const eventId = new URLSearchParams(window.location.search).get("eventId");
  if (!eventId) {
    setMessage("Missing eventId in URL", "err");
    return;
  }

  let event;
  try {
    const data = await api("/api/events");
    event = data.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");
  } catch (err) {
    setMessage(err.message, "err");
    return;
  }

  qs("eventMeta").textContent = `${event.name} • ${event.date}`;

  const priceSelect = qs("priceSelect");
  priceSelect.innerHTML = "";
  event.priceOptions.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = String(p);
    opt.textContent = `₹${p}`;
    priceSelect.appendChild(opt);
  });

  const seatInput = qs("seatInput");
  seatInput.max = String(event.availableSeats);
  qs("seatHint").textContent = `Choose a seat number between 1 and ${event.availableSeats}.`;

  const form = qs("bookingForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const fd = new FormData(form);
    const seatNumber = Number(fd.get("seatNumber"));
    const price = Number(fd.get("price"));

    try {
      await api("/api/bookings", {
        method: "POST",
        token,
        body: { eventId, seatNumber, price },
      });

      setMessage("Booking successful! Confirmation sent (email or SMS simulation).", "ok");

      // Small UX: disable form after success
      form.querySelectorAll("input, select, button").forEach((el) => (el.disabled = true));
      setTimeout(() => {
        window.location.href = "./events.html";
      }, 1300);
    } catch (err) {
      setMessage(err.message, "err");
    }
  });
}

// Router-like init
(() => {
  const p = page();
  if (p === "login") initLogin();
  if (p === "register") initRegister();
  if (p === "events") initEvents();
  if (p === "booking") initBooking();
})();

