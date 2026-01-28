import axios from "axios";

const API = "http://localhost:5000";

export const getReport = (sessionId) =>
  axios.get(`${API}/report`, {
    params: { session_id: sessionId }
  });
