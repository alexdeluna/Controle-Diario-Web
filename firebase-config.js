import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD05efb_doCj0eKV83mVuIxteLIgIO4HpE",
  authDomain: "controle-diario-6263c.firebaseapp.com",
  projectId: "controle-diario-6263c",
  storageBucket: "controle-diario-6263c.firebasestorage.app",
  messagingSenderId: "212977981179",
  appId: "1:212977981179:web:fbe613b8262f37ebb5825e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);