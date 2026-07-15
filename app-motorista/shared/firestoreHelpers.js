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

export function telefonoAEmail(telefono) {
  const digitos = telefono.replace(/\D/g, "");
  return `${digitos}@aquafleet.app`;
}

export function escucharPendientes(callback, onError) {
  const q = query(
    collection(db, SOLICITUDES),
    where("estado", "==", "pendente"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export async function tomarPedido(solicitudId, motorista) {
  const ref = doc(db, SOLICITUDES, solicitudId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().estado !== "pendente") {
      throw new Error("Este pedido já foi aceite por outro motorista.");
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

export async function crearPerfilMotorista(uid, { nombre, telefono }) {
  const perfil = { rol: "motorista", nombre, telefono, createdAt: serverTimestamp() };
  await setDoc(doc(db, USUARIOS, uid), perfil);
  return perfil;
}

export function listarMotoristas(callback) {
  const q = query(collection(db, USUARIOS), where("rol", "==", "motorista"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
