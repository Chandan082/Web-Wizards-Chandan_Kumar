import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.register(email, password);
      setAuth({ token: data.token, user: data.user });
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Create account</h2>
      <p className="muted">Register with email and password.</p>

      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password (min 6 chars)
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
        </label>

        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>

      <div className="footerNote">
        Already have an account? <Link to="/login">Login</Link>.
      </div>
    </div>
  );
}

