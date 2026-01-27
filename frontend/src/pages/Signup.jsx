import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../api/authApi";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await signupUser({ username, password });
      alert("Account created! Please login.");
      navigate("/login");
    } catch (err) {
      alert("Username already exists");
    }
  };

  return (
    <div className="auth-container">
      {/* Adding the card wrapper here ensures it centers properly */}
      <div className="auth-card glass fade-in">
        <h1>Create Account</h1>
        <p className="subtitle">Join the Socratic Eye network</p>

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

        <button onClick={handleSignup}>Sign Up</button>

        <p className="footer-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;