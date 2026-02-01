import axios from "axios";
const API = import.meta.env.VITE_API_URL || "https://socratic-eye-app.azurewebsites.net";

export const getReport = async (sessionId) => {
  try {
    const res = await axios.get(`${API}/report`, {
      params: { session_id: sessionId },
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.data || !res.data.report) {
      throw new Error("Report data missing from response");
    }
    
    return res.data;
  } catch (error) {
    console.error("Report API Error:", error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error("Request timed out - report generation took too long");
    } else if (error.response) {
    //server error
      throw new Error(error.response.data?.error || "Server error generating report");
    } else if (error.request) {
  //No response
      throw new Error("No response from server - check your connection");
    } else {
      throw error;
    }
  }
};