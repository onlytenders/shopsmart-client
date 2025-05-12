import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import "../styles/ShoppingList.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const socket = io(API_URL, { autoConnect: false });

const ShoppingList = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [members, setMembers] = useState([]);
  const [owner, setOwner] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [listName, setListName] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [notification, setNotification] = useState("");
  const isMounted = useRef(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("No userId in localStorage");
      navigate("/login");
      return;
    }

    socket.connect();
    socket.emit("joinList", listId);
    socket.emit("joinUser", userId);

    axios
      .get(`${API_URL}/lists/${listId}`, getAuthHeaders())
      .then((res) => {
        console.log("List data:", res.data);
        setItems(res.data.items || []);
        setMembers(res.data.members.sort((a, b) => a.joinedAt - b.joinedAt));
        setOwner(res.data.owner);
        setOwnerEmail(res.data.ownerEmail || "Неизвестно");
        setListName(res.data.name);
        setCurrentUserId(res.data.currentUserId);
      })
      .catch((err) => {
        console.error("Error fetching list:", err.response?.data || err);
        if (err.response?.status === 404) {
          setNotification("Список не найден или вы были удалены");
          setTimeout(() => navigate("/dashboard"), 3000);
        } else if (err.response?.status === 403) {
          setNotification("Вы не участник этого списка");
          setTimeout(() => navigate("/dashboard"), 3000);
        } else {
          navigate("/dashboard");
        }
      });

    socket.on("listUpdated", ({ items, members, name }) => {
      console.log("Received listUpdated:", { items, members, name });
      if (items) setItems(items || []);
      if (members) setMembers(members ? members.sort((a, b) => a.joinedAt - b.joinedAt) : []);
      if (name) setListName(name);
    });

    socket.on("kickedFromList", ({ listId: kickedListId, name }) => {
      console.log("Received kickedFromList:", { kickedListId, name }, "Current listId:", listId);
      if (kickedListId === listId) {
        console.log("Setting notification: Владелец списка удалил вас");
        setNotification(`Владелец списка удалил вас из "${name}"`);
        setTimeout(() => {
          console.log("Navigating to /dashboard");
          navigate("/dashboard");
        }, 3000);
      }
    });

    return () => {
      socket.off("listUpdated");
      socket.off("kickedFromList");
      socket.disconnect();
    };
  }, [listId]);

  const addItem = async () => {
    if (!newItem) return;
    try {
      const res = await axios.post(
        `${API_URL}/items/${listId}`,
        { name: newItem },
        getAuthHeaders()
      );
      setItems(res.data.items);
      //socket.emit("updateList", { listId, items: res.data.items });
      setNewItem("");
    } catch (err) {
      console.error("Error adding item:", err.response?.data || err);
    }
  };

  const toggleItemCompletion = async (itemId, completed) => {
    try {
      console.log("Sending toggle item:", itemId, "to completed:", completed);
      const res = await axios.put(
        `${API_URL}/lists/items/${itemId}/complete`,
        { completed },
        getAuthHeaders()
      );
      console.log("Toggle item response:", res.data);
      setItems(res.data.items);
      socket.emit("updateList", { listId, items: res.data.items });
    } catch (err) {
      console.error("Error toggling item:", err.response?.data || err);
      const errorMessage =
        err.response?.status === 404
          ? "Элемент или список не найден"
          : err.response?.data?.error || "Ошибка при обновлении статуса товара";
      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const deleteCompletedItems = async () => {
    try {
      console.log("Sending delete completed items for list:", listId);
      const res = await axios.delete(
        `${API_URL}/lists/${listId}/items/completed`,
        { headers: getAuthHeaders().headers }
      );
      console.log("Delete completed items response:", res.data);
      setItems(res.data.items);
      socket.emit("updateList", { listId, items: res.data.items });
    } catch (err) {
      console.error("Error deleting completed items:", err.response?.data || err);
      const errorMessage =
        err.response?.status === 404
          ? "Список не найден"
          : err.response?.data?.error || "Ошибка при удалении отмеченных товаров";
      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const shareList = () => {
    const shareLink = `${window.location.origin}/join?listId=${listId}`;
    navigator.clipboard.writeText(shareLink);
    setNotification("Ссылка скопирована!");
    setTimeout(() => setNotification(""), 3000);
  };

  const leaveList = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/lists/${listId}/leave`,
        {},
        getAuthHeaders()
      );
      setNotification(res.data.message);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Ошибка при выходе из списка";
      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const removeMember = async (userId) => {
    try {
      const res = await axios.delete(
        `${API_URL}/lists/${listId}/members/${userId}`,
        getAuthHeaders()
      );
      setNotification(res.data.message);
      setTimeout(() => setNotification(""), 3000);
      setMembers(members.filter((m) => m.userId !== userId));
      socket.emit("updateList", { listId, members: members.filter((m) => m.userId !== userId) });
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Ошибка при удалении участника";
      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const updateListName = async () => {
    try {
      console.log("Sending update list name to:", listName, "for list:", listId);
      const res = await axios.put(
        `${API_URL}/lists/${listId}`,
        { name: listName },
        getAuthHeaders()
      );
      console.log("Update list name response:", res.data);
      setNotification(res.data.message);
      setTimeout(() => setNotification(""), 3000);
      socket.emit("updateList", { listId, name: listName });
    } catch (err) {
      console.error("Error updating list name:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.error || "Ошибка при обновлении названия списка";
      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  return (
    <div className="shopping-list">
      <h2>
        {currentUserId === owner ? (
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onBlur={updateListName}
            className="list-name-input"
          />
        ) : (
          listName
        )}
      </h2>
      {notification && <div className="notification">{notification}</div>}

      <div className="input-group">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Добавить товар..."
        />
        <button onClick={addItem}>Добавить</button>
      </div>

      <ul className="item-list">
        {items.map((item) => (
          <li
            key={item._id}
            className={item.completed ? "completed" : ""}
            style={{
              textDecoration: item.completed ? "line-through" : "none",
              color: item.completed ? "#A0AEC0" : "#2D3748",
            }}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItemCompletion(item._id, !item.completed)}
            />
            {item.name}
          </li>
        ))}
      </ul>

      <button
        className="delete-completed"
        onClick={deleteCompletedItems}
        disabled={!items.some((item) => item.completed)}
      >
        Удалить отмеченные
      </button>

      <h3>Участники</h3>
      <ul className="member-list">
        {members.map((member) => (
          <li key={member.userId}>
            {member.email}
            {owner === currentUserId && member.userId !== owner && (
              <button
                className="button-danger"
                onClick={() => removeMember(member.userId)}
              >
                Удалить
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="action-buttons">
        <button onClick={shareList}>Поделиться</button>
        <button onClick={leaveList}>Покинуть список</button>
        <button onClick={() => navigate("/dashboard")}>Вернуться в Dashboard</button>
      </div>

      <p>Владелец: {ownerEmail}</p>
    </div>
  );
};

export default ShoppingList;