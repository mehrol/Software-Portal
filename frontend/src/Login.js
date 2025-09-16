import React, { useState } from "react";
import axios from "axios";
import "./styles/login.css";

// Wittybrains logo URL from your previous request
const WITTYBRAINS_LOGO = "https://wittybrains.com/assets/img/logo.png";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      // Note: Use your correct backend URL here
      const res = await axios.post("http://192.168.1.91:8082/api/login", {
        username,
        password,
      });
      onLogin(res.data.token, res.data.role);
    } catch (e) {
      setErr(e.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login-container">
      {/* Wrapper: Two columns card */}
      <div className="login-card-two-column">

        {/* Left side: Branding and logo */}
        <div className="login-brand-section">
          <img
            src={WITTYBRAINS_LOGO}
            alt="Wittybrains Logo"
            className="wittybrains-logo-login"
          />
          <h1 className="portal-title-login">
            Document Management<br></br>&<br></br>Software Portal
          </h1>
        </div>

        {/* Right side: Login form */}
        <div className="login-form-section">
          <div className="login-form-wrapper">
            <h2 className="login-form-title">Sign in to your account</h2>
            <form className="login-form" onSubmit={submit}>
              <div className="input-group">
                <label htmlFor="username" className="input-label">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="password" className="input-label">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-login-two-column">
                Login
              </button>
              {err && <div className="error-message">{err}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}