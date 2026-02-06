import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../api/authApi";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const handleSignup = async () => {
  try {
    const res = await signupUser({ username, password });
    alert(res.data.msg || "Account created! Please login.");
    navigate("/login");
  } catch (err) {
    console.error("Signup Error:", err.response?.data || err.message);
    alert(err.response?.data?.msg || "Signup failed");
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