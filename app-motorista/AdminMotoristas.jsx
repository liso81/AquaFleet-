 import React, { useState, useEffect } from "react";
import { UserPlus, Droplet, CheckCircle2, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./shared/firebaseConfig";
import { telefonoAEmail, crearPerfilMotorista, listarMotoristas } from "./shared/firestoreHelpers";

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
  const [contrasena, setContrasena] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [motoristas, setMotoristas] = useState([]);

  useEffect(() => {
    const unsubscribe = listarMotoristas((lista) => setMotoristas(lista));
    return () => unsubscribe();
  }, []);

  async function handleCrear(e) {
    e.preventDefault();
    setError("");
    setExito("");
    if (nombre.trim().length < 2) {
      setError("Insira o nome do motorista.");
      return;
    }
    if (telefono.replace(/\D/g, "").length < 9) {
      setError("Insira um número de telefone válido.");
      return;
    }
    if (contrasena.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setGuardando(true);
    try {
      const email = telefonoAEmail(telefono);
      const cred = await createUserWithEmailAndPassword(auth, email, contrasena);
      await crearPerfilMotorista(cred.user.uid, { nombre: nombre.trim(), telefono: `+244${telefono.replace(/\D/g, "")}` });
      setExito(`Conta criada. Partilhe com o motorista: número ${telefono.replace(/\D/g, "")}, senha ${contrasena}`);
      setNombre("");
      setTelefono("");
      setContrasena("");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Esse número já tem uma conta criada.");
      } else {
        setError("Não foi possível criar a conta: " + err.message);
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ background: COLORS.paper, fontFamily: "'DM Sans', system-ui, sans-serif" }} className="min-h-screen px-5 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: COLORS.cobalt }}>
            <Droplet size={16} color="#fff" strokeWidth={2} />
          </div>
          <span className="text-xs tracking-widest uppercase" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>
            AquaFleet · Admin
          </span>
        </div>
        <h1 className="text-2xl font-semibold mb-6" style={{ color: COLORS.ink }}>
          Criar motorista
        </h1>

        <form onSubmit={handleCrear} className="space-y-3 mb-8">
          <div className="rounded-xl px-4 py-3" style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}>
            <input
              type="text"
              placeholder="Nome completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: COLORS.ink }}
            />
          </div>
          <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}>
            <span className="text-sm" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>+244</span>
            <input
              type="tel"
              placeholder="9XX XXX XXX"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: COLORS.ink }}
            />
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}>
            <input
              type="text"
              placeholder="Senha (mín. 6 caracteres)"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: COLORS.ink }}
            />
          </div>
          {error && <p className="text-sm" style={{ color: COLORS.clay }}>{error}</p>}
          {exito && <p className="text-sm" style={{ color: COLORS.cobalt }}>{exito}</p>}
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: guardando ? COLORS.clayDark : COLORS.clay }}
          >
            {guardando ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {guardando ? "A criar..." : "Criar motorista"}
          </button>
        </form>

        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.clayDark }}>Motoristas ativos</p>
        <div className="space-y-2">
          {motoristas.map((m) => (
            <div key={m.id} className="rounded-lg p-3 flex items-center gap-2 text-sm" style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}>
              <CheckCircle2 size={16} color={COLORS.cobalt} />
              <div>
                <p style={{ color: COLORS.ink }}>{m.nombre}</p>
                <p className="text-xs" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>{m.telefono}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
