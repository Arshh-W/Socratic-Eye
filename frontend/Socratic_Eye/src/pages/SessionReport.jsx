import { useEffect, useState } from "react";
import { useSession } from "../context/SessionContext";
import { getReport } from "../api/reportApi";

const SessionReport = () => {
  const { sessionId } = useSession();
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await getReport(sessionId);
        setReport(res.report);
      } catch (err) {
        setReport("Failed to load session report.");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) fetchReport();
  }, [sessionId]);

  if (loading) {
    return <div style={{ padding: 40 }}>Generating your report...</div>;
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h1>Session Report</h1>

      <p style={{ marginTop: "20px", whiteSpace: "pre-line" }}>
        {report}
      </p>

      <button
        onClick={() => (window.location.href = "/login")}
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
