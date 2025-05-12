import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";
import "../styles/Dashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const socket = io(API_URL, { autoConnect: false });

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [lists, setLists] = useState([]);
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Проверяем, есть ли уведомление в state после редиректа
    if (location.state?.notification) {
      setNotification(location.state.notification);
      // Очищаем уведомление через 3 секунды
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      navigate("/login");
      return;
    }

    socket.connect();
    console.log("Socket connecting for user:", userId);
    socket.emit("joinUser", userId);

    axios
      .get(`${API_URL}/users/email/me`, getAuthHeaders())
      .then((res) => setUserEmail(res.data.email))
      .catch((err) => {
        console.error("Error fetching user:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
      });

    axios
      .get(`${API_URL}/lists`, getAuthHeaders())
      .then((res) => {
        console.log("Fetched lists:", res.data);
        setLists(res.data);
      })
      .catch((err) => console.error("Error fetching lists:", err));

    socket.on("kickedFromList", ({ listId: kickedListId, name }) => {
      console.log("Received kickedFromList on Dashboard:", { kickedListId, name });
      setLists((prevLists) => prevLists.filter((list) => list._id !== kickedListId));
      setNotification(`Вы были удалены из списка "${name}"`);
      setTimeout(() => setNotification(""), 3000);
    });

    return () => {
      console.log("Cleaning up socket listeners for user:", userId);
      socket.off("kickedFromList");
      socket.disconnect();
    };
  }, [navigate, location.state]);

  const createList = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Creating list with token:", token); // Лог для отладки
      if (!token) {
        setNotification("Токен отсутствует. Пожалуйста, войдите снова.");
        setTimeout(() => setNotification(""), 3000);
        navigate("/login");
        return;
      }
      const res = await axios.post(
        `${API_URL}/lists`,
        { name: "Новый список" },
        getAuthHeaders()
      );
      console.log("Create list response:", res.data);
      navigate(`/list/${res.data.listId}`);
    } catch (err) {
      console.error("Error creating list:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.error || "Ошибка при создании списка";
      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const deleteList = async (listId) => {
    try {
      await axios.delete(`${API_URL}/lists/${listId}`, getAuthHeaders());
      setLists(lists.filter((list) => list._id !== listId));
      navigate("/dashboard", { state: { notification: "Список удалён" } });
    } catch (err) {
      console.error("Error deleting list:", err);
      setNotification(err.response?.data?.error || "Ошибка при удалении списка");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const leaveList = async (listId, listName, isOwner) => {
    if (isOwner) {
      setNotification("Владелец не может покинуть свой список. Удалите список, если хотите выйти.");
      setTimeout(() => setNotification(""), 3000);
      return;
    }
    try {
      await axios.post(`${API_URL}/lists/${listId}/leave`, {}, getAuthHeaders());
      setLists(lists.filter((list) => list._id !== listId));
      navigate("/dashboard", { state: { notification: `Вы покинули список "${listName}"` } });
    } catch (err) {
      console.error("Error leaving list:", err.response?.data || err);
      setNotification(err.response?.data?.error || "Ошибка при выходе из списка");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    socket.disconnect();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Добро пожаловать, {userEmail}</h1>
        <button className="button-danger" onClick={logout}>
          <i className="fas fa-sign-out-alt"></i> Выйти
        </button>
      </div>
      {notification && <div className="notification">{notification}</div>}
      <div className="dashboard-actions">
        <button className="button-primary" onClick={createList}>
          <i className="fas fa-plus"></i> Создать список
        </button>
        <button className="button-primary" onClick={() => navigate("/join")}>
          <i className="fas fa-user-plus"></i> Присоединиться
        </button>
      </div>
      <h2>Ваши списки</h2>
      {lists.length === 0 ? (
        <div className="no-lists">
          <i className="fas fa-list-alt no-lists-icon"></i>
          <p>У вас пока нет списков. Создайте новый или присоединитесь к существующему!</p>
        </div>
      ) : (
        <ul className="list-grid">
          {lists.map((list) => (
            <li key={list._id} className="list-card">
              <a href={`/list/${list._id}`} className="list-name">
                {list.name}
              </a>
              <span className="list-info">{list.items?.length || 0} элементов</span>
              <div className="list-actions">
                {list.owner === localStorage.getItem("userId") ? (
                  <button
                    className="button-danger"
                    onClick={() => deleteList(list._id)}
                  >
                    <i className="fas fa-trash"></i> Удалить
                  </button>
                ) : (
                  <button
                    className="button-danger"
                    onClick={() => leaveList(list._id, list.name, false)}
                  >
                    <i className="fas fa-sign-out-alt"></i> Выйти
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;