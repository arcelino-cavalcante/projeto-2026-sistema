import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

// ==========================================
// FIREBASE STORAGE UPLOAD HELPER
// ==========================================
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  try {
    const fileRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Erro no upload do arquivo para o Firebase Storage:", error);
    throw error;
  }
};

// ==========================================
// FIRESTORE SYNC AND CRUD OPERATIONS
// ==========================================

// Helper genérico para puxar uma coleção inteira do Firestore
export const fetchCollection = async (collectionName: string): Promise<any[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: any[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    console.error(`Erro ao buscar coleção ${collectionName}:`, error);
    return [];
  }
};

// Helper genérico para salvar um documento no Firestore
export const saveDocument = async (collectionName: string, docId: string, data: any): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Erro ao salvar documento ${docId} na coleção ${collectionName}:`, error);
  }
};

// Helper genérico para deletar um documento no Firestore
export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Erro ao deletar documento ${docId} na coleção ${collectionName}:`, error);
  }
};

// Helper genérico para adicionar um documento novo gerando ID
export const addDocument = async (collectionName: string, data: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error(`Erro ao adicionar documento na coleção ${collectionName}:`, error);
    throw error;
  }
};

// ==========================================
// FUNÇÕES DE HYDRATION REMOVIDAS
// ==========================================
// A arquitetura foi migrada para ser 100% online usando onSnapshot (useFirestoreCollection hook)
// O sistema não depende mais do localStorage para armazenar coleções do Firebase.
