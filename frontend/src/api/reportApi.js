import axios from "axios";

const API = "";

export const getReport = async (sessionId) => {
  const res = await axios.get(`${API}/report`, {
    params: { session_id: sessionId }
  });
  return res.data;
};
