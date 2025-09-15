import React, { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import axios from "axios";
import "./styles/app.css";
import { ChevronRight } from "lucide-react";
import folderIcon from "./assets/icons/folder.png"; // your folder image
import fileIcons from "./utils/fileIcons";   // extension -> icon mapping

// Setting up Axios interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("authToken") || null);
  const [role, setRole] = useState(localStorage.getItem("userRole") || null);

  const handleLogin = (newToken, newRole) => {
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("userRole", newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setToken(null);
    setRole(null);
  };

  return (
    <div className="app-container">
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} role={role} />
      )}
    </div>
  );
}