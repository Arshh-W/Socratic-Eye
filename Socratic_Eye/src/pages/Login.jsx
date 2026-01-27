import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { useSession } from "../context/SessionContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useSession();

  const handleLogin = async () => {
    try {
      const res = await loginUser({ username, password });
      setUser({
        id: res.data.user_Id,
        username: res.data.username
      });
      navigate("/mentor");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
      <div className="auth-container">
        {/* We wrap everything in a card/box so it's not loose */}
        <div className="auth-card glass fade-in"> 
          <h1>Socratic Eye</h1>
          <p className="subtitle">Identify your thought signature</p>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login</button>

          <p className="footer-text">
            New here? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
    );
  };

export default Login;
