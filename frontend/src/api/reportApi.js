import axios from "axios";

const API =import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getReport = async (sessionId) => {
  const res = await axios.get(`${API}/report`, {
    params: { session_id: sessionId }
  });
  return res.data;
};
