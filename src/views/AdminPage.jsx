import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export function AdminPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      try {
        const data = await api.adminBookings(token);
        setBookings(data.bookings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="card">
      <h2>Admin Panel</h2>
      <p className="muted">Shows the first 100 bookings (first-come, first-served).</p>

      {loading ? (
        <div className="muted">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>College/Hostel</th>
                <th>Room</th>
                <th>Seat</th>
                <th>Booked At</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={b._id || idx}>
                  <td>{idx + 1}</td>
                  <td>{b.fullName}</td>
                  <td>{b.email}</td>
                  <td>{b.collegeHostel}</td>
                  <td>{b.roomNumber}</td>
                  <td>
                    <b>{b.seatNumber}</b>
                  </td>
                  <td>{b.bookedAt ? new Date(b.bookedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {!bookings.length && (
                <tr>
                  <td colSpan={7} className="muted">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

