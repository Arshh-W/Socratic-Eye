// frontend/src/pages/SessionReport.jsx - Render markdown properly

import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown'; 
const SessionReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report || "No report data found.";
  const message = location.state?.message || "Session Summary";

  return (
    <div style={{ 
      padding: "40px", 
      maxWidth: "1000px",  
      margin: "auto", 
      color: "white", 
      background: "#000", 
      minHeight: "100vh" 
    }}>
      <h1 style={{ color: "#4fd1c5", marginBottom: "20px" }}>{message}</h1>

      {/*Used ReactMarkdown for proper rendering */}
      <div style={{ 
        marginTop: "30px", 
        lineHeight: "1.8", 
        fontSize: "1.1rem", 
        background: "#111", 
        padding: "30px", 
        borderRadius: "12px",
        border: "1px solid #333",
        overflow: "auto", 
        maxHeight: "70vh"
      }}>
        <ReactMarkdown
          components={{
            h3: ({node, ...props}) => <h3 style={{color: "#4fd1c5", marginTop: "20px", marginBottom: "10px"}} {...props} />,
            h2: ({node, ...props}) => <h2 style={{color: "#4fd1c5", marginTop: "25px", marginBottom: "15px"}} {...props} />,
            ul: ({node, ...props}) => <ul style={{paddingLeft: "20px", marginTop: "10px"}} {...props} />,
            li: ({node, ...props}) => <li style={{marginBottom: "8px"}} {...props} />,
            p: ({node, ...props}) => <p style={{marginBottom: "15px"}} {...props} />,
          }}
        >
          {report}
        </ReactMarkdown>
      </div>

      <button
        onClick={() => navigate("/login")}
        style={{
          marginTop: "40px",
          padding: "12px 24px",
          background: "#4fd1c5",
          color: "#000",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "1rem"
        }}
      >
        Back to Login
      </button>
    </div>
  );
};

export default SessionReport;