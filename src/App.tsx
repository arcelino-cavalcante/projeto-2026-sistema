import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";

// Layouts
import ProfessorLayout from "./components/ProfessorLayout";
import CoordenacaoLayout from "./components/CoordenacaoLayout";
import ImpressaoLayout from "./components/ImpressaoLayout";
import AdminLayout from "./components/AdminLayout";
import AlmoxarifadoLayout from "./components/AlmoxarifadoLayout";

// Professor Pages
import Dashboard from "./pages/Dashboard";
import Impressao from "./pages/Impressao";
import Planejamento from "./pages/Planejamento";
import BancoAtividades from "./pages/BancoAtividades";
import MaterialPedagogico from "./pages/MaterialPedagogico";

// Coordenação Pages
import CoordenacaoDashboard from "./pages/CoordenacaoDashboard";
import CoordenacaoCadastros from "./pages/CoordenacaoCadastros";
import CoordenacaoBancoAtividades from "./pages/CoordenacaoBancoAtividades";
import CoordenacaoImpressao from "./pages/CoordenacaoImpressao";
import CoordenacaoInformacoes from "./pages/CoordenacaoInformacoes";
import CoordenacaoMensagens from "./pages/CoordenacaoMensagens";
import CoordenacaoGestao from "./pages/CoordenacaoGestao";
import CoordenacaoPlanejamentos from "./pages/CoordenacaoPlanejamentos";

// Impressão Pages
import ImpressaoDashboard from "./pages/ImpressaoDashboard";
import FilaImpressao from "./pages/FilaImpressao";
import QuantidadeImpressao from "./pages/QuantidadeImpressao";
import AlmoxarifadoEstoque from "./pages/AlmoxarifadoEstoque";

// Professor Pages additions
import ProfessorDadosImportantes from "./pages/ProfessorDadosImportantes";
import ProfessorConfiguracoes from "./pages/ProfessorConfiguracoes";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminCadastroCoordenadores from "./pages/AdminCadastroCoordenadores";

// Almoxarifado Pages
import AlmoxarifadoDashboard from "./pages/AlmoxarifadoDashboard";
import AlmoxarifadoCadastros from "./pages/AlmoxarifadoCadastros";
import AlmoxarifadoAgendamentos from "./pages/AlmoxarifadoAgendamentos";

import NotFound from "./pages/NotFound";
import { useState, useEffect } from "react";
import { hydrateLocalStorageFromFirebase } from "./services/firebaseService";
import { setSyncingFlag } from "./services/firebaseSync";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hidratar os dados em background de forma síncrona no início da aplicação
    const runHydration = async () => {
      try {
        setSyncingFlag(true);
        await hydrateLocalStorageFromFirebase();
        console.log("[FirebaseSync] Banco de dados em nuvem sincronizado com sucesso!");
      } catch (err) {
        console.error("Erro na inicialização do Firebase:", err);
      } finally {
        setSyncingFlag(false);
        setLoading(false);
      }
    };
    runHydration();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner moderno */}
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">Sistema Pedagógico</h2>
            <p className="text-sm text-slate-500">Sincronizando dados em nuvem...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
          {/* Default Route redirects to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route path="/login" element={<Login />} />

          {/* Professor Routes */}
          <Route path="/professor" element={<ProfessorLayout />}>
            <Route index element={<Navigate to="/professor/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="impressao" element={<Impressao />} />
            <Route path="planejamento" element={<Planejamento />} />
            <Route path="banco-atividades" element={<BancoAtividades />} />
            <Route path="material-pedagogico" element={<MaterialPedagogico />} />
            <Route path="dados-importantes" element={<ProfessorDadosImportantes />} />
            <Route path="configuracoes" element={<ProfessorConfiguracoes />} />
          </Route>

          {/* Coordenação Routes */}
          <Route path="/coordenacao" element={<CoordenacaoLayout />}>
            <Route index element={<Navigate to="/coordenacao/dashboard" replace />} />
            <Route path="dashboard" element={<CoordenacaoDashboard />} />
            <Route path="cadastros" element={<CoordenacaoCadastros />} />
            <Route path="banco-atividades" element={<CoordenacaoBancoAtividades />} />
            <Route path="impressao" element={<CoordenacaoImpressao />} />
            <Route path="informacoes" element={<CoordenacaoInformacoes />} />
            <Route path="mensagens" element={<CoordenacaoMensagens />} />
            <Route path="gestao" element={<CoordenacaoGestao />} />
            <Route path="planejamentos" element={<CoordenacaoPlanejamentos />} />
          </Route>

          {/* Setor de Impressão Routes */}
          <Route path="/setor-impressao" element={<ImpressaoLayout />}>
            <Route index element={<Navigate to="/setor-impressao/dashboard" replace />} />
            <Route path="dashboard" element={<ImpressaoDashboard />} />
            <Route path="fila" element={<FilaImpressao />} />
            <Route path="quantidade" element={<QuantidadeImpressao />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="cadastro-coordenadores" element={<AdminCadastroCoordenadores />} />
          </Route>

          {/* Almoxarifado Routes */}
          <Route path="/almoxarifado" element={<AlmoxarifadoLayout />}>
            <Route index element={<Navigate to="/almoxarifado/dashboard" replace />} />
            <Route path="dashboard" element={<AlmoxarifadoDashboard />} />
            <Route path="pedagogico" element={<AlmoxarifadoEstoque categoria="pedagogico" />} />
            <Route path="nao-pedagogico" element={<AlmoxarifadoEstoque categoria="nao_pedagogico" />} />
            <Route path="agendamentos" element={<AlmoxarifadoAgendamentos />} />
            <Route path="cadastros" element={<AlmoxarifadoCadastros />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
