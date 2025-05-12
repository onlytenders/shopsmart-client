import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ShoppingList from "./components/ShoppingList";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import JoinList from "./components/JoinList";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/join" element={<JoinList />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/list/:listId" element={<ShoppingList />} />
      </Routes>
    </Router>
  );
}

export default App;