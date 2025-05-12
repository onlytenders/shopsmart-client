import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!email || !password) {
      setError("Email и пароль обязательны");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/users/register`, { email, password });
      localStorage.setItem("token", res.data.token);
      setError("");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка регистрации");
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <div className="register-logo">
          <i className="fas fa-shopping-cart"></i> ShopSmart
        </div>
        <h1>Регистрация</h1>
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
        <div className="input-group">
          <i className="fas fa-lock"></i>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Подтвердите пароль"
          />
        </div>
        <button className="button-primary" onClick={handleRegister}>
          <i className="fas fa-user-plus"></i> Зарегистрироваться
        </button>
        <p>
          Уже есть аккаунт?{" "}
          <span className="link" onClick={() => navigate("/login")}>
            Войти
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;