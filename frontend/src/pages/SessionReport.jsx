import { useEffect, useState } from "react";
import { useSession } from "../context/SessionContext";
import { getReport } from "../api/reportApi";
import { useNavigate } from "react-router-dom";

const SessionReport = () => {
  const { sessionId } = useSession();
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await getReport(sessionId);
        setReport(res.data.report); 
      } catch (err) {
        setReport("Failed to load session report.");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchReport();
    } else {
      navigate("/login"); 
    }
  }, [sessionId, navigate]);

  if (loading) {
    return <div style={{ padding: 40 }}>Generating your report...</div>;
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h1>📊 Session Report</h1>

      <pre style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>
        {report}
      </pre>

      <button
        onClick={() => navigate("/login")}
        style={{
          marginTop: "40px",
          padding: "10px 16px",
          background: "#4fd1c5",
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
