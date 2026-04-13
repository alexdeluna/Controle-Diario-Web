import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

export async function registrar(email, senha) {
  return await createUserWithEmailAndPassword(auth, email, senha);
}

export async function entrar(email, senha) {
  return await signInWithEmailAndPassword(auth, email, senha);
}

const provider = new GoogleAuthProvider();

export async function entrarComGoogle() {
  return await signInWithPopup(auth, provider);
}

export function observarUsuario(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function sair() {
  return await signOut(auth);
}