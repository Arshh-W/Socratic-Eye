import { useLocation, useNavigate } from "react-router-dom";

const SessionReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔹 Get the data passed from MentorIDE.jsx
  const report = location.state?.report || "No report data found.";
  const message = location.state?.message || "Session Summary";

  return (
    <div style={{ padding: "40px", maxWidth: "auto", margin: "auto", color: "white", background: "#000", minHeight: "100vh" }}>
      <h1 style={{ color: "#4fd1c5" }}>{message}</h1>

      <div style={{ 
        marginTop: "30px", 
        lineHeight: "1.6", 
        fontSize: "1.1rem", 
        background: "#111", 
        padding: "20px", 
        borderRadius: "12px",
        border: "1px solid #333",
        whiteSpace: "pre-line" 
      }}>
        {report}
      </div>

      <button
        onClick={() => navigate("/login")} // 🔹 Use navigate instead of window.location
        style={{
          marginTop: "40px",
          padding: "12px 24px",
          background: "#4fd1c5",
          color: "#000",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Back to Login
      </button>
    </div>
  );
};

export default SessionReport;