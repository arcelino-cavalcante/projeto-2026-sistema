import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Printer, AlertTriangle, CheckCircle, FileText, TrendingUp } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";

interface Solicitacao {
  id: string;
  profId: string;
  profNome: string;
  turmaNome: string;
  copias: number;
  fileName: string;
  status: string;
  dataEnvio: string;
}

export default function Dashboard() {
  const [professor, setProfessor] = useState<any>(null);
  const [solicitacoesMes, setSolicitacoesMes] = useState<Solicitacao[]>([]);
  const [limiteCota] = useState(500);

  const { data: todasSolicitacoes } = useFirestoreCollection<Solicitacao>("xerox_solicitacoes");

  useEffect(() => {
    const sessao = localStorage.getItem("sessao_usuario");
    if (sessao) {
      const prof = JSON.parse(sessao);
      setProfessor(prof);

      if (todasSolicitacoes.length > 0) {
        const now = new Date();
        const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
        const currentYearStr = String(now.getFullYear());

        const filtradas = todasSolicitacoes.filter((s: any) => {
          if (s.profId !== prof.id) return false;
          try {
            const datePart = s.dataEnvio.split(" ")[0]; // "DD/MM/AAAA"
            const [, month, year] = datePart.split("/");
            return month === currentMonthStr && year === currentYearStr;
          } catch {
            return false;
          }
        });
        setSolicitacoesMes(filtradas);
      }
    }
  }, [todasSolicitacoes]);

  const totalImpressos = solicitacoesMes.reduce((acc, curr) => acc + curr.copias, 0);
  const restanteCota = Math.max(0, limiteCota - totalImpressos);
  const porcentagemUso = Math.min(100, (totalImpressos / limiteCota) * 100);

  const getMonthName = () => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[new Date().getMonth()];
  };

  return (
    <div className="space-y-6">
      {/* Header Bem-vindo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">
            Olá, <strong className="text-primary">{professor?.nome || "Professor"}</strong>. Acompanhe o resumo das suas atividades pedagógicas.
          </p>
        </div>
        <div className="text-sm text-muted-foreground bg-gray-100 px-3 py-1.5 rounded-full font-medium">
          Período: <span className="text-foreground">{getMonthName()} de {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Cota de Impressão */}
        <Card className="md:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Cota de Impressão Mensal</CardTitle>
              <CardDescription>Limite estabelecido para consumo de xerox no mês</CardDescription>
            </div>
            <Printer className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-4xl font-extrabold text-gray-900">{totalImpressos}</span>
                <span className="text-sm text-muted-foreground"> / {limiteCota} páginas utilizadas</span>
              </div>
              <span className="text-sm font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md">
                Restam {restanteCota} pág.
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-2">
              <Progress value={porcentagemUso} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0% de uso</span>
                <span>{porcentagemUso.toFixed(1)}% utilizado</span>
                <span>100% (Limite)</span>
              </div>
            </div>

            {/* Mensagem de Aviso Quota */}
            {porcentagemUso >= 80 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <p>
                  Atenção! Você já consumiu mais de 80% do seu limite mensal. Planeje com cuidado os próximos envios.
                </p>
              </div>
            )}

            {/* Modal de Detalhes da Cota */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Visualizar Detalhamento de Consumo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detalhamento de Cópias - {getMonthName()}</DialogTitle>
                  <DialogDescription>
                    Lista das solicitações de impressão enviadas no mês vigente que contabilizam na sua cota.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {solicitacoesMes.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhuma solicitação enviada este mês.</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 font-semibold text-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left">Turma</th>
                            <th className="px-4 py-3 text-left">Arquivo</th>
                            <th className="px-4 py-3 text-right">Cópias</th>
                            <th className="px-4 py-3 text-center">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {solicitacoesMes.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50/80">
                              <td className="px-4 py-3 font-medium text-gray-900">{s.turmaNome}</td>
                              <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]" title={s.fileName}>
                                {s.fileName}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-primary">{s.copias}</td>
                              <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                {s.dataEnvio.split(" ")[0]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border text-sm font-semibold">
                    <span>Consumo Consolidado:</span>
                    <span className="text-primary text-lg font-bold">{totalImpressos} páginas</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Card de Resumo Rápido */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Envios Realizados</p>
                <p className="text-3xl font-bold">{solicitacoesMes.length}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status do Mês</p>
                <p className="text-lg font-semibold text-green-600 flex items-center gap-1.5">
                  <CheckCircle className="h-5 w-5" /> Dentro da cota
                </p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
