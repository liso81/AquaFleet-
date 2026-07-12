import {
  collection,
  addDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const SOLICITUDES = "solicitudes";
const USUARIOS = "usuarios";

// ── Cliente: crear una solicitud ──
export async function crearSolicitud({ clienteId, clienteTelefono, cantidadLitros, ubicacion, direccionTexto }) {
  return addDoc(collection(db, SOLICITUDES), {
    clienteId,
    clienteTelefono,
    cantidadLitros,
    ubicacion,
    direccionTexto: direccionTexto ?? null,
    estado: "pendiente",
    motoristaId: null,
    motoristaNombre: null,
    motoristaTelefono: null,
    precioAcordado: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ── Cliente: escuchar el estado de su propia solicitud en tiempo real ──
export function escucharSolicitud(solicitudId, callback) {
  return onSnapshot(doc(db, SOLICITUDES, solicitudId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// ── Motorista: escuchar todas las solicitudes pendientes ──
export function escucharPendientes(callback) {
  const q = query(
    collection(db, SOLICITUDES),
    where("estado", "==", "pendiente"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ── Motorista: tomar un pedido de forma atómica ──
export async function tomarPedido(solicitudId, motorista) {
  const ref = doc(db, SOLICITUDES, solicitudId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().estado !== "pendiente") {
      throw new Error("Este pedido ya fue tomado por otro motorista.");
    }
    tx.update(ref, {
      estado: "contactado",
      motoristaId: motorista.id,
      motoristaNombre: motorista.nombre,
      motoristaTelefono: motorista.telefono,
      updatedAt: serverTimestamp(),
    });
  });
}

// ── Verificar rol de usuario ──
export async function obtenerPerfil(uid) {
  const snap = await getDoc(doc(db, USUARIOS, uid));
  return snap.exists() ? snap.data() : null;
                                      }
