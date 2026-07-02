import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../firebase";

const KEY_TO_COLLECTION: Record<string, string> = {
  "coordenacao_etapas": "etapas",
  "coordenacao_turmas": "turmas",
  "coordenacao_disciplinas": "disciplinas",
  "coordenacao_professores": "professores",
  "coordenacao_coordenadores": "coordenadores",
  "coordenacao_pcd_estudantes": "pcd_estudantes",
  "professor_planejamentos": "planejamentos",
  "xerox_solicitacoes": "solicitacoes",
  "almoxarifado_pedagogico": "insumos_pedagogicos",
  "almoxarifado_nao_pedagogico": "insumos_nao_pedagogicos",
  "almoxarifado_movimentacoes": "movimentacoes",
  "agendamentos_equipamentos": "agendamentos",
  "solicitacoes_projetos": "solicitacoes_projetos",
  "atividades_emergencia": "atividades_emergencia",
  "xerox_atividades_exitosas": "atividades_exitosas"
};

let isSyncing = false;

export const setSyncingFlag = (val: boolean) => {
  isSyncing = val;
};

const syncQueue: Record<string, Promise<void>> = {};

// Sincronizar mudança de array local para o Firestore (Diffing)
export const syncLocalToFirestore = (key: string, valueStr: string) => {
  if (isSyncing) return;
  const collectionName = KEY_TO_COLLECTION[key];
  if (!collectionName) return;

  // Obter ou inicializar a fila para esta chave específica
  const currentPromise = syncQueue[key] || Promise.resolve();

  const nextPromise = currentPromise.then(async () => {
    try {
      const items = JSON.parse(valueStr);
      if (!Array.isArray(items)) return;

      // 1. Obter ids dos itens locais
      const localIds = new Set(items.map(item => item.id).filter(id => !!id));

      // 2. Salvar/Atualizar todos os documentos no Firestore
      for (const item of items) {
        if (item.id) {
          const docRef = doc(db, collectionName, item.id);
          const sanitizedData = JSON.parse(JSON.stringify(item));
          await setDoc(docRef, sanitizedData, { merge: true });
        }
      }

      // 3. Deletar itens removidos se e somente se nenhuma escrita mais recente ocorreu
      const latestValue = localStorage.getItem(key);
      if (latestValue === valueStr) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletionPromises: Promise<void>[] = [];

        querySnapshot.forEach((firebaseDoc) => {
          if (!localIds.has(firebaseDoc.id)) {
            const docToDeleteRef = doc(db, collectionName, firebaseDoc.id);
            deletionPromises.push(deleteDoc(docToDeleteRef));
            console.log(`[FirebaseSync] Documento deletado do Firestore: ${firebaseDoc.id} na coleção ${collectionName}`);
          }
        });

        await Promise.all(deletionPromises);
      }
    } catch (error) {
      console.error(`[FirebaseSync] Erro ao sincronizar a chave ${key} para o Firestore:`, error);
    }
  });

  syncQueue[key] = nextPromise;
};

// Sincronizar deleção de chave local para o Firestore
export const syncLocalDeletionToFirestore = async (key: string) => {
  if (isSyncing) return;
  const collectionName = KEY_TO_COLLECTION[key];
  if (!collectionName) return;

  try {
    // Se a chave local foi deletada por completo, limpamos a coleção do Firestore
    const querySnapshot = await getDocs(collection(db, collectionName));
    querySnapshot.forEach(async (firebaseDoc) => {
      const docToDeleteRef = doc(db, collectionName, firebaseDoc.id);
      await deleteDoc(docToDeleteRef);
    });
  } catch (error) {
    console.error(`[FirebaseSync] Erro ao sincronizar deleção da chave ${key} no Firestore:`, error);
  }
};

// ==========================================
// CONFIGURAR INTERCEPTADORES DO LOCAL STORAGE
// ==========================================
export const setupLocalStorageFirebaseSync = () => {
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.apply(this, [key, value]);
    if (KEY_TO_COLLECTION[key]) {
      // Executa a sincronização em background
      syncLocalToFirestore(key, value);
    }
  };

  const originalRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function(key) {
    originalRemoveItem.apply(this, [key]);
    if (KEY_TO_COLLECTION[key]) {
      syncLocalDeletionToFirestore(key);
    }
  };
  
  console.log("[FirebaseSync] Interceptadores de LocalStorage inicializados!");
};
