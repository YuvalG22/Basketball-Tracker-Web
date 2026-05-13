import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://basketball-tracker-api.onrender.com",
});