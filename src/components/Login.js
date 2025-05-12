import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/users/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId); // Сохраняем userId
      setError("");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка входа");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Вход</h1>
        {error && <div className="error">{error}</div>}
        <div className="input-group">
          <i className="fas fa-envelope"></i>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </div>
        <div className="input-group">
          <i className="fas fa-lock"></i>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
          />
        </div>
        <button className="button-primary" onClick={handleLogin}>
          <i className="fas fa-sign-in-alt"></i> Войти
        </button>
        <p>
          Нет аккаунта?{" "}
          <span className="link" onClick={() => navigate("/register")}>
            Зарегистрироваться
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;