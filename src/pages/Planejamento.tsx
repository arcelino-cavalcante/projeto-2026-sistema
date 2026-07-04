import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, Pencil, BookOpen, AlertCircle } from "lucide-react";
import { uploadFileToStorage } from "../services/firebaseService";

interface PlanoAula {
  id: string;
  profId: string;
  profNome: string;
  titulo: string;
  etapaId: string;
  etapaNome: string;
  turmaId: string;
  turmaNome: string;
  disciplinaId: string;
  disciplinaNome: string;
  bnccCodes?: string;
  objetivos?: string;
  metodologia?: string;
  mes: string;
  bimestre: string;
  dataCriacao: string;
  tipoPlanejamento?: string; // "Semanal" | "Quinzenal" | "Sequência Didática"
  dataInicio?: string;
  dataFim?: string;
  fileName?: string;
}

import { useFirestoreCollection } from "../hooks/useFirestore";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { addDocument } from "../services/firebaseService";
import { db } from "../firebase";

export default function Planejamento() {
  const [planos, setPlanos] = useState<PlanoAula[]>([]);
  const [professor, setProfessor] = useState<any>(null);
  
  // Fontes de dados da coordenação
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);

  // Form states
  const [selectedEtapaId, setSelectedEtapaId] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState("");
  const [tipoPlanejamento, setTipoPlanejamento] = useState("Semanal");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Carregar dados em tempo real do Firestore
  const { data: etapasDB } = useFirestoreCollection<any>("etapas");
  const { data: turmasDB } = useFirestoreCollection<any>("turmas");
  const { data: disciplinasDB } = useFirestoreCollection<any>("disciplinas");
  const { data: planosDB } = useFirestoreCollection<any>("planejamentos");

  useEffect(() => {
    const sessao = sessionStorage.getItem("sessao_usuario");
    if (sessao) {
      const prof = JSON.parse(sessao);
      setProfessor(prof);
      if (prof.etapaIds?.length > 0) {
        setSelectedEtapaId(prof.etapaIds[0]);
      }
    }
  }, []);

  useEffect(() => {
    if (professor) {
      if (etapasDB) {
        setEtapas(etapasDB.filter((e: any) => professor.etapaIds?.includes(e.id)));
      }
      if (turmasDB) {
        setTurmas(turmasDB.filter((t: any) => professor.etapaIds?.includes(t.etapaId)));
      }
      if (disciplinasDB) {
        setDisciplinas(disciplinasDB.filter((d: any) => professor.disciplinaIds?.includes(d.id)));
      }
    }
  }, [professor, etapasDB, turmasDB, disciplinasDB]);

  useEffect(() => {
    if (planosDB && professor) {
      const meusPlanos = planosDB.filter((p: any) => p.profId === professor.id);
      setPlanos(meusPlanos);
    }
  }, [planosDB, professor]);

  // Filtrar turmas pela etapa selecionada
  const turmasFiltradas = turmas.filter(t => t.etapaId === selectedEtapaId);

  useEffect(() => {
    if (turmasFiltradas.length > 0) {
      setSelectedTurmaId(turmasFiltradas[0].id);
    } else {
      setSelectedTurmaId("");
    }
  }, [selectedEtapaId, etapas]);

  useEffect(() => {
    if (disciplinas.length > 0) {
      setSelectedDisciplinaId(disciplinas[0].id);
    }
  }, [disciplinas]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos em formato PDF são aceitos.");
        e.target.value = "";
        return;
      }
      setPdfFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEtapaId || !selectedTurmaId || !selectedDisciplinaId || !dataInicio || !dataFim || (!pdfFile && !fileName)) {
      toast.error("Por favor, preencha todos os campos e selecione o PDF do plano de aula.");
      return;
    }

    const etapa = etapas.find(et => et.id === selectedEtapaId);
    const turma = turmas.find(tr => tr.id === selectedTurmaId);
    const disc = disciplinas.find(d => d.id === selectedDisciplinaId);

    if (!etapa || !turma || !disc) {
      toast.error("Por favor, certifique-se de que selecionou Etapa, Turma e Disciplina corretas.");
      return;
    }

    const calculatedTitle = `Planejamento ${tipoPlanejamento} - ${disc.nome}`;

    // Auto-calcular mês e bimestre baseando-se na data de início para retrocompatibilidade
    const monthsPt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dateObj = new Date(dataInicio + "T00:00:00");
    const monthName = monthsPt[dateObj.getMonth()] || "Janeiro";
    const monthIndex = dateObj.getMonth();
    let calculatedBimestre = "1º Bimestre";
    if (monthIndex >= 9) calculatedBimestre = "4º Bimestre";
    else if (monthIndex >= 6) calculatedBimestre = "3º Bimestre";
    else if (monthIndex >= 3) calculatedBimestre = "2º Bimestre";

    toast.loading("Enviando plano de aula...", { id: "plan-upload" });

    try {
      // Upload do PDF se um novo arquivo foi selecionado
      let nameOfFile = fileName;
      if (pdfFile) {
        nameOfFile = await uploadFileToStorage(pdfFile, "planejamentos");
      }

      if (editingId) {
        await updateDoc(doc(db, "planejamentos", editingId), {
          titulo: calculatedTitle,
          etapaId: selectedEtapaId,
          etapaNome: etapa.nome,
          turmaId: selectedTurmaId,
          turmaNome: turma.nome,
          disciplinaId: selectedDisciplinaId,
          disciplinaNome: disc.nome,
          mes: monthName,
          bimestre: calculatedBimestre,
          tipoPlanejamento,
          dataInicio,
          dataFim,
          fileName: nameOfFile
        });
        setEditingId(null);
        toast.success("Plano de aula atualizado com sucesso!", { id: "plan-upload" });
      } else {
        const newPlano = {
          profId: professor?.id || "unknown",
          profNome: professor?.nome || "Professor",
          titulo: calculatedTitle,
          etapaId: selectedEtapaId,
          etapaNome: etapa.nome,
          turmaId: selectedTurmaId,
          turmaNome: turma.nome,
          disciplinaId: selectedDisciplinaId,
          disciplinaNome: disc.nome,
          mes: monthName,
          bimestre: calculatedBimestre,
          tipoPlanejamento,
          dataInicio,
          dataFim,
          fileName: nameOfFile,
          dataCriacao: new Date().toLocaleDateString("pt-BR")
        };
        await addDocument("planejamentos", newPlano);
        toast.success("Novo plano de aula registrado e enviado!", { id: "plan-upload" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao fazer upload do plano de aula no Firebase Storage.", { id: "plan-upload" });
    }

    setPdfFile(null);
    setFileName("");
    const fileInput = document.getElementById("plan-pdf") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleEdit = (p: PlanoAula) => {
    setEditingId(p.id);
    setSelectedEtapaId(p.etapaId);
    setSelectedTurmaId(p.turmaId);
    setSelectedDisciplinaId(p.disciplinaId);
    setTipoPlanejamento(p.tipoPlanejamento || "Semanal");
    setDataInicio(p.dataInicio || new Date().toISOString().split('T')[0]);
    setDataFim(p.dataFim || new Date().toISOString().split('T')[0]);
    setFileName(p.fileName || "");
    setPdfFile(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este plano de aula?")) {
      try {
        await deleteDoc(doc(db, "planejamentos", id));
        toast.success("Plano de aula removido.");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao excluir plano de aula.");
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTipoPlanejamento("Semanal");
    setDataInicio(new Date().toISOString().split('T')[0]);
    setDataFim(new Date().toISOString().split('T')[0]);
    setPdfFile(null);
    setFileName("");
    const fileInput = document.getElementById("plan-pdf") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Filtrar planos do professor ativo
  const meusPlanos = planos;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planejamento Pedagógico (BNCC)</h1>
        <p className="text-muted-foreground">Registre seus planos de aulas semanais especificando as habilidades da BNCC.</p>
      </div>

      <div className="space-y-6">
        {/* Form */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Plano de Aula" : "Novo Plano de Aula"}</CardTitle>
            <CardDescription>Insira os dados pedagógicos e relacione os códigos BNCC trabalhados.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="plan-etapa">Etapa</Label>
                  <Select value={selectedEtapaId} onValueChange={setSelectedEtapaId}>
                    <SelectTrigger id="plan-etapa" className="bg-white">
                      <SelectValue placeholder="Escolha a etapa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map(et => (
                        <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="plan-turma">Turma</Label>
                  <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                    <SelectTrigger id="plan-turma" className="bg-white">
                      <SelectValue placeholder="Escolha a turma..." />
                    </SelectTrigger>
                    <SelectContent>
                      {turmasFiltradas.map(tr => (
                        <SelectItem key={tr.id} value={tr.id}>{tr.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="plan-disc">Disciplina</Label>
                  <Select value={selectedDisciplinaId} onValueChange={setSelectedDisciplinaId}>
                    <SelectTrigger id="plan-disc" className="bg-white">
                      <SelectValue placeholder="Escolha a disciplina..." />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinas.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="plan-tipo">Tipo de Planejamento</Label>
                  <Select value={tipoPlanejamento} onValueChange={setTipoPlanejamento}>
                    <SelectTrigger id="plan-tipo" className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semanal">Semanal</SelectItem>
                      <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="Sequência Didática">Sequência Didática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="plan-inicio">Data de Início</Label>
                  <Input
                    id="plan-inicio"
                    type="date"
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="plan-fim">Data de Término</Label>
                  <Input
                    id="plan-fim"
                    type="date"
                    value={dataFim}
                    onChange={e => setDataFim(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-pdf">Arquivo do Planejamento (Apenas PDF)</Label>
                <Input
                  id="plan-pdf"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="bg-white cursor-pointer"
                />
                {fileName && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Arquivo selecionado: {fileName}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" className={editingId ? "w-48" : "w-full md:w-48"}>
                  {editingId ? "Salvar Alterações" : "Salvar e Enviar Plano"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader>
            <CardTitle>Meus Planos de Aula Salvos</CardTitle>
            <CardDescription>Histórico de planejamentos enviados à coordenação pedagógica.</CardDescription>
          </CardHeader>
          <CardContent>
            {meusPlanos.length === 0 ? (
              <div className="text-center py-8 border rounded-xl border-dashed bg-gray-50/50">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">Nenhum plano cadastrado neste bimestre.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {meusPlanos.map(p => (
                  <div key={p.id} className="p-4 border rounded-xl bg-white hover:shadow-2xs transition-shadow space-y-3 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-1.5">
                          <BookOpen className="h-4.5 w-4.5 text-primary" /> {p.titulo}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Etapa: <strong>{p.etapaNome}</strong> | Turma: <strong>{p.turmaNome}</strong> | Disciplina: <strong>{p.disciplinaNome}</strong>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                          {p.tipoPlanejamento || "Semanal"}
                        </span>
                        {(p.dataInicio && p.dataFim) ? (
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            Período: {new Date(p.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")} a {new Date(p.dataFim + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {p.bimestre} - {p.mes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium">
                      <div>
                        <strong className="text-gray-600 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Arquivo PDF:</strong>
                        <span className="text-emerald-700 font-bold block truncate">{p.fileName || "Nenhum arquivo enviado"}</span>
                      </div>
                      <div>
                        <strong className="text-gray-600 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Enviado em:</strong>
                        <span className="text-gray-600">{p.dataCriacao}</span>
                      </div>
                      {p.mes && p.bimestre && (
                        <div>
                          <strong className="text-gray-600 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Bimestre:</strong>
                          <span className="text-gray-600">{p.bimestre} ({p.mes})</span>
                        </div>
                      )}
                    </div>

                    {(p.objetivos || p.metodologia) && (
                      <div className="text-xs text-gray-700 space-y-1 border-t pt-2.5">
                        {p.objetivos && <p><strong>Objetivos:</strong> {p.objetivos}</p>}
                        {p.metodologia && <p><strong>Metodologia:</strong> {p.metodologia}</p>}
                      </div>
                    )}

                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
