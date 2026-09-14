import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        Pulse
      </Link>
      <nav className="navbar-actions">
        {user ? (
          <>
            <span className="navbar-user">@{user.username}</span>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-ghost" to="/login">
              Log in
            </Link>
            <Link className="btn btn-primary" to="/register">
              Join Pulse
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
