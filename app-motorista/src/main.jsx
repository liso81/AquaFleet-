 import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "../App.jsx";
import AdminGate from "../AdminGate.jsx";

const esAdmin = window.location.pathname.startsWith("/admin");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {esAdmin ? <AdminGate /> : <App />}
  </React.StrictMode>
);
