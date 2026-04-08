const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  register: (email, password) => request("/api/auth/register", { method: "POST", body: { email, password } }),
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),

  me: (token) => request("/api/users/me", { token }),
  updateProfile: (token, profile) => request("/api/users/profile", { method: "PUT", token, body: profile }),

  availability: (token) => request("/api/bookings/availability", { token }),
  myBooking: (token) => request("/api/bookings/me", { token }),
  createBooking: (token, seatNumber) => request("/api/bookings", { method: "POST", token, body: { seatNumber } }),

  adminBookings: (token) => request("/api/admin/bookings", { token }),
};

