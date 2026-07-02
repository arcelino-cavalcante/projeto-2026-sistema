import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderGit, Library, Printer, UserCheck } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    etapas: 0,
    turmas: 0,
    disciplinas: 0,
    professores: 0,
    solicitacoesXerox: 0,
    coordenadores: 0,
  });

  useEffect(() => {
    const etapasCount = JSON.parse(localStorage.getItem("coordenacao_etapas") || "[]").length;
    const turmasCount = JSON.parse(localStorage.getItem("coordenacao_turmas") || "[]").length;
    const disciplinasCount = JSON.parse(localStorage.getItem("coordenacao_disciplinas") || "[]").length;
    const professoresCount = JSON.parse(localStorage.getItem("coordenacao_professores") || "[]").length;
    const xeroxCount = JSON.parse(localStorage.getItem("xerox_solicitacoes") || "[]").length;
    const coordCount = JSON.parse(localStorage.getItem("coordenacao_coordenadores") || "[]").length;

    setStats({
      etapas: etapasCount,
      turmas: turmasCount,
      disciplinas: disciplinasCount,
      professores: professoresCount,
      solicitacoesXerox: xeroxCount,
      coordenadores: coordCount,
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Administrador</h1>
        <p className="text-muted-foreground">Visão consolidada das estatísticas do Sistema Escolar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Coordenadores Cadastrados</CardTitle>
            <UserCheck className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{stats.coordenadores}</div>
            <p className="text-xs text-muted-foreground">responsáveis pelo pedagógico</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Professores Ativos</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.professores}</div>
            <p className="text-xs text-muted-foreground">docentes da instituição</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Etapas de Ensino</CardTitle>
            <Library className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.etapas}</div>
            <p className="text-xs text-muted-foreground">ciclos formativos</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Turmas Registradas</CardTitle>
            <FolderGit className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">{stats.turmas}</div>
            <p className="text-xs text-muted-foreground">grupos de estudantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Disciplinas Cadastradas</CardTitle>
            <FolderGit className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{stats.disciplinas}</div>
            <p className="text-xs text-muted-foreground">matérias curriculares</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Solicitações de Cópia (Xerox)</CardTitle>
            <Printer className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{stats.solicitacoesXerox}</div>
            <p className="text-xs text-muted-foreground">total de impressões enviadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
