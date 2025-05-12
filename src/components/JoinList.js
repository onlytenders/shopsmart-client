import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Join.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function JoinList() {
  const [listId, setListId] = useState("");
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const idFromUrl = searchParams.get("listId");
    if (idFromUrl) {
      console.log("List ID from URL:", idFromUrl);
      setListId(idFromUrl);
    }
  }, [searchParams]);

  const joinList = async () => {
    if (!listId) {
      setNotification("Введите код списка");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/lists/join/${listId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      navigate(`/list/${listId}`, { state: { notification: "Вы присоединились к списку!" } });
    } catch (err) {
      console.error("Error joining list:", err.response?.data || err);
      const errorMessage = err.response?.data?.error || "Ошибка при вступлении в список";
      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  return (
    <div className="join-container">
      <div className="join-form">
        <div className="join-logo">
          <i className="fas fa-shopping-cart"></i> ShopSmart
        </div>
        <h1>Присоединиться к списку</h1>
        {notification && <div className="error">{notification}</div>}
        <div className="input-group">
          <i className="fas fa-list"></i>
          <input
            type="text"
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            placeholder="ID списка"
          />
        </div>
        <button className="button-primary" onClick={joinList}>
          <i className="fas fa-user-plus"></i> Присоединиться
        </button>
      </div>
    </div>
  );
}

export default JoinList;