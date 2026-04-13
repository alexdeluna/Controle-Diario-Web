import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

await setPersistence(auth, browserLocalPersistence);

export async function registrar(email, senha) {
  return await createUserWithEmailAndPassword(auth, email, senha);
}

export async function entrar(email, senha) {
  return await signInWithEmailAndPassword(auth, email, senha);
}


export function observarUsuario(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function sair() {
  return await signOut(auth);
}

export async function entrarComGoogle() {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}
