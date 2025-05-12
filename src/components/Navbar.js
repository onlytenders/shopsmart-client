import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <i className="fas fa-shopping-cart"></i> ShopSmart
        </Link>
        <button className="navbar-toggle" onClick={toggleMenu}>
          <i className={isOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </button>
        <ul className={`navbar-menu ${isOpen ? "active" : ""}`}>
          <li className="navbar-item">
            <Link to="/dashboard" className="navbar-link">
              <i className="fas fa-tachometer-alt"></i> Dashboard
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/join" className="navbar-link">
              <i className="fas fa-user-plus"></i> Join List
            </Link>
          </li>
          <li className="navbar-item">
            <button className="navbar-button button-danger" onClick={logout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;