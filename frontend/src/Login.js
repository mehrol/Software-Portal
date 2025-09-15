import React, { useState } from "react";
import axios from "axios";
import "./styles/login.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://192.168.1.18:8082/api/login", {
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
      <h2 className="login-title">Wittybrains Portal - Login</h2>
      <form className="login-form" onSubmit={submit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-login">
          Login
        </button>
        {err && <div className="error-message">{err}</div>}
      </form>
    </div>
  );
}