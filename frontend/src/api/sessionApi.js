import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"; // backend URL

export const startSession = async (preferences) => {
    const response = await axios.post(`${API_BASE}/auth/session`, preferences);
    return response.data; // { sessionId: string }
};