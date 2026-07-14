 import React, { useState } from "react";
import { Phone, Lock, Loader2, Droplet } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./shared/firebaseConfig";
import { telefonoAEmail } from "./shared/firestoreHelpers";

const COLORS = {
  clay: "#B5622A",
  clayDark: "#8C4A1F",
  cobalt: "#1B4B6B",
  ink: "#1A1613",
  paper: "#F6F1E9",
  line: "#E3D9C8",
};

export default function LoginMotorista() {
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (telefono.replace(/\D/g, "").length < 9) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }
    if (contrasena.length < 6) {
      setError("Ingresa tu contraseña.");
      return;
    }
    setCargando(true);
    try {
      const email = telefonoAEmail(telefono);
      await signInWithEmailAndPassword(auth, email, contrasena);
      // onAuthStateChanged en App.jsx reacciona solo al login exitoso
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Número o contraseña incorrectos.");
      } else {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ background: COLORS.paper, fontFamily: "'DM Sans', system-ui, sans-serif" }} className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: COLORS.cobalt }}>
            <Droplet size={16} color="#fff" strokeWidth={2} />
          </div>
          <span className="text-xs tracking-widest uppercase" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>
            AquaFleet · Motorista
          </span>
        </div>

        <form onSubmit={handleLogin}>
          <h1 className="text-2xl font-semibold mb-1 text-center" style={{ color: COLORS.ink }}>Iniciar sesión</h1>
          <p className="text-sm mb-6 text-center" style={{ color: COLORS.clayDark }}>
            Ingresa el número y la contraseña que te dio el administrador
          </p>
          <div className="flex items-center rounded-xl px-4 mb-3" style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}>
            <span className="text-sm mr-1" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>+244</span>
            <Phone size={16} color={COLORS.clayDark} className="ml-2" />
            <input
              type="tel"
              placeholder="9XX XXX XXX"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full bg-transparent py-3 px-3 outline-none text-sm"
              style={{ color: COLORS.ink }}
            />
          </div>
          <div className="flex items-center rounded-xl px-4 mb-4" style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}>
            <Lock size={16} color={COLORS.clayDark} />
            <input
              type="password"
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full bg-transparent py-3 px-3 outline-none text-sm"
              style={{ color: COLORS.ink }}
            />
          </div>
          {error && <p className="text-sm mb-4" style={{ color: COLORS.clay }}>{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl py-4 text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: cargando ? COLORS.clayDark : COLORS.clay }}
          >
            {cargando ? <Loader2 size={16} className="animate-spin" /> : null}
            {cargando ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
  }
