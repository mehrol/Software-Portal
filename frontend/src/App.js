import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import "./styles/app.css";


export default function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  const handleLogin = (token, role) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userRole", role);
    setToken(token);
    setRole(role);
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