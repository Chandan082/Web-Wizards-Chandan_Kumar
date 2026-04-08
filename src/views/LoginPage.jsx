import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export function LoginPage() {
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
      const data = await api.login(email, password);
      setAuth({ token: data.token, user: data.user });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>
      <p className="muted">Use your email and password to sign in.</p>

      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <div className="footerNote">
        No account? <Link to="/register">Create one</Link>.
      </div>
    </div>
  );
}

