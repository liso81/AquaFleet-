import React, { useState, useEffect } from "react";
import { UserPlus, Droplet, CheckCircle2, Clock, Trash2, Loader2 } from "lucide-react";
import {
  autorizarMotorista,
  revocarAutorizacion,
  escucharMotoristasAutorizados,
} from "./shared/firestoreHelpers";

const COLORS = {
  clay: "#B5622A",
  clayDark: "#8C4A1F",
  cobalt: "#1B4B6B",
  ink: "#1A1613",
  paper: "#F6F1E9",
  line: "#E3D9C8",
};

export default function AdminMotoristas() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [motoristas, setMotoristas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = escucharMotoristasAutorizados((lista) => {
      setMotoristas(lista.sort((a, b) => (a.activado === b.activado ? 0 : a.activado ? 1 : -1)));
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleAutorizar(e) {
    e.preventDefault();
    setError("");
    if (nombre.trim().length < 2) {
      setError("Ingresa el nombre del motorista.");
      return;
    }
    if (telefono.replace(/\D/g, "").length < 9) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }
    setGuardando(true);
    try {
      await autorizarMotorista({ telefono: `+244${telefono.replace(/\D/g, "")}`, nombre: nombre.trim() });
      setNombre("");
      setTelefono("");
    } catch (err) {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleRevocar(telefonoCompleto) {
    await revocarAutorizacion(telefonoCompleto);
  }

  return (
    <div
      style={{ background: COLORS.paper, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      className="min-h-screen px-5 py-8"
    >
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: COLORS.cobalt }}>
            <Droplet size={16} color="#fff" strokeWidth={2} />
          </div>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}
          >
            AquaFleet · Admin
          </span>
        </div>
        <h1 className="text-2xl font-semibold mb-6" style={{ color: COLORS.ink }}>
          Motoristas autorizados
        </h1>

        <form onSubmit={handleAutorizar} className="space-y-3 mb-8">
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
          >
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: COLORS.ink }}
            />
          </div>
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
          >
            <span className="text-sm" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>
              +244
            </span>
            <input
              type="tel"
              placeholder="9XX XXX XXX"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: COLORS.ink }}
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: COLORS.clay }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: guardando ? COLORS.clayDark : COLORS.clay }}
          >
            {guardando ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {guardando ? "Guardando..." : "Autorizar motorista"}
          </button>
        </form>

        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.clayDark }}>
          Lista
        </p>

        {cargando && (
          <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.clayDark }}>
            <Loader2 size={14} className="animate-spin" /> Cargando...
          </div>
        )}

        {!cargando && motoristas.length === 0 && (
          <p className="text-sm" style={{ color: COLORS.clayDark }}>
            Todavía no autorizaste a ningún motorista.
          </p>
        )}

        <div className="space-y-2">
          {motoristas.map((m) => (
            <div
              key={m.id}
              className="rounded-lg p-3 flex items-center gap-2 text-sm"
              style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
            >
              {m.activado ? (
                <CheckCircle2 size={16} color={COLORS.cobalt} />
              ) : (
                <Clock size={16} color={COLORS.clayDark} />
              )}
              <div className="flex-1">
                <p style={{ color: COLORS.ink }}>{m.nombre}</p>
                <p
                  className="text-xs"
                  style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {m.telefono} · {m.activado ? "activo" : "pendiente de primer login"}
                </p>
              </div>
              {!m.activado && (
                <button onClick={() => handleRevocar(m.telefono)} title="Quitar autorización">
                  <Trash2 size={15} color={COLORS.clay} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
                                                      }
