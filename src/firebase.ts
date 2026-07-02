import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD2SrxtVqRm13Gvn8y8JuK-uYPxWAgxfGQ",
  authDomain: "banco-de-dados-sistema-pedago.firebaseapp.com",
  projectId: "banco-de-dados-sistema-pedago",
  storageBucket: "banco-de-dados-sistema-pedago.firebasestorage.app",
  messagingSenderId: "447732704778",
  appId: "1:447732704778:web:95e88a70da3a3f816a21f3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
