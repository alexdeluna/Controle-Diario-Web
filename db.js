import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

// ===============================
// ABASTECIMENTOS
// ===============================

export async function salvarAbastecimentoFirestore(uid, valor) {
  const agora = new Date();

  await addDoc(collection(db, "users", uid, "abastecimentos"), {
    data: agora.toLocaleDateString("pt-BR"),
    hora: agora.toTimeString().slice(0, 5),
    valor: Number(valor),
    createdAt: serverTimestamp()
  });
}

export async function listarAbastecimentosFirestore(uid) {
  const q = query(
    collection(db, "users", uid, "abastecimentos"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function removerAbastecimentoFirestore(uid, id) {
  await deleteDoc(doc(db, "users", uid, "abastecimentos", id));
}

// ===============================
// OUTROS CUSTOS
// ===============================

export async function salvarOutroCustoFirestore(uid, tipo, descricao, valor) {
  const agora = new Date();

  await addDoc(collection(db, "users", uid, "outrosCustos"), {
    data: agora.toLocaleDateString("pt-BR"),
    desc: descricao,
    tipo: tipo,
    valor: Number(valor),
    createdAt: serverTimestamp()
  });
}

export async function listarOutrosCustosFirestore(uid) {
  const q = query(
    collection(db, "users", uid, "outrosCustos"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function removerOutroCustoFirestore(uid, id) {
  await deleteDoc(doc(db, "users", uid, "outrosCustos", id));
}

// ===============================
// TURNOS
// ===============================

export async function salvarTurnoAtivoFirestore(uid, dadosTurno) {
  await setDoc(doc(db, "users", uid, "controle", "turnoAtivo"), {
    ...dadosTurno,
    updatedAt: serverTimestamp()
  });
}

export async function obterTurnoAtivoFirestore(uid) {
  const ref = doc(db, "users", uid, "controle", "turnoAtivo");
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data();
}

export async function removerTurnoAtivoFirestore(uid) {
  await deleteDoc(doc(db, "users", uid, "controle", "turnoAtivo"));
}

export async function salvarTurnoFinalizadoFirestore(uid, dadosTurno) {
  await addDoc(collection(db, "users", uid, "turnos"), {
    ...dadosTurno,
    createdAt: serverTimestamp()
  });
}

export async function listarTurnosFirestore(uid) {

  const q = query(
    collection(db, "users", uid, "turnos"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  const turnos = snap.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));

  return turnos;

}

export async function removerTurnoFinalizadoFirestore(uid, id) {
  await deleteDoc(doc(db, "users", uid, "turnos", id));
}