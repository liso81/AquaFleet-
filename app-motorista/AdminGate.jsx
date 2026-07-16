import React, { useState, useEffect } from "react";
import { Lock, Loader2 } from "lucide-react";
import AdminMotoristas from "./AdminMotoristas";

const COLORS = {
  clay: "#B5622A",
  clayDark: "#8C4A1F",
  cobalt: "#1B4B6B",
  ink: "#1A1613",
  paper: "#F6F1E9",
  line: "#E3D9C8",
};

const CLAVE_ADMIN = import.meta.env.VITE_ADMIN_PASSWORD;

export default function AdminGate() {
  const [autorizado, setAutorizado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("admin_ok") === "1") {
      setAutorizado(true);
    }
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (clave === CLAVE_ADMIN) {
      sessionStorage.setItem("admin_ok", "1");
      setAutorizado(true);
    } else {
      setError("Senha incorreta.");
    }
  }

  if (autorizado) {
    return <AdminMotoristas />;
  }

  return (
    <div
      style={{ background: COLORS.paper, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <form onSubmit={handleSubmit} className="max-w-sm w-full">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Lock size={20} color={COLORS.cobalt} />
          <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
            Acesso administrativo
          </span>
        </div>
        <div
          className="flex items-center rounded-xl px-4 mb-4"
          style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
        >
          <input
            type="password"
            placeholder="Senha de admin"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="w-full bg-transparent py-3 px-3 outline-none text-sm"
            style={{ color: COLORS.ink }}
          />
        </div>
        {error && (
          <p className="text-sm mb-4" style={{ color: COLORS.clay }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-xl py-4 text-sm font-semibold text-white"
          style={{ background: COLORS.clay }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
    }
