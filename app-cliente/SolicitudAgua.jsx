 import React, { useState, useEffect } from "react";
import { MapPin, Droplet, Phone, Loader2, CheckCircle2, Truck, Clock } from "lucide-react";
import { crearSolicitud, escucharSolicitud, cancelarSolicitud } from "./shared/firestoreHelpers";

const COLORS = {
  clay: "#B5622A",
  clayDark: "#8C4A1F",
  cobalt: "#1B4B6B",
  cobaltLight: "#2E7CA8",
  ink: "#1A1613",
  paper: "#F6F1E9",
  line: "#E3D9C8",
};

export default function SolicitudAgua({ clienteId, onSubmit }) {
  const [litros, setLitros] = useState(0);
  const [milesInput, setMilesInput] = useState("0");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [solicitudId, setSolicitudId] = useState(null);
  const [estadoPedido, setEstadoPedido] = useState("pendente");
  const [motorista, setMotorista] = useState(null);

  function actualizarMiles(raw) {
    let limpio = raw.replace(/[^0-9.]/g, "");
    if (limpio.length > 1) {
      limpio = limpio.replace(/^0+(?=\d)/, "");
    }
    setMilesInput(limpio);
    const num = parseFloat(limpio);
    setLitros(isNaN(num) ? 0 : num * 1000);
  }

  function capturarUbicacion() {
    setError("");
    if (!navigator.geolocation) {
      setError("Este dispositivo não suporta geolocalização.");
      return;
    }
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setBuscandoUbicacion(false);
      },
      () => {
        setError("Não foi possível obter a localização. Ative-a nas definições.");
        setBuscandoUbicacion(false);
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }

  async function enviarSolicitud(e) {
    e.preventDefault();
    setError("");
    if (!ubicacion) {
      setError("Primeiro partilhe a sua localização.");
      return;
    }
    if (telefono.trim().length < 9) {
      setError("Insira um número de telefone válido.");
      return;
    }

    setEnviando(true);

    try {
      const docRef = await crearSolicitud({
        clienteId,
        clienteTelefono: telefono.trim(),
        cantidadLitros: litros,
        ubicacion,
      });
      setSolicitudId(docRef.id);
      setEstadoPedido("pendente");
      setMotorista(null);
      setEnviado(true);
      if (onSubmit) onSubmit({ id: docRef.id });
    } catch (err) {
      setError("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    if (!solicitudId) return;
    const unsubscribe = escucharSolicitud(solicitudId, (data) => {
      setEstadoPedido(data.estado);
      if (data.motoristaId) {
        setMotorista({ nombre: data.motoristaNombre, telefono: data.motoristaTelefono });
      }
    });
    return () => unsubscribe();
  }, [solicitudId]);

  if (enviado) {
    return (
      <div
        style={{ background: COLORS.paper, fontFamily: "'DM Sans', system-ui, sans-serif" }}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="max-w-sm w-full text-center">
          {estadoPedido === "pendente" ? (
            <>
              <div className="relative mx-auto mb-4 w-14 h-14 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: COLORS.cobaltLight, opacity: 0.35 }}
                />
                <Clock size={30} color={COLORS.cobalt} strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: COLORS.ink }}>
                À procura de motorista
              </h1>
              <p className="text-sm mb-6" style={{ color: COLORS.clayDark }}>
                O seu pedido está visível para os motoristas próximos. Assim que alguém o aceitar,
                avisamos aqui e vai ligar para o{" "}
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{telefono}</span> para
                combinar o preço.
              </p>
              <button
                onClick={async () => {
                  await cancelarSolicitud(solicitudId);
                  setEnviado(false);
                  setSolicitudId(null);
                }}
                className="text-sm underline mb-6"
                style={{ color: COLORS.clayDark }}
              >
                Cancelar pedido
              </button>
            </>
          ) : (
            <>
              <CheckCircle2 size={56} color={COLORS.cobalt} className="mx-auto mb-4" strokeWidth={1.5} />
              <h1 className="text-2xl font-semibold mb-2" style={{ color: COLORS.ink }}>
                O seu pedido foi aceite
              </h1>
              <p className="text-sm mb-6" style={{ color: COLORS.clayDark }}>
                {motorista?.nombre} vai ligar para combinar o preço e a hora de entrega.
              </p>
              <div
                className="rounded-xl p-4 flex items-center gap-3 mb-4 text-left"
                style={{ background: "#EEF4EF", border: `1px solid ${COLORS.cobalt}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: COLORS.cobalt }}
                >
                  <Truck size={18} color="#fff" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                    {motorista?.nombre}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>
                    {motorista?.telefono}
                  </p>
                </div>
              </div>
            </>
          )}

          <div
            className="rounded-lg p-4 text-left text-sm"
            style={{ background: "#fff", border: `1px solid ${COLORS.line}`, fontFamily: "'JetBrains Mono', monospace" }}
          >
            <div className="flex justify-between mb-1">
              <span style={{ color: COLORS.clayDark }}>quantidade</span>
              <span style={{ color: COLORS.ink }}>{(litros / 1000).toLocaleString()} mil L</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: COLORS.clayDark }}>estado</span>
              <span style={{ color: COLORS.cobalt }}>{estadoPedido}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setEnviado(false);
              setSolicitudId(null);
              setUbicacion(null);
              setTelefono("");
              setLitros(0);
              setMilesInput("0");
              setEstadoPedido("pendente");
              setMotorista(null);
            }}
            className="mt-6 text-sm underline"
            style={{ color: COLORS.cobalt }}
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ background: COLORS.paper, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      className="min-h-screen px-5 py-8"
    >
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: COLORS.cobalt }}
          >
            <Droplet size={16} color="#fff" strokeWidth={2} />
          </div>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}
          >
            AquaFleet
          </span>
        </div>
        <h1 className="text-2xl font-semibold mb-6" style={{ color: COLORS.ink }}>
          Pedir água
        </h1>

        <form onSubmit={enviarSolicitud} className="space-y-6">
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: COLORS.ink }}>
              Insira a quantidade de litros que deseja
            </label>
            <div
              className="mt-2 rounded-xl flex items-center justify-center gap-2 py-6"
              style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
            >
              <input
                type="text"
                inputMode="decimal"
                value={milesInput}
                onChange={(e) => actualizarMiles(e.target.value)}
                className="text-4xl font-bold bg-transparent text-center outline-none"
                style={{
                  color: COLORS.ink,
                  fontFamily: "'JetBrains Mono', monospace",
                  width: "6ch",
                }}
              />
              <span
                className="text-2xl font-bold"
                style={{ color: COLORS.ink, fontFamily: "'JetBrains Mono', monospace" }}
              >
                mil L
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.clayDark }}>
              Local de entrega
            </label>
            <button
              type="button"
              onClick={capturarUbicacion}
              disabled={buscandoUbicacion}
              className="mt-2 w-full rounded-xl px-4 py-3 flex items-center justify-between transition"
              style={{
                background: ubicacion ? "#EEF4EF" : "#fff",
                border: `1px solid ${ubicacion ? COLORS.cobalt : COLORS.line}`,
              }}
            >
              <span className="flex items-center gap-2 text-sm" style={{ color: COLORS.ink }}>
                <MapPin size={16} color={ubicacion ? COLORS.cobalt : COLORS.clayDark} />
                {buscandoUbicacion
                  ? "A procurar localização..."
                  : ubicacion
                  ? `${ubicacion.lat.toFixed(5)}, ${ubicacion.lng.toFixed(5)}`
                  : "Partilhar a minha localização"}
              </span>
              {buscandoUbicacion && <Loader2 size={16} className="animate-spin" color={COLORS.cobalt} />}
            </button>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.clayDark }}>
              Telefone
            </label>
            <div
              className="mt-2 flex items-center rounded-xl px-4"
              style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
            >
              <Phone size={16} color={COLORS.clayDark} />
              <input
                type="tel"
                placeholder="9XX XXX XXX"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-transparent py-3 px-3 outline-none text-sm"
                style={{ color: COLORS.ink }}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: COLORS.clay }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl py-4 text-sm font-semibold tracking-wide transition"
            style={{
              background: enviando ? COLORS.clayDark : COLORS.clay,
              color: "#fff",
            }}
          >
            {enviando ? "A enviar..." : "Pedir água"}
          </button>
        </form>
      </div>
    </div>
  );
}
