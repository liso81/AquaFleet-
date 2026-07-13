import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
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
const MOTORISTAS_AUTORIZADOS = "motoristas_autorizados";

function normalizarTelefono(telefono) {
  return telefono.replace(/\D/g, "").slice(-9);
}

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

export async function obtenerPerfil(uid) {
  const snap = await getDoc(doc(db, USUARIOS, uid));
  return snap.exists() ? snap.data() : null;
}

export async function autorizarMotorista({ telefono, nombre }) {
  const id = normalizarTelefono(telefono);
  await setDoc(doc(db, MOTORISTAS_AUTORIZADOS, id), {
    telefono,
    nombre,
    activado: false,
    createdAt: serverTimestamp(),
  });
}

export async function revocarAutorizacion(telefono) {
  const id = normalizarTelefono(telefono);
  await deleteDoc(doc(db, MOTORISTAS_AUTORIZADOS, id));
}

export function escucharMotoristasAutorizados(callback) {
  return onSnapshot(collection(db, MOTORISTAS_AUTORIZADOS), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function verificarYActivarMotorista(uid, telefonoLogin) {
  const perfilExistente = await obtenerPerfil(uid);
  if (perfilExistente?.rol === "motorista") return perfilExistente;

  const id = normalizarTelefono(telefonoLogin);
  const autorizacionSnap = await getDoc(doc(db, MOTORISTAS_AUTORIZADOS, id));
  if (!autorizacionSnap.exists()) return null;

  const { nombre, telefono } = autorizacionSnap.data();
  const perfilNuevo = { rol: "motorista", nombre, telefono, activadoAt: serverTimestamp() };
  await setDoc(doc(db, USUARIOS, uid), perfilNuevo);
  await setDoc(doc(db, MOTORISTAS_AUTORIZADOS, id), { activado: true }, { merge: true });
  return perfilNuevo;
                    }
