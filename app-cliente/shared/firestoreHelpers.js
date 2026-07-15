 import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const SOLICITUDES = "solicitudes";

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

export function escucharSolicitud(solicitudId, callback) {
  return onSnapshot(doc(db, SOLICITUDES, solicitudId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export async function cancelarSolicitud(solicitudId) {
  await updateDoc(doc(db, SOLICITUDES, solicitudId), { estado: "cancelado" });
                    }
