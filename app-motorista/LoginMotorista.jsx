import React, { useState, useRef } from "react";
import { Phone, ShieldCheck, Loader2, Droplet } from "lucide-react";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { auth } from "./shared/firebaseConfig";
import { verificarYActivarMotorista } from "./shared/firestoreHelpers";

const COLORS = {
  clay: "#B5622A",
  clayDark: "#8C4A1F",
  cobalt: "#1B4B6B",
  ink: "#1A1613",
  paper: "#F6F1E9",
  line: "#E3D9C8",
};

export default function LoginMotorista({ onLoginExitoso }) {
  const [paso, setPaso] = useState("telefono");
  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const confirmationResultRef = useRef(null);
  const recaptchaRef = useRef(null);

  function asegurarRecaptcha() {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return recaptchaRef.current;
  }

  async function enviarCodigo(e) {
    e.preventDefault();
    setError("");
    if (telefono.trim().length < 9) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }
    setCargando(true);
    try {
      const numeroCompleto = `+244${telefono.replace(/\D/g, "")}`;
      const verifier = asegurarRecaptcha();
      confirmationResultRef.current = await signInWithPhoneNumber(auth, numeroCompleto, verifier);
      setPaso("codigo");
    } catch (err) {
      setError("No se pudo enviar el código. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function verificarCodigo(e) {
    e.preventDefault();
    setError("");
    if (codigo.trim().length < 6) {
      setError("El código tiene 6 dígitos.");
      return;
    }
    setCargando(true);
    try {
      const credencial = await confirmationResultRef.current.confirm(codigo.trim());
      const uid = credencial.user.uid;

      const perfil = await verificarYActivarMotorista(uid, credencial.user.phoneNumber);
      if (!perfil) {
        setError("Este número no está registrado como motorista. Contacta al administrador.");
        setCargando(false);
        return;
      }

      onLoginExitoso({ id: uid, nombre: perfil.nombre, telefono: perfil.telefono });
    } catch (err) {
      setError("Código incorrecto. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      style={{ background: COLORS.paper, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <div id="recaptcha-container" />
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: COLORS.cobalt }}>
            <Droplet size={16} color="#fff" strokeWidth={2} />
          </div>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}
          >
            AquaFleet · Motorista
          </span>
        </div>

        {paso === "telefono" ? (
          <form onSubmit={enviarCodigo}>
            <h1 className="text-2xl font-semibold mb-1 text-center" style={{ color: COLORS.ink }}>
              Iniciar sesión
            </h1>
            <p className="text-sm mb-6 text-center" style={{ color: COLORS.clayDark }}>
              Ingresa tu número registrado como motorista
            </p>
            <div
              className="flex items-center rounded-xl px-4 mb-4"
              style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
            >
              <span className="text-sm mr-1" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>
                +244
              </span>
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
            {error && (
              <p className="text-sm mb-4" style={{ color: COLORS.clay }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl py-4 text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: cargando ? COLORS.clayDark : COLORS.clay }}
            >
              {cargando ? <Loader2 size={16} className="animate-spin" /> : null}
              {cargando ? "Enviando..." : "Enviar código"}
            </button>
          </form>
        ) : (
          <form onSubmit={verificarCodigo}>
            <h1 className="text-2xl font-semibold mb-1 text-center" style={{ color: COLORS.ink }}>
              Verifica tu número
            </h1>
            <p className="text-sm mb-6 text-center" style={{ color: COLORS.clayDark }}>
              Enviamos un código SMS a +244 {telefono}
            </p>
            <div
              className="flex items-center rounded-xl px-4 mb-4"
              style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
            >
              <ShieldCheck size={16} color={COLORS.clayDark} />
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full bg-transparent py-3 px-3 outline-none text-lg tracking-widest text-center"
                style={{ color: COLORS.ink, fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            {error && (
              <p className="text-sm mb-4" style={{ color: COLORS.clay }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl py-4 text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: cargando ? COLORS.clayDark : COLORS.clay }}
            >
              {cargando ? <Loader2 size={16} className="animate-spin" /> : null}
              {cargando ? "Verificando..." : "Verificar y entrar"}
            </button>
            <button
              type="button"
              onClick={() => setPaso("telefono")}
              className="w-full text-center text-xs mt-4 underline"
              style={{ color: COLORS.cobalt }}
            >
              Cambiar número
            </button>
          </form>
        )}
      </div>
    </div>
  );
      }
