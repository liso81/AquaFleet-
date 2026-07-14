import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Loader2, Droplet, LogOut } from "lucide-react";
import { auth } from "./shared/firebaseConfig";
import { obtenerPerfil } from "./shared/firestoreHelpers";
import LoginMotorista from "./LoginMotorista";
import MotoristaDashboard from "./MotoristaDashboard";

const COLORS = {
  clay: "#B5622A",
  clayDark: "#8C4A1F",
  cobalt: "#1B4B6B",
  ink: "#1A1613",
  paper: "#F6F1E9",
  line: "#E3D9C8",
};

export default function App() {
  const [estado, setEstado] = useState("cargando");
  const [motorista, setMotorista] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEstado("sin-sesion");
        setMotorista(null);
        return;
      }

      const perfil = await obtenerPerfil(user.uid);
      if (!perfil || perfil.rol !== "motorista") {
        setEstado("no-autorizado");
        return;
      }

      setMotorista({ id: user.uid, nombre: perfil.nombre, telefono: perfil.telefono });
      setEstado("listo");
    });

    return () => unsubscribe();
  }, []);

  function cerrarSesion() {
    signOut(auth);
  }

  if (estado === "cargando") {
    return (
      <div style={{ background: COLORS.paper }} className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" color={COLORS.cobalt} />
      </div>
    );
  }

  if (estado === "sin-sesion") {
    return <LoginMotorista />;
  }

  if (estado === "no-autorizado") {
    return (
      <div style={{ background: COLORS.paper, fontFamily: "'DM Sans', system-ui, sans-serif" }} className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#F3E3DC" }}>
            <Droplet size={20} color={COLORS.clay} />
          </div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: COLORS.ink }}>Cuenta no autorizada</h1>
          <p className="text-sm mb-6" style={{ color: COLORS.clayDark }}>
            Esta cuenta no está registrada como motorista. Contacta al administrador de tu flota.
          </p>
          <button onClick={cerrarSesion} className="text-sm underline" style={{ color: COLORS.cobalt }}>
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-3" style={{ background: "#fff", borderBottom: `1px solid ${COLORS.line}` }}>
        <span className="text-sm font-medium" style={{ color: COLORS.ink }}>{motorista.nombre}</span>
        <button onClick={cerrarSesion} className="flex items-center gap-1 text-xs" style={{ color: COLORS.clayDark }}>
          <LogOut size={13} /> Salir
        </button>
      </div>
      <MotoristaDashboard motorista={motorista} />
    </div>
  );
} 
