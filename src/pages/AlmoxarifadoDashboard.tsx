import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Library, Layers, AlertTriangle, History, Inbox } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";

export default function AlmoxarifadoDashboard() {
  const { data: itens } = useFirestoreCollection<any>("escola_estoque_itens");
  const { data: logs } = useFirestoreCollection<any>("escola_estoque_logs");
  const { data: solicitacoes } = useFirestoreCollection<any>("solicitacoes_materiais");

  const [stats, setStats] = useState({
    pedagogicos: 0,
    naoPedagogicos: 0,
    criticos: 0,
    movimentacoes: 0,
    pedidosPendentes: 0,
  });

  useEffect(() => {
    const pedagogicosCount = itens.filter((i: any) => i.categoria === "pedagogico").length;
    const naoPedCount = itens.filter((i: any) => i.categoria === "nao_pedagogico").length;
    const criticosCount = itens.filter((i: any) => i.qtdAtual <= i.qtdMax * 0.15).length;
    
    const logsCount = logs.length;
    const reqsCount = solicitacoes.filter((r: any) => r.status === "pendente").length;

    setStats({
      pedagogicos: pedagogicosCount,
      naoPedagogicos: naoPedCount,
      criticos: criticosCount,
      movimentacoes: logsCount,
      pedidosPendentes: reqsCount
    });
  }, [itens, logs, solicitacoes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard do Almoxarifado</h1>
        <p className="text-muted-foreground">Visão geral dos insumos, requisições de professores e nível de abastecimento escolar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Materiais Pedagógicos</CardTitle>
            <Library className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.pedagogicos}</div>
            <p className="text-xs text-muted-foreground">itens ativos catalogados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Materiais Não Pedagógicos</CardTitle>
            <Layers className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{stats.naoPedagogicos}</div>
            <p className="text-xs text-muted-foreground">itens de limpeza, higiene e copa</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-gray-200 ${stats.criticos > 0 ? "border-red-300 bg-red-50/5" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Itens em Estoque Crítico</CardTitle>
            <AlertTriangle className={`h-5 w-5 ${stats.criticos > 0 ? "text-red-600 animate-bounce" : "text-gray-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.criticos > 0 ? "text-red-700" : "text-gray-700"}`}>{stats.criticos}</div>
            <p className="text-xs text-muted-foreground">abaixo de 15% da capacidade</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Pedidos de Materiais Pendentes</CardTitle>
            <Inbox className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.pedidosPendentes}</div>
            <p className="text-xs text-muted-foreground">aguardando liberação e entrega</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Movimentações de Estoque</CardTitle>
            <History className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">{stats.movimentacoes}</div>
            <p className="text-xs text-muted-foreground">entradas e saídas no histórico</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
