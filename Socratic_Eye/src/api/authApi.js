import axios from "axios";

const API = "http://localhost:5000";

export const loginUser = (data) =>
  axios.post(`${API}/auth/login`, data);

export const signupUser = (data) =>
  axios.post(`${API}/auth/signup`, data);
