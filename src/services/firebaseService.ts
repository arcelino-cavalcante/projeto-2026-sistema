import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
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

// ==========================================
// DESCARREGAR E POPULAR LOCAL STORAGE (HYDRATION)
// ==========================================

// 1. Hidratar dados estritamente necessários para a tela de login (Ultrarrápido)
export const hydrateLoginData = async (): Promise<void> => {
  try {
    const [professores, coordenadores] = await Promise.all([
      fetchCollection("professores"),
      fetchCollection("coordenadores")
    ]);

    localStorage.setItem("coordenacao_professores", JSON.stringify(professores));
    localStorage.setItem("coordenacao_coordenadores", JSON.stringify(coordenadores));
  } catch (error) {
    console.error("Erro na hidratação de login do Firebase:", error);
  }
};

// 2. Hidratar dados pedagógicos em background ou pós-login (Paralelo)
export const hydrateDashboardData = async (): Promise<void> => {
  try {
    const [
      etapas,
      turmas,
      disciplinas,
      pcdEstudantes,
      planejamentos,
      solicitacoes,
      insumosPedagogicos,
      insumosNaoPedagogicos,
      movimentacoes,
      agendamentos,
      solicitacoesProjetos,
      atividadesEmergencia,
      atividadesExitosas
    ] = await Promise.all([
      fetchCollection("etapas"),
      fetchCollection("turmas"),
      fetchCollection("disciplinas"),
      fetchCollection("pcd_estudantes"),
      fetchCollection("planejamentos"),
      fetchCollection("solicitacoes"),
      fetchCollection("insumos_pedagogicos"),
      fetchCollection("insumos_nao_pedagogicos"),
      fetchCollection("movimentacoes"),
      fetchCollection("agendamentos"),
      fetchCollection("solicitacoes_projetos"),
      fetchCollection("atividades_emergencia"),
      fetchCollection("atividades_exitosas")
    ]);

    localStorage.setItem("coordenacao_etapas", JSON.stringify(etapas));
    localStorage.setItem("coordenacao_turmas", JSON.stringify(turmas));
    localStorage.setItem("coordenacao_disciplinas", JSON.stringify(disciplinas));
    localStorage.setItem("coordenacao_pcd_estudantes", JSON.stringify(pcdEstudantes));
    localStorage.setItem("professor_planejamentos", JSON.stringify(planejamentos));
    localStorage.setItem("xerox_solicitacoes", JSON.stringify(solicitacoes));
    localStorage.setItem("almoxarifado_pedagogico", JSON.stringify(insumosPedagogicos));
    localStorage.setItem("almoxarifado_nao_pedagogico", JSON.stringify(insumosNaoPedagogicos));
    localStorage.setItem("almoxarifado_movimentacoes", JSON.stringify(movimentacoes));
    localStorage.setItem("agendamentos_equipamentos", JSON.stringify(agendamentos));
    localStorage.setItem("solicitacoes_projetos", JSON.stringify(solicitacoesProjetos));
    localStorage.setItem("atividades_emergencia", JSON.stringify(atividadesEmergencia));
    localStorage.setItem("xerox_atividades_exitosas", JSON.stringify(atividadesExitosas));
  } catch (error) {
    console.error("Erro na hidratação de dashboard do Firebase:", error);
  }
};

// Retrocompatibilidade (se referenciado em outros locais)
export const hydrateLocalStorageFromFirebase = async (): Promise<void> => {
  await Promise.all([hydrateLoginData(), hydrateDashboardData()]);
};
