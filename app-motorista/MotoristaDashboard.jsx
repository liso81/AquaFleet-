import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Phone, Droplet, Loader2, Navigation, Clock, CheckCircle2 } from "lucide-react";
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
    const unsubscribe = escucharPendientes((lista) => {
      setSolicitudes(lista);
      setCargandoSolicitudes(false);
    });
    return () => unsubscribe();
  }, []);

  const pendientesOrdenadas = useMemo(() => {
    if (!miUbicacion) return solicitudes;
    return solicitudes
      .map((s) => ({ ...s, distancia: distanciaKm(miUbicacion, s.ubicacion) }))
      .sort((a, b) => a.distancia - b.distancia);
  }, [solicitudes, miUbicacion]);

  async function tomarPedido(id) {
    setErrorPorId((prev) => ({ ...prev, [id]: null }));
    setTomandoId(id);
    const solicitud = solicitudes.find((s) => s.id === id);
    try {
      await tomarPedidoFirestore(id, motorista);
      if (solicitud) setMisPedidosTomados((prev) => [...prev, solicitud]);
    } catch (e) {
      setErrorPorId((prev) => ({ ...prev, [id]: e.message }));
    } finally {
      setTomandoId(null);
    }
  }

  function llamar(telefono) {
    window.location.href = `tel:${telefono.replace(/\s+/g, "")}`;
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
        <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.ink }}>
          Solicitudes cerca de ti
        </h1>
        <p className="text-sm mb-6 flex items-center gap-1" style={{ color: COLORS.clayDark }}>
          {buscandoUbicacion ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Localizando tu posición...
            </>
          ) : (
            <>
              <Navigation size={13} /> Ordenadas por distancia
            </>
          )}
        </p>

        {cargandoSolicitudes && (
          <div
            className="rounded-xl p-6 text-center text-sm flex items-center justify-center gap-2"
            style={{ background: "#fff", border: `1px solid ${COLORS.line}`, color: COLORS.clayDark }}
          >
            <Loader2 size={14} className="animate-spin" /> Cargando solicitudes...
          </div>
        )}

        {!cargandoSolicitudes && pendientesOrdenadas.length === 0 && (
          <div
            className="rounded-xl p-6 text-center text-sm"
            style={{ background: "#fff", border: `1px solid ${COLORS.line}`, color: COLORS.clayDark }}
          >
            No hay solicitudes pendientes por ahora.
          </div>
        )}

        <div className="space-y-3">
          {pendientesOrdenadas.map((s) => (
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
                    <MapPin size={12} /> {s.direccionTexto || "Ver ubicación en el mapa"}
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
                  <Navigation size={12} /> {s.distancia?.toFixed(1) ?? "—"} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> hace {minutosDesde(s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now())} min
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => llamar(s.clienteTelefono)}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
                  style={{ background: COLORS.paper, border: `1px solid ${COLORS.cobalt}`, c
