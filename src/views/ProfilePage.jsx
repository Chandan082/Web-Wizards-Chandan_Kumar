import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../state/AuthContext.jsx";

const SUGGESTED_COLLEGES = ["Hostel A", "Hostel B", "Hostel C", "College Main", "Other"];

export function ProfilePage() {
  const { token, user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [collegeHostel, setCollegeHostel] = useState(user?.collegeHostel || "");
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setFullName(user?.fullName || "");
    setCollegeHostel(user?.collegeHostel || "");
    setRoomNumber(user?.roomNumber || "");
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await api.updateProfile(token, { fullName, collegeHostel, roomNumber });
      updateUser(data.user);
      setSuccess("Profile updated.");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Profile</h2>
      <p className="muted">Fill this once so your booking includes correct details.</p>

      <form className="form" onSubmit={onSubmit}>
        <label>
          Full Name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>

        <label>
          College/Hostel
          <input
            list="collegeHostelList"
            value={collegeHostel}
            onChange={(e) => setCollegeHostel(e.target.value)}
            placeholder="Start typing..."
            required
          />
          <datalist id="collegeHostelList">
            {SUGGESTED_COLLEGES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label>
          Room Number
          <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required />
        </label>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <button className="primary" disabled={loading}>
          {loading ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}

