import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export function Layout() {
  const { isAuthed, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="appShell">
      <header className="topbar">
        <Link className="brand" to="/">
          Library Seat Booking
        </Link>
        <nav className="nav">
          {isAuthed ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              {isAdmin && <NavLink to="/admin">Admin</NavLink>}
              <button
                className="linkButton"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="container">
        {isAuthed && (
          <div className="subtle">
            Signed in as <b>{user?.email}</b>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

