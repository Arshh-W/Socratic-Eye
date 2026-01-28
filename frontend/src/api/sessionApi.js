import axios from 'axios';

const API_BASE = ""; // backend URL

export const startSession = async (preferences) => {
    const response = await axios.post(`${API_BASE}/auth/session`, preferences);
    return response.data; // { sessionId: string }
};