import axios from "axios";

const client = axios.create({
  baseURL: "http://192.168.1.18:8082/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;