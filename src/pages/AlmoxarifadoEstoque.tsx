import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Package, Plus, Minus, AlertTriangle, Check, History, Layers, ClipboardList, TrendingUp } from "lucide-react";

import { useFirestoreCollection } from "../hooks/useFirestore";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { addDocument } from "../services/firebaseService";
import { db } from "../firebase";


interface ItemEstoque {
  id: string;
  nome: string;
  categoria: "pedagogico" | "nao_pedagogico";
  qtdAtual: number;
  qtdMax: number;
  unidade: string;
}

interface LogTransacao {
  id: string;
  data: string;
  itemId: string;
  itemName: string;
  qtd: number;
  tipo: "entrada" | "saida" | "ajuste";
  obs: string;
  categoria: "pedagogico" | "nao_pedagogico";
  etapaNome?: string;
  profNome?: string;
  turmaNome?: string;
}

interface MaterialRequest {
  id: string;
  profId: string;
  profNome: string;
  turmas: string[];
  projetoNome: string;
  planoFileName: string;
  materiais: string;
  status: "pendente" | "entregue";
  dataSolicitacao: string;
}

interface Props {
  categoria: "pedagogico" | "nao_pedagogico";
}

export default function AlmoxarifadoEstoque({ categoria }: Props) {
  
  const { data: itensRaw } = useFirestoreCollection<ItemEstoque>("escola_estoque_itens");
  const itens = itensRaw.filter(i => i.categoria === categoria);
  const { data: logsRaw } = useFirestoreCollection<LogTransacao>("escola_estoque_logs");
  const logs = logsRaw.filter(l => l.categoria === categoria);
  const { data: solicitacoesMateriais } = useFirestoreCollection<MaterialRequest>("solicitacoes_materiais");
  const { data: etapas } = useFirestoreCollection<any>("etapas");
  const { data: professores } = useFirestoreCollection<any>("professores");
  const { data: turmas } = useFirestoreCollection<any>("turmas");

  // Dialog Entrada
  const [entradaOpen, setEntradaOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [entradaQtd, setEntradaQtd] = useState("");
  const [entradaObs, setEntradaObs] = useState("");

  // Dialog Saída (Retirada)
  const [saidaOpen, setSaidaOpen] = useState(false);
  const [selectedEtapaId, setSelectedEtapaId] = useState("");
  const [selectedProfId, setSelectedProfId] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  
  // Mapeamento de itemID -> qtd retirada
  const [materiaisRetirados, setMateriaisRetirados] = useState<Record<string, { selecionado: boolean; qtd: string }>>({});

  useEffect(() => {
    if (itens.length > 0 && !selectedItemId) {
      setSelectedItemId(itens[0].id);
    }
    const initialRetiradas: Record<string, { selecionado: boolean; qtd: string }> = {};
    itens.forEach((i: ItemEstoque) => {
      if (!materiaisRetirados[i.id]) {
        initialRetiradas[i.id] = { selecionado: false, qtd: "" };
      }
    });
    setMateriaisRetirados(prev => ({...initialRetiradas, ...prev}));
  }, [itens, categoria]);

  const turmasFiltradas = turmas.filter(t => t.etapaId === selectedEtapaId);
  const professoresFiltrados = professores.filter(p => p.etapaIds?.includes(selectedEtapaId));

  useEffect(() => {
    if (turmasFiltradas.length > 0) {
      setSelectedTurmaId(turmasFiltradas[0].id);
    } else {
      setSelectedTurmaId("");
    }
    if (professoresFiltrados.length > 0) {
      setSelectedProfId(professoresFiltrados[0].id);
    } else {
      setSelectedProfId("");
    }
  }, [selectedEtapaId, etapas]);

  const handleEntradaEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(entradaQtd);
    if (!val || val <= 0) {
      toast.error("Quantidade inválida.");
      return;
    }

    const itemAlvo = itensRaw.find(i => i.id === selectedItemId);
    if (!itemAlvo) return;

    try {
      await updateDoc(doc(db, "escola_estoque_itens", itemAlvo.id), {
        qtdAtual: Math.min(itemAlvo.qtdMax, itemAlvo.qtdAtual + val)
      });

      await addDocument("escola_estoque_logs", {
        data: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        itemId: itemAlvo.id,
        itemName: itemAlvo.nome,
        qtd: val,
        tipo: "entrada",
        obs: entradaObs.trim() || "Entrada manual de insumos",
        categoria: itemAlvo.categoria
      });

      setEntradaQtd("");
      setEntradaObs("");
      setEntradaOpen(false);
      toast.success(`Abastecimento de ${itemAlvo.nome} registrado!`);
    } catch (error) {
      toast.error("Erro ao registrar entrada.");
    }
  };

  const handleRegistrarSaida = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const etapa = etapas.find((et: any) => et.id === selectedEtapaId);
    const prof = professores.find((pr: any) => pr.id === selectedProfId);
    const turma = turmas.find((tr: any) => tr.id === selectedTurmaId);

    if (!etapa || !prof || !turma) {
      toast.error("Por favor, selecione Etapa, Professor e Turma.");
      return;
    }

    const itensSelecionados = Object.entries(materiaisRetirados).filter(
      ([_, val]) => val.selecionado && Number(val.qtd) > 0
    );

    if (itensSelecionados.length === 0) {
      toast.error("Selecione pelo menos um item e informe a quantidade para retirada.");
      return;
    }

    const dataAtual = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Validar limites antes de salvar
    for (const [id, val] of itensSelecionados) {
      const itemAlvo = itensRaw.find(i => i.id === id);
      const qtdSaida = Number(val.qtd);
      if (!itemAlvo) continue;

      if (itemAlvo.qtdAtual < qtdSaida) {
        toast.error(`Estoque insuficiente de ${itemAlvo.nome}. Disponível: ${itemAlvo.qtdAtual} ${itemAlvo.unidade}`);
        return;
      }
    }

    try {
      for (const [id, val] of itensSelecionados) {
        const itemAlvo = itensRaw.find(i => i.id === id);
        const qtdSaida = Number(val.qtd);
        if (!itemAlvo) continue;

        const novaQtd = Math.max(0, itemAlvo.qtdAtual - qtdSaida);
        await updateDoc(doc(db, "escola_estoque_itens", itemAlvo.id), {
          qtdAtual: novaQtd
        });

        await addDocument("escola_estoque_logs", {
          data: dataAtual,
          itemId: itemAlvo.id,
          itemName: itemAlvo.nome,
          qtd: -qtdSaida,
          tipo: "saida",
          obs: `Retirada direta de material para a turma ${turma.nome}`,
          categoria: itemAlvo.categoria,
          etapaNome: etapa.nome,
          profNome: prof.nome,
          turmaNome: `${turma.nome} (${etapa.nome})`
        });

        if (novaQtd <= itemAlvo.qtdMax * 0.15) {
          toast.warning(`ATENÇÃO: O item ${itemAlvo.nome} atingiu nível crítico (menos de 15% em estoque)!`);
        }
      }

      setSaidaOpen(false);
      toast.success("Retirada registrada com sucesso!");
    } catch (error) {
      toast.error("Erro ao registrar retirada.");
    }
  };

  const handleToggleMaterial = (id: string, checked: boolean) => {
    setMateriaisRetirados(prev => ({
      ...prev,
      [id]: { ...prev[id], selecionado: checked }
    }));
  };

  const handleQtdMaterialChange = (id: string, value: string) => {
    setMateriaisRetirados(prev => ({
      ...prev,
      [id]: { ...prev[id], qtd: value }
    }));
  };

  const handleEntregarMateriais = async (req: MaterialRequest) => {
    const dataAtual = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    let cartolinasQtd = 2;
    let colasQtd = 1;

    const desc = req.materiais.toLowerCase();
    const cartolinaMatch = desc.match(/(\d+)\s*cartolina/);
    if (cartolinaMatch) cartolinasQtd = Number(cartolinaMatch[1]);

    const colaMatch = desc.match(/(\d+)\s*cola/);
    if (colaMatch) colasQtd = Number(colaMatch[1]);

    const cartolinaItem = itensRaw.find(i => i.nome.toLowerCase().includes("cartolina"));
    const colaItem = itensRaw.find(i => i.nome.toLowerCase().includes("cola"));

    try {
      if (cartolinaItem) {
        await updateDoc(doc(db, "escola_estoque_itens", cartolinaItem.id), {
          qtdAtual: Math.max(0, cartolinaItem.qtdAtual - cartolinasQtd)
        });
        await addDocument("escola_estoque_logs", {
          data: dataAtual,
          itemId: cartolinaItem.id,
          itemName: cartolinaItem.nome,
          qtd: -cartolinasQtd,
          tipo: "saida",
          obs: `Entrega para projeto: "${req.projetoNome}" (${req.profNome})`,
          categoria: "pedagogico",
          profNome: req.profNome,
          turmaNome: req.turmas.join(", ")
        });
      }

      if (colaItem) {
        await updateDoc(doc(db, "escola_estoque_itens", colaItem.id), {
          qtdAtual: Math.max(0, colaItem.qtdAtual - colasQtd)
        });
        await addDocument("escola_estoque_logs", {
          data: dataAtual,
          itemId: colaItem.id,
          itemName: colaItem.nome,
          qtd: -colasQtd,
          tipo: "saida",
          obs: `Entrega para projeto: "${req.projetoNome}" (${req.profNome})`,
          categoria: "pedagogico",
          profNome: req.profNome,
          turmaNome: req.turmas.join(", ")
        });
      }

      await updateDoc(doc(db, "solicitacoes_materiais", req.id), {
        status: "entregue"
      });

      toast.success(`Materiais entregues! Dedução: ${cartolinasQtd} cartolinas e ${colasQtd} colas.`);
    } catch (error) {
      toast.error("Erro ao registrar entrega.");
    }
  };

  const getPercent = (curr: number, max: number) => {
    return Math.min(100, Math.floor((curr / max) * 100));
  };

  const isCritico = (item: ItemEstoque) => {
    return getPercent(item.qtdAtual, item.qtdMax) <= 15;
  };

  // Agregações para o Controle de Retiradas (Aba 4)
  const logsSaida = logs.filter(l => l.tipo === "saida" && l.profNome);
  
  // Consumo por Turma
  const consumoPorTurma: Record<string, Record<string, number>> = {};
  logsSaida.forEach(log => {
    const tNome = log.turmaNome || "Sem Turma";
    if (!consumoPorTurma[tNome]) consumoPorTurma[tNome] = {};
    const itemKey = log.itemName;
    consumoPorTurma[tNome][itemKey] = (consumoPorTurma[tNome][itemKey] || 0) + Math.abs(log.qtd);
  });

  // Consumo por Professor
  const consumoPorProfessor: Record<string, Record<string, number>> = {};
  logsSaida.forEach(log => {
    const pNome = log.profNome || "Sem Professor";
    if (!consumoPorProfessor[pNome]) consumoPorProfessor[pNome] = {};
    const itemKey = log.itemName;
    consumoPorProfessor[pNome][itemKey] = (consumoPorProfessor[pNome][itemKey] || 0) + Math.abs(log.qtd);
  });

  const formattedCategoryName = categoria === "pedagogico" ? "Materiais Pedagógicos" : "Materiais Não Pedagógicos";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{formattedCategoryName}</h1>
          <p className="text-muted-foreground">Controle operacional de insumos e histórico de retiradas.</p>
        </div>

        <div className="flex gap-2">
          {/* Botão Registrar Saída (Retirada) */}
          {itens.length > 0 && (
            <Dialog open={saidaOpen} onOpenChange={setSaidaOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-red-200 hover:bg-red-50 text-red-600 font-bold">
                  <Minus className="h-5 w-5" /> Registrar Saída
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Registrar Retirada de Insumo</DialogTitle>
                  <DialogDescription>Dê baixa física nos materiais entregues aos professores na secretaria.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRegistrarSaida} className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="saida-etapa">Etapa</Label>
                      <Select value={selectedEtapaId} onValueChange={setSelectedEtapaId}>
                        <SelectTrigger id="saida-etapa" className="bg-white">
                          <SelectValue placeholder="Etapa..." />
                        </SelectTrigger>
                        <SelectContent>
                          {etapas.map(et => (
                            <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="saida-prof">Professor(a)</Label>
                      <Select value={selectedProfId} onValueChange={setSelectedProfId}>
                        <SelectTrigger id="saida-prof" className="bg-white">
                          <SelectValue placeholder="Professor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {professoresFiltrados.map(pr => (
                            <SelectItem key={pr.id} value={pr.id}>{pr.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="saida-turma">Turma Destino</Label>
                      <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                        <SelectTrigger id="saida-turma" className="bg-white">
                          <SelectValue placeholder="Turma..." />
                        </SelectTrigger>
                        <SelectContent>
                          {turmasFiltradas.map(tr => (
                            <SelectItem key={tr.id} value={tr.id}>{tr.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <Label className="font-semibold block mb-1">Selecione os materiais a retirar:</Label>
                    <div className="space-y-2.5 max-h-52 overflow-y-auto border p-3 rounded-lg bg-gray-50">
                      {itens.map(i => (
                        <div key={i.id} className="flex justify-between items-center gap-4 bg-white p-2 border rounded shadow-2xs">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`check-${i.id}`}
                              checked={materiaisRetirados[i.id]?.selecionado || false}
                              onCheckedChange={(checked) => handleToggleMaterial(i.id, !!checked)}
                            />
                            <label htmlFor={`check-${i.id}`} className="text-xs font-bold leading-none cursor-pointer">
                              {i.nome} <span className="text-[10px] text-gray-500 font-normal">({i.qtdAtual} disp.)</span>
                            </label>
                          </div>

                          {materiaisRetirados[i.id]?.selecionado && (
                            <div className="flex items-center gap-1.5 w-24">
                              <Input
                                type="number"
                                size={5}
                                placeholder="Qtd..."
                                value={materiaisRetirados[i.id]?.qtd || ""}
                                onChange={(e) => handleQtdMaterialChange(i.id, e.target.value)}
                                className="h-7 text-xs bg-white text-right"
                              />
                              <span className="text-[10px] text-gray-500 font-medium">{i.unidade.toLowerCase()}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t">
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold">Salvar Retirada / Baixar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Botão de Abastecimento */}
          {itens.length > 0 && (
            <Dialog open={entradaOpen} onOpenChange={setEntradaOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold">
                  <Plus className="h-5 w-5" /> Registrar Entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle>Abastecimento de Almoxarifado</DialogTitle>
                  <DialogDescription>Adicione novas unidades de {formattedCategoryName.toLowerCase()} ao estoque.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEntradaEstoque} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="ins-item">Item do Almoxarifado</Label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger id="ins-item" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {itens.map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.nome} ({i.unidade})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ins-qtd">Quantidade a Adicionar</Label>
                    <Input
                      id="ins-qtd"
                      type="number"
                      placeholder="Ex: 100"
                      value={entradaQtd}
                      onChange={e => setEntradaQtd(e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ins-obs">Observação / Nota Fiscal / Origem</Label>
                    <Input
                      id="ins-obs"
                      placeholder="Ex: Nota Fiscal 2459 ou Reposição"
                      value={entradaObs}
                      onChange={e => setEntradaObs(e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  <DialogFooter className="pt-4 border-t">
                    <Button type="submit">Salvar Abastecimento</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="estoque" className="w-full">
        <TabsList className={`grid w-full bg-white border ${
          categoria === "nao_pedagogico" ? "grid-cols-3 max-w-2xl" : "grid-cols-4 max-w-4xl"
        }`}>
          <TabsTrigger value="estoque">Níveis de Estoque</TabsTrigger>
          <TabsTrigger value="pedidos" className={categoria === "nao_pedagogico" ? "hidden" : ""}>Pedidos de Projetos</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Movimentações</TabsTrigger>
          <TabsTrigger value="controle">Controle de Retiradas</TabsTrigger>
        </TabsList>

        {/* Aba 1: Níveis de Estoque */}
        <TabsContent value="estoque" className="space-y-6 pt-3">
          {itens.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Nenhum item cadastrado nesta categoria. Vá no menu "Cadastros" para registrar insumos.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itens.map(i => (
                <Card key={i.id} className={`shadow-sm border border-gray-200 ${isCritico(i) ? "border-red-300 bg-red-50/10 animate-pulse-subtle" : ""}`}>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg font-bold">{i.nome}</CardTitle>
                      <CardDescription>Categoria: {i.categoria === "pedagogico" ? "Pedagógico" : "Não Pedagógico"}</CardDescription>
                    </div>
                    <Package className="h-5 w-5 text-gray-500" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantidade Disponível</p>
                        <p className="text-3xl font-black text-gray-800">
                          {i.qtdAtual} <span className="text-xs font-normal text-muted-foreground">/ {i.qtdMax} {i.unidade}</span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-500">
                        {getPercent(i.qtdAtual, i.qtdMax)}% restante
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <Progress value={getPercent(i.qtdAtual, i.qtdMax)} className="h-2" />
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                        <span>Nível de Estoque</span>
                        {isCritico(i) && (
                          <span className="text-red-600 flex items-center gap-0.5 animate-bounce-subtle">
                            <AlertTriangle className="h-3 w-3" /> ESTOQUE CRÍTICO (&lt;15%)
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba 2: Pedidos de Projetos */}
        <TabsContent value="pedidos" className="pt-3">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Retiradas Solicitadas (Projetos Pedagógicos)</CardTitle>
              <CardDescription>Baixa no estoque integrada aos planos de aula aprovados.</CardDescription>
            </CardHeader>
            <CardContent>
              {solicitacoesMateriais.filter(r => r.status === "pendente").length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum pedido de material pendente.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {solicitacoesMateriais.filter(r => r.status === "pendente").map(r => (
                    <div key={r.id} className="p-4 border rounded-xl bg-gray-50/50 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">{r.projetoNome}</h4>
                          <span className="text-[8px] bg-amber-100 text-amber-800 font-extrabold uppercase px-1.5 py-0.5 rounded">pendente</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Professor: <strong>{r.profNome}</strong></p>
                        <p className="text-[10px] text-muted-foreground">Turmas: <strong>{r.turmas.join(", ")}</strong></p>
                        <div className="bg-white p-3 border rounded text-xs text-gray-700 font-mono mt-3">
                          {r.materiais}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEntregarMateriais(r)}
                        size="sm"
                        className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Check className="h-4 w-4" /> Registrar Entrega e Baixar Estoque
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Histórico de Movimentações */}
        <TabsContent value="historico" className="pt-3">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Histórico Geral de Movimentações</CardTitle>
              <CardDescription>Extrato detalhado de todas as entradas, saídas e ajustes no estoque.</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhuma movimentação registrada.</p>
              ) : (
                <div className="border rounded-xl overflow-hidden bg-white max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs text-left text-gray-500">
                    <thead className="text-[10px] text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Data/Hora</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-center">Tipo</th>
                        <th className="px-4 py-3 text-center">Qtd</th>
                        <th className="px-4 py-3">Observações / Vínculo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-gray-400">{log.data}</td>
                          <td className="px-4 py-2.5 font-bold text-gray-800">{log.itemName}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                              log.tipo === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {log.tipo}
                            </span>
                          </td>
                          <td className={`px-4 py-2.5 text-center font-extrabold ${log.qtd > 0 ? "text-green-600" : "text-red-600"}`}>
                            {log.qtd > 0 ? `+${log.qtd}` : log.qtd}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 font-medium max-w-[300px] truncate" title={log.obs}>
                            {log.obs} {log.profNome && `[Professor: ${log.profNome}]`} {log.turmaNome && `[Turma: ${log.turmaNome}]`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 4: Controle de Retiradas / Consumo */}
        <TabsContent value="controle" className="pt-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consumo por Turma */}
            <Card className="shadow-sm border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <TrendingUp className="h-5 w-5 text-primary" /> Consumo Acumulado por Turma
                </CardTitle>
                <CardDescription>Quantidade de insumos retirados agrupados por turma.</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(consumoPorTurma).length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum consumo registrado por turma.</p>
                ) : (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {Object.entries(consumoPorTurma).map(([turma, materiais]) => (
                      <div key={turma} className="p-3 border rounded-xl bg-gray-50 space-y-1.5">
                        <h4 className="font-extrabold text-sm text-gray-900">{turma}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(materiais).map(([item, qtd]) => (
                            <span key={item} className="text-[10px] bg-white border px-2 py-0.5 rounded font-mono font-bold text-gray-700">
                              {item}: {qtd}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consumo por Professor */}
            <Card className="shadow-sm border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <TrendingUp className="h-5 w-5 text-primary" /> Consumo Acumulado por Professor
                </CardTitle>
                <CardDescription>Quantidade de insumos retirados agrupados por docente.</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(consumoPorProfessor).length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum consumo registrado por professor.</p>
                ) : (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {Object.entries(consumoPorProfessor).map(([prof, materiais]) => (
                      <div key={prof} className="p-3 border rounded-xl bg-gray-50 space-y-1.5">
                        <h4 className="font-extrabold text-sm text-gray-900">{prof}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(materiais).map(([item, qtd]) => (
                            <span key={item} className="text-[10px] bg-white border px-2 py-0.5 rounded font-mono font-bold text-gray-700">
                              {item}: {qtd}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Histórico Consolidado de Saídas/Retiradas */}
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Histórico de Saídas e Entregas Diretas</CardTitle>
              <CardDescription>Extrato detalhado de retiradas feitas em sala.</CardDescription>
            </CardHeader>
            <CardContent>
              {logsSaida.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhuma retirada de material pedagógico registrada no histórico.</p>
              ) : (
                <div className="border rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs text-left text-gray-500">
                    <thead className="text-[10px] text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Data/Hora</th>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3 text-center">Qtd Retirada</th>
                        <th className="px-4 py-3">Professor(a)</th>
                        <th className="px-4 py-3">Etapa / Turma</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logsSaida.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-gray-400">{log.data}</td>
                          <td className="px-4 py-2.5 font-bold text-gray-800">{log.itemName}</td>
                          <td className="px-4 py-2.5 text-center text-red-600 font-extrabold">{log.qtd}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-700">{log.profNome}</td>
                          <td className="px-4 py-2.5 text-gray-500">{log.turmaNome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
