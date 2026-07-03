import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Clock, FileText, Check, Users } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { doc, updateDoc } from "firebase/firestore";
import { addDocument } from "../services/firebaseService";
import { db } from "../firebase";

interface Solicitacao {
  id: string;
  profId: string;
  profNome: string;
  turmaNome: string;
  estudantes: number;
  tipo: string;
  copias: number;
  observacoes: string;
  fileName: string;
  status: "pendente" | "impresso";
  dataEnvio: string;
  fileNameAdaptada?: string;
  coloridaAdaptada?: boolean;
}

export default function FilaImpressao() {
  const { data: solicitacoes } = useFirestoreCollection<Solicitacao>("xerox_solicitacoes");
  const { data: itensEstoque } = useFirestoreCollection<any>("escola_estoque_itens");

  const handleMarcarComoImpresso = async (id: string) => {
    const req = solicitacoes.find(s => s.id === id);
    if (!req) return;

    try {
      // 1. Atualizar status no Firestore
      await updateDoc(doc(db, "xerox_solicitacoes", id), {
        status: "impresso"
      });

      // 2. Deduzir do estoque de insumos
      const defaultItens = [
        { id: "1", nome: "Papel A4", categoria: "pedagogico", qtdAtual: 10000, qtdMax: 10000, unidade: "Folhas" },
        { id: "2", nome: "Toner Preto", categoria: "pedagogico", qtdAtual: 100, qtdMax: 100, unidade: "%" },
        { id: "3", nome: "Toner Garrafas (Reserva)", categoria: "pedagogico", qtdAtual: 5, qtdMax: 5, unidade: "Unidades" },
        { id: "4", nome: "Cartolina", categoria: "pedagogico", qtdAtual: 150, qtdMax: 150, unidade: "Unidades" },
        { id: "5", nome: "Cola Branca", categoria: "pedagogico", qtdAtual: 30, qtdMax: 30, unidade: "Unidades" },
        { id: "6", nome: "Copo Descartável", categoria: "nao_pedagogico", qtdAtual: 500, qtdMax: 500, unidade: "Unidades" },
        { id: "7", nome: "Detergente Líquido", categoria: "nao_pedagogico", qtdAtual: 10, qtdMax: 10, unidade: "Litros" },
        { id: "8", nome: "Papel Toalha", categoria: "nao_pedagogico", qtdAtual: 50, qtdMax: 50, unidade: "Rolos" }
      ];
      
      const itens = itensEstoque && itensEstoque.length > 0 ? [...itensEstoque] : defaultItens;

      let papelItem = itens.find((item: any) => item.id === "1" || item.nome.toLowerCase().includes("papel a4"));
      let tonerItem = itens.find((item: any) => item.id === "2" || item.nome.toLowerCase().includes("toner preto"));
      let garrafaItem = itens.find((item: any) => item.id === "3" || item.nome.toLowerCase().includes("garrafa"));

      // Reduzir papel A4
      const papelConsumido = req.copias;
      let novaQtdPapel = papelItem ? Math.max(0, papelItem.qtdAtual - papelConsumido) : 0;

      // Reduzir toner ativo (ex: 0.05% por folha)
      const tonerConsumido = Number((papelConsumido * 0.05).toFixed(2));
      let novaQtdToner = tonerItem ? Math.max(0, Number((tonerItem.qtdAtual - tonerConsumido).toFixed(2))) : 0;
      let novaQtdGarrafa = garrafaItem ? garrafaItem.qtdAtual : 0;

      // Se o toner ativo zerar, usar uma garrafa física reserva se houver
      if (tonerItem && novaQtdToner <= 0 && garrafaItem && garrafaItem.qtdAtual > 0) {
        novaQtdGarrafa = Math.max(0, garrafaItem.qtdAtual - 1);
        novaQtdToner = 100;
        toast.info("Toner ativo esgotado. Nova garrafa de tinta reserva instalada!");
      }

      if (papelItem) {
        await updateDoc(doc(db, "escola_estoque_itens", papelItem.id), {
          qtdAtual: novaQtdPapel
        });
      }
      if (tonerItem) {
        await updateDoc(doc(db, "escola_estoque_itens", tonerItem.id), {
          qtdAtual: novaQtdToner
        });
      }
      if (garrafaItem && novaQtdGarrafa !== garrafaItem.qtdAtual) {
        await updateDoc(doc(db, "escola_estoque_itens", garrafaItem.id), {
          qtdAtual: novaQtdGarrafa
        });
      }

      // Registrar no histórico de transações
      const dataAtual = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      
      await addDocument("escola_estoque_logs", {
        data: dataAtual,
        itemId: papelItem?.id || "1",
        itemName: papelItem?.nome || "Papel A4",
        qtd: -papelConsumido,
        tipo: "saida",
        obs: `Impressão da atividade: "${req.fileName}" (${req.profNome})`,
        categoria: "pedagogico"
      });

      await addDocument("escola_estoque_logs", {
        data: dataAtual,
        itemId: tonerItem?.id || "2",
        itemName: tonerItem?.nome || "Toner Preto",
        qtd: -tonerConsumido,
        tipo: "saida",
        obs: `Consumo de toner para atividade: "${req.fileName}"`,
        categoria: "pedagogico"
      });

      // Validar alertas de estoque crítico (15%)
      if (papelItem) {
        const papelLimite = Math.floor(papelItem.qtdMax * 0.15);
        if (novaQtdPapel <= papelLimite) {
          toast.warning("ALERTA: Estoque de Papel A4 está crítico (abaixo de 15%)!");
        }
      }
      if (garrafaItem && tonerItem) {
        if (novaQtdGarrafa <= 0 && novaQtdToner <= 15) {
          toast.warning("ALERTA: Nível de tinta da impressora está crítico e não há garrafas reserva!");
        }
      }

      toast.success("Solicitação de impressão concluída!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao marcar solicitação como impressa.");
    }
  };

  const pendentes = solicitacoes
    .filter(s => s.status === "pendente")
    .sort((a, b) => Number(a.id) - Number(b.id));

  const concluidos = solicitacoes
    .filter(s => s.status === "impresso")
    .sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fila de Impressão</h1>
        <p className="text-muted-foreground">Monitore a fila de espera de cópias e o histórico de trabalhos finalizados.</p>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="pendentes">Fila de Espera ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="concluidos">Histórico de Impressos ({concluidos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Solicitações (Ordem de Chegada)</CardTitle>
              <CardDescription>
                Imprima os documentos seguindo a ordem de entrada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendentes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-medium">
                  Não há solicitações pendentes na fila. Tudo impresso!
                </div>
              ) : (
                <div className="space-y-4">
                  {pendentes.map((s, index) => (
                    <div key={s.id} className="p-4 border rounded-xl bg-white space-y-4 shadow-sm hover:shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-br">
                        #{index + 1}
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900">{s.profNome}</h3>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Users className="h-4 w-4" /> Turma: <span className="font-semibold text-gray-700">{s.turmaNome}</span> ({s.estudantes} alunos)
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <FileText className="h-4 w-4 text-red-500 shrink-0" />
                            Arquivo: <span className="font-mono text-xs text-gray-700 font-bold">{s.fileName}</span>
                          </p>
                        </div>

                        <Button 
                          onClick={() => handleMarcarComoImpresso(s.id)}
                          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2 shrink-0 self-end md:self-center"
                        >
                          <Check className="h-4 w-4" /> Concluir e Marcar como Impresso
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y text-sm bg-gray-50/50 px-3 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Distribuição</p>
                          <p className="font-semibold capitalize text-gray-700">{s.tipo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total de Cópias</p>
                          <p className="font-extrabold text-lg text-primary">{s.copias}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Data/Hora Envio</p>
                          <p className="font-semibold text-gray-700">{s.dataEnvio}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            Pendente
                          </span>
                        </div>
                      </div>

                      {s.fileNameAdaptada && (
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-250 text-sm text-amber-900 flex justify-between items-center font-bold">
                          <span>
                            ⚠️ ATIVIDADE PCD ADAPTADA: <span className="font-mono text-xs text-indigo-700 bg-white px-2 py-0.5 rounded border">{s.fileNameAdaptada}</span>
                          </span>
                          <span className={`text-xs font-black px-2.5 py-1 rounded ${s.coloridaAdaptada ? 'bg-purple-600 text-white animate-pulse' : 'bg-gray-200 text-gray-800'}`}>
                            {s.coloridaAdaptada ? 'IMPRIMIR EM CORES' : 'IMPRIMIR PRETO & BRANCO'}
                          </span>
                        </div>
                      )}

                      {s.observacoes && (
                        <div className="bg-amber-50/50 p-3 rounded-lg text-sm text-gray-700 border border-amber-100/50">
                          <strong>Observações:</strong> {s.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concluidos">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Impressões Realizadas</CardTitle>
              <CardDescription>
                Registro de solicitações finalizadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {concluidos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-medium">
                  Nenhuma impressão realizada ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {concluidos.map(s => (
                    <div key={s.id} className="p-4 border rounded-xl bg-gray-50/50 space-y-3 opacity-90">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h3 className="font-bold text-gray-800">{s.profNome}</h3>
                          <p className="text-xs text-muted-foreground">Turma: {s.turmaNome} | Arquivo: <span className="font-mono text-xs">{s.fileName}</span></p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                          <Check className="h-3 w-3" /> Impresso
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y text-xs text-gray-600 bg-white p-2.5 rounded-lg">
                        <div>
                          <p className="text-muted-foreground">Distribuição</p>
                          <p className="font-medium capitalize">{s.tipo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cópias</p>
                          <p className="font-bold text-gray-800">{s.copias}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Data Envio</p>
                          <p className="font-medium">{s.dataEnvio}</p>
                        </div>
                        <div>
                          <p className="text-green-700 font-bold">Retirada Liberada</p>
                          <p className="text-muted-foreground">Pronto para pegar</p>
                        </div>
                      </div>
                      
                      {s.fileNameAdaptada && (
                        <div className="bg-amber-50/50 p-2.5 border border-amber-100 rounded text-sm text-amber-900 flex justify-between items-center font-medium">
                          <span>
                            <strong>Arquivo PCD Adaptado:</strong> <span className="font-mono text-xs text-indigo-700 bg-white px-2 py-0.5 rounded border">{s.fileNameAdaptada}</span>
                          </span>
                          <span className={`text-xs font-black px-2.5 py-1 rounded ${s.coloridaAdaptada ? 'bg-purple-600 text-white animate-pulse' : 'bg-gray-200 text-gray-800'}`}>
                            {s.coloridaAdaptada ? 'IMPRIMIR EM CORES' : 'IMPRIMIR PRETO & BRANCO'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
