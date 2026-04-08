import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export function DashboardPage() {
  const { token, user } = useAuth();

  const [availability, setAvailability] = useState(null);
  const [myBooking, setMyBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const profileComplete = Boolean(user?.fullName && user?.collegeHostel && user?.roomNumber);

  const seats = availability?.seats || [];
  const full = availability?.full;

  const seatsByNumber = useMemo(() => {
    const m = new Map();
    seats.forEach((s) => m.set(s.seatNumber, s));
    return m;
  }, [seats]);

  async function refresh() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const [a, b] = await Promise.all([api.availability(token), api.myBooking(token)]);
      setAvailability(a);
      setMyBooking(b.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bookSeat(seatNumber) {
    setError("");
    setMessage("");
    setActionLoading(true);
    try {
      const res = await api.createBooking(token, seatNumber);
      setMyBooking(res.booking);
      setMessage(`Booked Seat ${res.booking.seatNumber} successfully.`);
      await refresh();
    } catch (err) {
      setError(err.message);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  }

  if (!profileComplete) {
    return (
      <div className="card">
        <h2>Complete your profile</h2>
        <p className="muted">Before booking, add your name/college/room details.</p>
        <Link className="primaryButtonLike" to="/profile">
          Go to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Seat Booking</h2>
        <p className="muted">
          First-come, first-served. Total seats: <b>100</b>
        </p>

        {loading ? (
          <div className="muted">Loading availability...</div>
        ) : (
          <>
            <div className="stats">
              <div>
                <div className="statLabel">Booked</div>
                <div className="statValue">{availability?.bookedCount ?? "-"}</div>
              </div>
              <div>
                <div className="statLabel">Status</div>
                <div className="statValue">{full ? "Full" : "Open"}</div>
              </div>
              <div>
                <div className="statLabel">Your seat</div>
                <div className="statValue">{myBooking ? `Seat ${myBooking.seatNumber}` : "—"}</div>
              </div>
            </div>

            {error && <div className="error">{error}</div>}
            {message && <div className="success">{message}</div>}

            {myBooking ? (
              <div className="notice">
                You already booked <b>Seat {myBooking.seatNumber}</b>.
              </div>
            ) : full ? (
              <div className="notice">Library is full. Booking is disabled.</div>
            ) : (
              <div className="muted">Select an available seat below.</div>
            )}

            <div className={`seatGrid ${myBooking || full ? "disabled" : ""}`}>
              {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => {
                const s = seatsByNumber.get(n);
                const available = s?.available ?? true;
                const disabled = actionLoading || !available || Boolean(myBooking) || Boolean(full);
                return (
                  <button
                    key={n}
                    className={`seat ${available ? "available" : "booked"}`}
                    disabled={disabled}
                    onClick={() => bookSeat(n)}
                    title={available ? `Book seat ${n}` : `Seat ${n} is booked`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

