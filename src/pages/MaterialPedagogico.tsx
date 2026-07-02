import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, HardDrive, Plus, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { uploadFileToStorage } from "../services/firebaseService";

interface Reserva {
  id: string;
  data: string;
  equipamento: string;
  turno: "manha" | "tarde" | "noite";
  aula: number;
  profId: string;
  profNome: string;
  etapaNome: string;
}

interface SolicitacaoMaterial {
  id: string;
  profId: string;
  profNome: string;
  turmaNomes: string[];
  nomeProjeto: string;
  fileName: string;
  materiais: string;
  dataSolicitacao: string;
}

const EQUIPAMENTOS = [
  "Data show",
  "TV 1",
  "TV 2",
  "Caixa de som Bluetooth",
  "Caixa de som com Cabo",
  "Microfone"
];

export default function MaterialPedagogico() {
  const [professor, setProfessor] = useState<any>(null);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);

  // Agendamento States
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [currentTurno, setCurrentTurno] = useState<"manha" | "tarde" | "noite">("manha");
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana atual, 1 = próxima, -1 = anterior
  
  // Modal de Reservas
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ dayName: string; dateString: string } | null>(null);
  const [selectedAulas, setSelectedAulas] = useState<number[]>([]);
  const [selectedEquipamentos, setSelectedEquipamentos] = useState<string[]>([]);
  const [selectedEtapaId, setSelectedEtapaId] = useState("");

  // Solicitação Materiais States
  const [selectedTurmaIds, setSelectedTurmaIds] = useState<string[]>([]);
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [planoFile, setPlanoFile] = useState<File | null>(null);
  const [materiaisLista, setMateriaisLista] = useState("");

  const horarios = {
    manha: [
      { aula: 1, horario: "07:30 - 08:20" },
      { aula: 2, horario: "08:20 - 09:10" },
      { aula: 3, horario: "09:10 - 10:00" },
      { aula: 4, horario: "10:20 - 11:10" },
      { aula: 5, horario: "11:10 - 12:00" },
    ],
    tarde: [
      { aula: 1, horario: "13:00 - 13:50" },
      { aula: 2, horario: "13:50 - 14:40" },
      { aula: 3, horario: "14:40 - 15:30" },
      { aula: 4, horario: "15:50 - 16:40" },
      { aula: 5, horario: "16:40 - 17:30" },
    ],
    noite: [
      { aula: 1, horario: "19:00 - 19:45" },
      { aula: 2, horario: "19:45 - 20:30" },
      { aula: 3, horario: "20:45 - 21:30" },
      { aula: 4, horario: "21:30 - 22:15" },
    ],
  };

  useEffect(() => {
    // Carregar dados de sessão
    const sessao = localStorage.getItem("sessao_usuario");
    if (sessao) {
      const prof = JSON.parse(sessao);
      setProfessor(prof);

      // Carregar turmas vinculadas ao prof
      const todasTurmas = JSON.parse(localStorage.getItem("coordenacao_turmas") || "[]");
      const turmasFiltradas = todasTurmas.filter((t: any) => prof.etapaIds?.includes(t.etapaId));
      setTurmas(turmasFiltradas);

      // Carregar todas as etapas
      const todasEtapas = JSON.parse(localStorage.getItem("coordenacao_etapas") || "[]");
      const etapasFiltradas = todasEtapas.filter((e: any) => prof.etapaIds?.includes(e.id));
      setEtapas(etapasFiltradas);
      if (etapasFiltradas.length > 0) {
        setSelectedEtapaId(etapasFiltradas[0].id);
      }
    }

    // Carregar reservas existentes
    const salvas = localStorage.getItem("agendamentos_equipamentos");
    if (salvas) {
      setReservas(JSON.parse(salvas));
    }
  }, []);

  // Calcular datas da semana com base no offset
  const getWeekDates = () => {
    const referenceDate = new Date();
    // Somar/Subtrair semanas com base no offset
    referenceDate.setDate(referenceDate.getDate() + (weekOffset * 7));

    const currentDay = referenceDate.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(referenceDate);
    monday.setDate(referenceDate.getDate() + distanceToMonday);

    const dates = [];
    const daysOfWeek = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push({
        dayName: daysOfWeek[i],
        dateString: d.toISOString().split("T")[0],
        formattedDate: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Verificar se a data selecionada é no passado
  const isPastDate = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    return target < today;
  };

  // Abrir o modal para agendamento
  const handleCellClick = (dayInfo: { dayName: string; dateString: string }, initialAula: number) => {
    if (isPastDate(dayInfo.dateString)) {
      toast.error("Não é possível realizar reservas em datas retroativas.");
      return;
    }
    setSelectedDayInfo(dayInfo);
    setSelectedAulas([initialAula]);
    setSelectedEquipamentos([]);
    setModalOpen(true);
  };

  const handleToggleAula = (aulaNumber: number) => {
    setSelectedAulas(prev =>
      prev.includes(aulaNumber)
        ? prev.filter(a => a !== aulaNumber)
        : [...prev, aulaNumber]
    );
  };

  const handleToggleEquipamento = (equip: string) => {
    setSelectedEquipamentos(prev =>
      prev.includes(equip) ? prev.filter(e => e !== equip) : [...prev, equip]
    );
  };

  // Obter reservas de uma aula e equipamento específico em uma data
  const getReserva = (dateStr: string, turno: "manha" | "tarde" | "noite", aula: number, equip: string) => {
    return reservas.find(
      r => r.data === dateStr && r.equipamento === equip && r.turno === turno && r.aula === aula
    );
  };

  // Verificar quais equipamentos estão ocupados em QUALQUER uma das aulas selecionadas
  const getOcupadoInfoForEquip = (equip: string) => {
    if (!selectedDayInfo || selectedAulas.length === 0) return null;

    for (const aula of selectedAulas) {
      const res = getReserva(selectedDayInfo.dateString, currentTurno, aula, equip);
      if (res) {
        return { aula, profNome: res.profNome };
      }
    }
    return null;
  };

  const confirmReserva = () => {
    if (!selectedDayInfo || selectedAulas.length === 0 || selectedEquipamentos.length === 0 || !selectedEtapaId) {
      toast.error("Preencha todos os dados e selecione pelo menos um equipamento.");
      return;
    }

    const etapa = etapas.find(e => e.id === selectedEtapaId);

    // Criar registros para cada combinação de aula e equipamento selecionados
    const novasReservas: Reserva[] = [];
    
    // Validar se algum equipamento foi reservado por outro professor enquanto o modal estava aberto
    for (const equip of selectedEquipamentos) {
      const ocupado = getOcupadoInfoForEquip(equip);
      if (ocupado) {
        toast.error(`O equipamento ${equip} foi reservado por ${ocupado.profNome} na Aula ${ocupado.aula}.`);
        return;
      }
    }

    selectedAulas.forEach(aula => {
      selectedEquipamentos.forEach(equip => {
        novasReservas.push({
          id: `${Date.now()}-${aula}-${equip}`,
          data: selectedDayInfo.dateString,
          equipamento: equip,
          turno: currentTurno,
          aula: aula,
          profId: professor.id,
          profNome: professor.nome,
          etapaNome: etapa ? etapa.nome : "Etapa",
        });
      });
    });

    const atualizadas = [...reservas, ...novasReservas];
    setReservas(atualizadas);
    localStorage.setItem("agendamentos_equipamentos", JSON.stringify(atualizadas));
    setModalOpen(false);
    toast.success("Reserva(s) realizada(s) com sucesso!");
  };

  // Solicitação de materiais
  const handleToggleTurmaSelection = (turmaId: string) => {
    setSelectedTurmaIds(prev =>
      prev.includes(turmaId) ? prev.filter(id => id !== turmaId) : [...prev, turmaId]
    );
  };

  const handleSendSolicitacaoMateriais = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTurmaIds.length === 0 || !nomeProjeto.trim() || !materiaisLista.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const nomesTurmasSelecionadas = turmas
      .filter(t => selectedTurmaIds.includes(t.id))
      .map(t => t.nome);

    toast.loading("Enviando solicitação de materiais...", { id: "material-upload" });

    try {
      let fileUrl = "Nenhum arquivo anexado";
      if (planoFile) {
        fileUrl = await uploadFileToStorage(planoFile, "projetos");
      }

      const novaSolicitacao: SolicitacaoMaterial = {
        id: Date.now().toString(),
        profId: professor?.id || "unknown",
        profNome: professor?.nome || "Professor",
        turmaNomes: nomesTurmasSelecionadas,
        nomeProjeto: nomeProjeto,
        fileName: fileUrl, // URL de download seguro
        materiais: materiaisLista,
        dataSolicitacao: new Date().toLocaleDateString("pt-BR"),
      };

      const salvas = JSON.parse(localStorage.getItem("solicitacoes_materiais") || "[]");
      localStorage.setItem("solicitacoes_materiais", JSON.stringify([...salvas, novaSolicitacao]));

      setSelectedTurmaIds([]);
      setNomeProjeto("");
      setPlanoFile(null);
      setMateriaisLista("");
      const fileInput = document.getElementById("projeto-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      toast.success("Solicitação de materiais enviada com sucesso!", { id: "material-upload" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao fazer upload do plano/projeto.", { id: "material-upload" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Material Pedagógico</h1>
        <p className="text-muted-foreground">Tabela semanal de reservas de equipamentos e solicitações de materiais de apoio.</p>
      </div>

      <Tabs defaultValue="agendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="agendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Agendar Equipamento
          </TabsTrigger>
          <TabsTrigger value="solicitar" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Solicitar Materiais de Projetos
          </TabsTrigger>
        </TabsList>

        {/* ABA AGENDAR EQUIPAMENTO */}
        <TabsContent value="agendar" className="space-y-6">
          {/* Controles de navegação da semana e turno */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setWeekOffset(prev => prev - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-gray-700 min-w-[200px] text-center">
                Semana de {new Date(weekDates[0].dateString + "T00:00:00").toLocaleDateString("pt-BR")} a {new Date(weekDates[4].dateString + "T00:00:00").toLocaleDateString("pt-BR")}
              </span>
              <Button size="icon" variant="outline" onClick={() => setWeekOffset(prev => prev + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {weekOffset !== 0 && (
                <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)} className="text-xs">
                  Semana Atual
                </Button>
              )}
            </div>

            {/* Turnos */}
            <div className="flex border rounded-lg overflow-hidden bg-gray-100 p-0.5 self-center">
              {(["manha", "tarde", "noite"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setCurrentTurno(t)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                    currentTurno === t ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t === "manha" ? "Manhã" : t === "tarde" ? "Tarde" : "Noite"}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Agendamento Semanal */}
          <Card className="shadow-sm border-gray-200 overflow-x-auto">
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50/80 font-bold text-gray-700">
                  <tr>
                    <th className="px-4 py-4 text-left border-r w-32 shrink-0">Aulas</th>
                    {weekDates.map(wd => (
                      <th key={wd.dateString} className="px-4 py-4 text-center border-r last:border-r-0 min-w-[160px]">
                        <div className="text-sm font-bold">{wd.dayName}</div>
                        <div className="text-xs text-muted-foreground font-medium">{wd.formattedDate}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {horarios[currentTurno].map(h => (
                    <tr key={h.aula} className="hover:bg-gray-50/30">
                      {/* Identificação da Aula */}
                      <td className="px-4 py-4 font-semibold text-gray-800 border-r bg-gray-50/20">
                        <div className="text-sm">Aula {h.aula}</div>
                        <div className="text-[10px] text-muted-foreground font-normal mt-0.5">{h.horario}</div>
                      </td>

                      {/* Dias da semana para aquela aula */}
                      {weekDates.map(wd => {
                        const cellPast = isPastDate(wd.dateString);
                        // Contar quantos equipamentos estão ocupados
                        const ocupados = EQUIPAMENTOS.filter(eq => getReserva(wd.dateString, currentTurno, h.aula, eq));
                        const totalOcupados = ocupados.length;
                        const totalLivres = EQUIPAMENTOS.length - totalOcupados;

                        return (
                          <td
                            key={wd.dateString}
                            className={`p-2 border-r last:border-r-0 text-center align-top ${
                              cellPast ? "bg-gray-100/40 opacity-70" : ""
                            }`}
                          >
                            <div className="space-y-1.5 min-h-[90px] flex flex-col justify-between">
                              {/* Lista rápida de ocupações */}
                              <div className="space-y-1 text-left">
                                {EQUIPAMENTOS.map(eq => {
                                  const res = getReserva(wd.dateString, currentTurno, h.aula, eq);
                                  return res ? (
                                    <div key={eq} className="bg-red-50 text-[10px] text-red-700 px-1.5 py-0.5 rounded border border-red-100/60 truncate" title={`${eq}: ${res.profNome}`}>
                                      <strong>{eq.split(" ")[0]}:</strong> {res.profNome}
                                    </div>
                                  ) : null;
                                })}
                              </div>

                              <Button
                                size="sm"
                                variant={cellPast ? "secondary" : totalLivres === 0 ? "destructive" : "outline"}
                                disabled={cellPast || totalLivres === 0}
                                className={`w-full text-[10px] h-7 px-1 ${
                                  !cellPast && totalLivres > 0 ? "hover:bg-green-50 hover:text-green-800 hover:border-green-300" : ""
                                }`}
                                onClick={() => handleCellClick(wd, h.aula)}
                              >
                                {cellPast ? (
                                  "Passado"
                                ) : totalLivres === 0 ? (
                                  "Sem Recursos"
                                ) : (
                                  `${totalLivres} Livres`
                                )}
                              </Button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Modal de Agendamento Semanal */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agendamento Pedagógico Semanal</DialogTitle>
                <DialogDescription>
                  Configure sua reserva para <strong>{selectedDayInfo?.dayName}</strong> ({selectedDayInfo ? new Date(selectedDayInfo.dateString + "T00:00:00").toLocaleDateString("pt-BR") : ""}) no turno da <strong className="capitalize">{currentTurno}</strong>.
                </DialogDescription>
              </DialogHeader>

              {selectedDayInfo && (
                <div className="space-y-4 pt-2 text-sm">
                  {/* Escolha das Aulas */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Selecione a(s) Aula(s):</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {horarios[currentTurno].map(h => (
                        <div key={h.aula} className="flex items-center space-x-2 border p-2.5 rounded-lg bg-gray-50/50 hover:bg-gray-50 cursor-pointer">
                          <Checkbox
                            id={`modal-aula-${h.aula}`}
                            checked={selectedAulas.includes(h.aula)}
                            onCheckedChange={() => handleToggleAula(h.aula)}
                          />
                          <label htmlFor={`modal-aula-${h.aula}`} className="font-medium cursor-pointer">
                            Aula {h.aula}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Escolha dos Equipamentos */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Selecione os Equipamentos:</Label>
                    <div className="border rounded-lg divide-y divide-gray-100 bg-white overflow-hidden max-h-56 overflow-y-auto">
                      {EQUIPAMENTOS.map(eq => {
                        const ocupadoInfo = getOcupadoInfoForEquip(eq);
                        const isReserved = !!ocupadoInfo;

                        return (
                          <div key={eq} className={`flex items-center space-x-3 p-3 ${isReserved ? "bg-red-50/20 opacity-70" : "hover:bg-gray-50 cursor-pointer"}`}>
                            <Checkbox
                              id={`modal-equip-${eq}`}
                              disabled={isReserved}
                              checked={selectedEquipamentos.includes(eq)}
                              onCheckedChange={() => handleToggleEquipamento(eq)}
                            />
                            <div className="flex-1 flex justify-between items-center">
                              <label htmlFor={`modal-equip-${eq}`} className="font-medium cursor-pointer flex-1">
                                {eq}
                              </label>
                              {isReserved ? (
                                <span className="text-[10px] text-red-600 bg-red-100/50 px-1.5 py-0.5 rounded font-semibold">
                                  Reservado (Aula {ocupadoInfo.aula} por {ocupadoInfo.profNome})
                                </span>
                              ) : (
                                <span className="text-[10px] text-green-700 bg-green-100/50 px-1.5 py-0.5 rounded font-semibold">
                                  Livre
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Etapa de Ensino */}
                  <div className="space-y-2">
                    <Label htmlFor="etapaAgendamento">Selecione a Etapa Relacionada</Label>
                    <Select value={selectedEtapaId} onValueChange={setSelectedEtapaId}>
                      <SelectTrigger id="etapaAgendamento" className="bg-white">
                        <SelectValue placeholder="Escolha a etapa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {etapas.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Professor solicitante */}
                  <div className="space-y-2">
                    <Label>Professor Solicitante</Label>
                    <Input value={professor?.nome || ""} readOnly className="bg-gray-100 font-semibold" />
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button onClick={confirmReserva} disabled={selectedEquipamentos.length === 0 || selectedAulas.length === 0}>
                  Confirmar Agendamento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ABA SOLICITAR MATERIAIS */}
        <TabsContent value="solicitar">
          <Card>
            <CardHeader>
              <CardTitle>Solicitação de Materiais para Projetos</CardTitle>
              <CardDescription>Peça os insumos necessários para a realização de sequências didáticas e projetos de sala.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendSolicitacaoMateriais} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Turmas Solicitadas */}
                  <div className="space-y-3">
                    <Label className="font-semibold text-gray-700">Turmas Envolvidas (múltipla escolha)</Label>
                    {turmas.length === 0 ? (
                      <p className="text-sm text-red-500">Nenhuma turma cadastrada.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 border p-4 rounded-md bg-gray-50 max-h-36 overflow-y-auto">
                        {turmas.map(turma => (
                          <div key={turma.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`turma-material-${turma.id}`}
                              checked={selectedTurmaIds.includes(turma.id)}
                              onCheckedChange={() => handleToggleTurmaSelection(turma.id)}
                            />
                            <label htmlFor={`turma-material-${turma.id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {turma.nome}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nome do Projeto */}
                  <div className="space-y-2 flex flex-col justify-end">
                    <Label htmlFor="nomeProjeto">Nome do Projeto ou Sequência Didática</Label>
                    <Input
                      id="nomeProjeto"
                      placeholder="Ex: Semana do Meio Ambiente"
                      value={nomeProjeto}
                      onChange={e => setNomeProjeto(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plano de aula / projeto */}
                  <div className="space-y-2">
                    <Label htmlFor="projeto-file">Plano de Aula ou do Projeto (Anexo)</Label>
                    <Input
                      id="projeto-file"
                      type="file"
                      onChange={e => e.target.files && setPlanoFile(e.target.files[0])}
                      className="bg-white cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">Envie o documento descritivo do projeto pedagógico.</p>
                  </div>

                  {/* Lista de Materiais */}
                  <div className="space-y-2">
                    <Label htmlFor="materiais">Lista de Materiais Necessários</Label>
                    <Textarea
                      id="materiais"
                      placeholder="Ex: 5 cartolinas brancas, 3 colas líquidas, 2 caixas de giz de cera..."
                      value={materiaisLista}
                      onChange={e => setMateriaisLista(e.target.value)}
                      className="bg-white min-h-[80px]"
                    />
                  </div>
                </div>

                <Button type="submit">Enviar Solicitação de Materiais</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
