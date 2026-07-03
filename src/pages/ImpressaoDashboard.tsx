import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Clock, Check } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";

interface Solicitacao {
  id: string;
  status: "pendente" | "impresso";
  copias: number;
}

export default function ImpressaoDashboard() {
  const { data: solicitacoes } = useFirestoreCollection<Solicitacao>("xerox_solicitacoes");

  const pendentes = solicitacoes.filter(s => s.status === "pendente");
  const concluidos = solicitacoes.filter(s => s.status === "impresso");
  const totalCopiasPendentes = pendentes.reduce((acc, curr) => acc + curr.copias, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Impressão</h1>
        <p className="text-muted-foreground">Visão geral e métricas das solicitações de impressão do Setor Xerox.</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendentes.length}</div>
            <p className="text-xs text-muted-foreground">aguardando na fila de espera</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Páginas a Imprimir</CardTitle>
            <Printer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCopiasPendentes}</div>
            <p className="text-xs text-muted-foreground">páginas acumuladas na fila</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões Concluídas</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{concluidos.length}</div>
            <p className="text-xs text-muted-foreground">trabalhos finalizados com sucesso</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
