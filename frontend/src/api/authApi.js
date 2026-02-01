import axios from "axios";

const api = axios.create({
  baseURL: "", 
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = (data) => api.post("/auth/login", data);

// 🔹 Add the signup function here
export const signupUser = (data) => api.post("/auth/signup", data);