 import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Phone, Droplet, Loader2, Navigation, Clock, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { escucharPendientes, tomarPedido as tomarPedidoFirestore } from "./shared/firestoreHelpers";

const COLORS = {
  clay: "#B5622A",
  clayDark: "#8C4A1F",
  cobalt: "#1B4B6B",
  cobaltLight: "#2E7CA8",
  ink: "#1A1613",
  paper: "#F6F1E9",
  line: "#E3D9C8",
};

function distanciaKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function minutosDesde(ts) {
  return Math.max(1, Math.round((Date.now() - ts) / 60000));
}

export default function MotoristaDashboard({ motorista }) {
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [misPedidosTomados, setMisPedidosTomados] = useState([]);
  const [tomandoId, setTomandoId] = useState(null);
  const [errorPorId, setErrorPorId] = useState({});
  const [errorCarga, setErrorCarga] = useState("");
  const [precioPorId, setPrecioPorId] = useState({});

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [localidadBusca, setLocalidadBusca] = useState("");
  const [litrosMin, setLitrosMin] = useState("");
  const [ordenPor, setOrdenPor] = useState("distancia"); // distancia | litros | recente

  useEffect(() => {
    if (!navigator.geolocation) {
      setBuscandoUbicacion(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBuscandoUbicacion(false);
      },
      () => setBuscandoUbicacion(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const unsubscribe = escucharPendientes(
      (lista) => {
        setSolicitudes(lista);
        setCargandoSolicitudes(false);
      },
      (error) => {
        setErrorCarga(error.code + ": " + error.message);
        setCargandoSolicitudes(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const pendientesFiltradas = useMemo(() => {
    let lista = solicitudes.map((s) => ({
      ...s,
      distancia: miUbicacion ? distanciaKm(miUbicacion, s.ubicacion) : null,
    }));

    if (localidadBusca.trim()) {
      const termo = localidadBusca.trim().toLowerCase();
      lista = lista.filter((s) => (s.direccionTexto || "").toLowerCase().includes(termo));
    }

    if (litrosMin) {
      const min = Number(litrosMin) * 1000;
      lista = lista.filter((s) => s.cantidadLitros >= min);
    }

    if (ordenPor === "distancia" && miUbicacion) {
      lista.sort((a, b) => a.distancia - b.distancia);
    } else if (ordenPor === "litros") {
      lista.sort((a, b) => b.cantidadLitros - a.cantidadLitros);
    }
    // "recente" ya viene ordenado desde Firestore (createdAt desc)

    return lista;
  }, [solicitudes, miUbicacion, localidadBusca, litrosMin, ordenPor]);

  async function tomarPedido(id) {
    const precio = Number(precioPorId[id]);
    if (!precio || precio <= 0) {
      setErrorPorId((prev) => ({ ...prev, [id]: "Insira o preço combinado antes de aceitar." }));
      return;
    }

    setErrorPorId((prev) => ({ ...prev, [id]: null }));
    setTomandoId(id);
    const solicitud = solicitudes.find((s) => s.id === id);
    try {
      await tomarPedidoFirestore(id, motorista, precio);
      if (solicitud) setMisPedidosTomados((prev) => [...prev, { ...solicitud, precioAcordado: precio }]);
    } catch (e) {
      setErrorPorId((prev) => ({ ...prev, [id]: e.message }));
    } finally {
      setTomandoId(null);
    }
  }

  function llamar(telefono) {
    window.location.href = "tel:" + telefono.replace(/\s+/g, "");
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
            AquaFleet · Motorista
          </span>
        </div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold" style={{ color: COLORS.ink }}>
            Pedidos perto de ti
          </h1>
          <button
            onClick={() => setMostrarFiltros((v) => !v)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
            style={{
              color: mostrarFiltros ? "#fff" : COLORS.cobalt,
              background: mostrarFiltros ? COLORS.cobalt : "transparent",
              border: `1px solid ${COLORS.cobalt}`,
            }}
          >
            <SlidersHorizontal size={13} /> Filtros
          </button>
        </div>
        <p className="text-sm mb-4 flex items-center gap-1" style={{ color: COLORS.clayDark }}>
          {buscandoUbicacion ? (
            <React.Fragment>
              <Loader2 size={13} className="animate-spin" /> A localizar a tua posição...
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Navigation size={13} /> {pendientesFiltradas.length} pedido(s) encontrado(s)
            </React.Fragment>
          )}
        </p>

        {mostrarFiltros && (
          <div
            className="rounded-xl p-4 mb-4 space-y-3"
            style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
          >
            <div>
              <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.clayDark }}>
                Localidade
              </label>
              <input
                type="text"
                placeholder="Ex: Talatona, Viana..."
                value={localidadBusca}
                onChange={(e) => setLocalidadBusca(e.target.value)}
                className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.clayDark }}>
                Quantidade mínima (mil L)
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Sem mínimo"
                value={litrosMin}
                onChange={(e) => setLitrosMin(e.target.value)}
                className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.clayDark }}>
                Ordenar por
              </label>
              <div className="flex gap-2 mt-1">
                {[
                  { id: "distancia", label: "Distância" },
                  { id: "litros", label: "Quantidade" },
                  { id: "recente", label: "Mais recente" },
                ].map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setOrdenPor(op.id)}
                    className="flex-1 rounded-lg py-2 text-xs font-medium"
                    style={{
                      background: ordenPor === op.id ? COLORS.cobalt : COLORS.paper,
                      color: ordenPor === op.id ? "#fff" : COLORS.ink,
                      border: `1px solid ${COLORS.line}`,
                    }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
            {(localidadBusca || litrosMin) && (
              <button
                onClick={() => {
                  setLocalidadBusca("");
                  setLitrosMin("");
                }}
                className="text-xs underline"
                style={{ color: COLORS.clayDark }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {errorCarga && (
          <div className="rounded-xl p-4 text-sm mb-4" style={{ background: "#FDECEA", color: COLORS.clay }}>
            {errorCarga}
          </div>
        )}

        {cargandoSolicitudes && (
          <div
            className="rounded-xl p-6 text-center text-sm flex items-center justify-center gap-2"
            style={{ background: "#fff", border: `1px solid ${COLORS.line}`, color: COLORS.clayDark }}
          >
            <Loader2 size={14} className="animate-spin" /> A carregar pedidos...
          </div>
        )}

        {!cargandoSolicitudes && pendientesFiltradas.length === 0 && (
          <div
            className="rounded-xl p-6 text-center text-sm"
            style={{ background: "#fff", border: `1px solid ${COLORS.line}`, color: COLORS.clayDark }}
          >
            Não há pedidos que correspondam aos filtros.
          </div>
        )}

        <div className="space-y-3">
          {pendientesFiltradas.map((s) => (
            <div
              key={s.id}
              className="rounded-xl p-4"
              style={{ background: "#fff", border: `1px solid ${COLORS.line}` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                    {s.clienteNombre || s.clienteTelefono}
                  </p>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: COLORS.clayDark }}>
                    <MapPin size={12} /> {s.direccionTexto || "Ver localização no mapa"}
                  </p>
                </div>
                <span
                  className="text-lg font-bold shrink-0"
                  style={{ color: COLORS.cobalt, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {(s.cantidadLitros / 1000).toLocaleString()} mil L
                </span>
              </div>

              <div
                className="flex items-center gap-4 text-xs mb-3"
                style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="flex items-center gap-1">
                  <Navigation size={12} /> {s.distancia !== null ? s.distancia.toFixed(1) : "—"} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> há {minutosDesde(Date.now())} min
                </span>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${s.ubicacion.lat},${s.ubicacion.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg py-2 mb-2 text-xs font-medium flex items-center justify-center gap-1.5"
                style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
              >
                <MapPin size={13} /> Ver localização no mapa
              </a>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => llamar(s.clienteTelefono)}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
                  style={{ background: COLORS.paper, border: "1px solid " + COLORS.cobalt, color: COLORS.cobalt }}
                >
                  <Phone size={14} /> Ligar
                </button>
              </div>

              <div
                className="flex items-center rounded-lg px-3 mb-2"
                style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}
              >
                <span className="text-sm" style={{ color: COLORS.clayDark, fontFamily: "'JetBrains Mono', monospace" }}>
                  Kz
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Preço combinado"
                  value={precioPorId[s.id] || ""}
                  onChange={(e) => setPrecioPorId((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  className="w-full bg-transparent py-2.5 px-2 outline-none text-sm"
                  style={{ color: COLORS.ink }}
                />
              </div>

              <button
                onClick={() => tomarPedido(s.id)}
                disabled={tomandoId === s.id}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                style={{ background: tomandoId === s.id ? COLORS.clayDark : COLORS.clay }}
              >
                {tomandoId === s.id ? (
                  <React.Fragment>
                    <Loader2 size={14} className="animate-spin" /> A aceitar...
                  </React.Fragment>
                ) : (
                  "Aceitar pedido"
                )}
              </button>

              {errorPorId[s.id] && (
                <p className="text-xs mt-2" style={{ color: COLORS.clay }}>
                  {errorPorId[s.id]}
                </p>
              )}
            </div>
          ))}
        </div>

        {misPedidosTomados.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.clayDark }}>
              Aceites por ti
            </p>
            <div className="space-y-2">
              {misPedidosTomados.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg p-3 flex items-center gap-2 text-sm"
                  style={{ background: "#EEF4EF", border: "1px solid " + COLORS.cobalt }}
                >
                  <CheckCircle2 size={16} color={COLORS.cobalt} />
                  <span style={{ color: COLORS.ink }}>{s.clienteTelefono}</span>
                  <span
                    className="ml-auto"
                    style={{ color: COLORS.cobalt, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {s.precioAcordado ? `${Number(s.precioAcordado).toLocaleString()} Kz` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
