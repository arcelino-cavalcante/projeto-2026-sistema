import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2 } from "lucide-react";

type Etapa = { id: string; nome: string; };
type Turma = { id: string; nome: string; etapaId: string; estudantes: number; };
type Disciplina = { id: string; nome: string; };
type Professor = { id: string; nome: string; email: string; senha?: string; etapaIds: string[]; disciplinaIds: string[]; };

type EstudantePCD = {
  id: string;
  nome: string;
  etapaId: string;
  etapaNome: string;
  turmaId: string;
  turmaNome: string;
  cid?: string;
  observacoes?: string;
  atividadesRecomendadas?: string;
};

export default function CoordenacaoCadastros() {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [pcdEstudantes, setPcdEstudantes] = useState<EstudantePCD[]>([]);

  // Form states para PCD
  const [pcdNome, setPcdNome] = useState("");
  const [pcdEtapaId, setPcdEtapaId] = useState("");
  const [pcdTurmaId, setPcdTurmaId] = useState("");
  const [pcdCid, setPcdCid] = useState("");
  const [pcdObservacoes, setPcdObservacoes] = useState("");
  const [pcdAtividades, setPcdAtividades] = useState("");
  const [editingPcdId, setEditingPcdId] = useState<string | null>(null);

  // Carregar dados iniciais do LocalStorage
  useEffect(() => {
    const savedEtapas = localStorage.getItem("coordenacao_etapas");
    const savedTurmas = localStorage.getItem("coordenacao_turmas");
    const savedDisciplinas = localStorage.getItem("coordenacao_disciplinas");
    const savedProfessores = localStorage.getItem("coordenacao_professores");
    const savedPcd = localStorage.getItem("coordenacao_pcd_estudantes");

    if (savedEtapas) setEtapas(JSON.parse(savedEtapas));
    if (savedTurmas) setTurmas(JSON.parse(savedTurmas));
    if (savedDisciplinas) setDisciplinas(JSON.parse(savedDisciplinas));
    if (savedProfessores) setProfessores(JSON.parse(savedProfessores));
    if (savedPcd) setPcdEstudantes(JSON.parse(savedPcd));
  }, []);

  // Salvar no LocalStorage sempre que o estado mudar
  useEffect(() => {
    localStorage.setItem("coordenacao_etapas", JSON.stringify(etapas));
  }, [etapas]);

  useEffect(() => {
    localStorage.setItem("coordenacao_turmas", JSON.stringify(turmas));
  }, [turmas]);

  useEffect(() => {
    localStorage.setItem("coordenacao_disciplinas", JSON.stringify(disciplinas));
  }, [disciplinas]);

  useEffect(() => {
    localStorage.setItem("coordenacao_professores", JSON.stringify(professores));
  }, [professores]);

  useEffect(() => {
    localStorage.setItem("coordenacao_pcd_estudantes", JSON.stringify(pcdEstudantes));
  }, [pcdEstudantes]);

  // ==========================================
  // ETAPAS CRUD
  // ==========================================
  const [nomeEtapa, setNomeEtapa] = useState("");
  const [editingEtapaId, setEditingEtapaId] = useState<string | null>(null);

  const handleAddEtapa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEtapa.trim()) return;

    if (editingEtapaId) {
      setEtapas(etapas.map(et => et.id === editingEtapaId ? { ...et, nome: nomeEtapa } : et));
      setEditingEtapaId(null);
      toast.success("Etapa de ensino atualizada!");
    } else {
      const newEtapa = { id: Date.now().toString(), nome: nomeEtapa };
      setEtapas([...etapas, newEtapa]);
      toast.success("Etapa de ensino cadastrada!");
    }
    setNomeEtapa("");
  };

  const handleEditEtapa = (etapa: Etapa) => {
    setEditingEtapaId(etapa.id);
    setNomeEtapa(etapa.nome);
  };

  const handleDeleteEtapa = (id: string) => {
    if (confirm("Tem certeza? Isso excluirá todas as turmas associadas a essa etapa e removerá a associação dos professores.")) {
      setEtapas(etapas.filter(et => et.id !== id));
      setTurmas(turmas.filter(t => t.etapaId !== id));
      setProfessores(professores.map(p => ({
        ...p,
        etapaIds: p.etapaIds.filter(eId => eId !== id)
      })));
      toast.success("Etapa excluída e turmas limpas!");
    }
  };

  const cancelEditEtapa = () => {
    setEditingEtapaId(null);
    setNomeEtapa("");
  };

  // ==========================================
  // TURMAS CRUD
  // ==========================================
  const [nomeTurma, setNomeTurma] = useState("");
  const [selectedEtapaIdForTurma, setSelectedEtapaIdForTurma] = useState("");
  const [estudantesTurma, setEstudantesTurma] = useState("");
  const [editingTurmaId, setEditingTurmaId] = useState<string | null>(null);

  const handleAddTurma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeTurma.trim() || !selectedEtapaIdForTurma || !estudantesTurma) {
      toast.error("Preencha todos os campos da turma.");
      return;
    }
    const numEstudantes = parseInt(estudantesTurma, 10);
    if (isNaN(numEstudantes) || numEstudantes <= 0) {
      toast.error("A quantidade de estudantes deve ser maior que 0.");
      return;
    }

    if (editingTurmaId) {
      setTurmas(turmas.map(t => t.id === editingTurmaId ? {
        ...t,
        nome: nomeTurma,
        etapaId: selectedEtapaIdForTurma,
        estudantes: numEstudantes
      } : t));
      setEditingTurmaId(null);
      toast.success("Turma atualizada!");
    } else {
      const newTurma = {
        id: Date.now().toString(),
        nome: nomeTurma,
        etapaId: selectedEtapaIdForTurma,
        estudantes: numEstudantes
      };
      setTurmas([...turmas, newTurma]);
      toast.success("Turma cadastrada com sucesso!");
    }

    setNomeTurma("");
    setSelectedEtapaIdForTurma("");
    setEstudantesTurma("");
  };

  const handleEditTurma = (turma: Turma) => {
    setEditingTurmaId(turma.id);
    setNomeTurma(turma.nome);
    setSelectedEtapaIdForTurma(turma.etapaId);
    setEstudantesTurma(turma.estudantes.toString());
  };

  const handleDeleteTurma = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta turma?")) {
      setTurmas(turmas.filter(t => t.id !== id));
      toast.success("Turma excluída com sucesso.");
    }
  };

  const cancelEditTurma = () => {
    setEditingTurmaId(null);
    setNomeTurma("");
    setSelectedEtapaIdForTurma("");
    setEstudantesTurma("");
  };

  // ==========================================
  // DISCIPLINAS CRUD
  // ==========================================
  const [nomeDisciplina, setNomeDisciplina] = useState("");
  const [editingDisciplinaId, setEditingDisciplinaId] = useState<string | null>(null);

  const handleAddDisciplina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeDisciplina.trim()) return;

    if (editingDisciplinaId) {
      setDisciplinas(disciplinas.map(d => d.id === editingDisciplinaId ? { ...d, nome: nomeDisciplina } : d));
      setEditingDisciplinaId(null);
      toast.success("Disciplina atualizada!");
    } else {
      const newDisc = { id: Date.now().toString(), nome: nomeDisciplina };
      setDisciplinas([...disciplinas, newDisc]);
      toast.success("Disciplina cadastrada!");
    }
    setNomeDisciplina("");
  };

  const handleEditDisciplina = (disc: Disciplina) => {
    setEditingDisciplinaId(disc.id);
    setNomeDisciplina(disc.nome);
  };

  const handleDeleteDisciplina = (id: string) => {
    if (confirm("Tem certeza? Isso removerá a associação desta disciplina em todos os professores.")) {
      setDisciplinas(disciplinas.filter(d => d.id !== id));
      setProfessores(professores.map(p => ({
        ...p,
        disciplinaIds: (p.disciplinaIds || []).filter(dId => dId !== id)
      })));
      toast.success("Disciplina excluída.");
    }
  };

  const cancelEditDisciplina = () => {
    setEditingDisciplinaId(null);
    setNomeDisciplina("");
  };

  // ==========================================
  // PROFESSORES CRUD
  // ==========================================
  const [nomeProfessor, setNomeProfessor] = useState("");
  const [emailProfessor, setEmailProfessor] = useState("");
  const [senhaProfessor, setSenhaProfessor] = useState("");
  const [selectedEtapasForProf, setSelectedEtapasForProf] = useState<string[]>([]);
  const [selectedDisciplinasForProf, setSelectedDisciplinasForProf] = useState<string[]>([]);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);

  const handleToggleEtapaForProf = (etapaId: string) => {
    setSelectedEtapasForProf(prev => 
      prev.includes(etapaId) ? prev.filter(id => id !== etapaId) : [...prev, etapaId]
    );
  };

  const handleToggleDisciplinaForProf = (discId: string) => {
    setSelectedDisciplinasForProf(prev => 
      prev.includes(discId) ? prev.filter(id => id !== discId) : [...prev, discId]
    );
  };

  const handleAddProfessor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProfessor.trim() || !emailProfessor.trim() || selectedEtapasForProf.length === 0 || selectedDisciplinasForProf.length === 0) {
      toast.error("Preencha todos os campos e selecione pelo menos uma etapa e uma disciplina.");
      return;
    }

    const finalPassword = senhaProfessor.trim() || "12345";

    if (editingProfId) {
      setProfessores(professores.map(p => p.id === editingProfId ? {
        ...p,
        nome: nomeProfessor,
        email: emailProfessor,
        senha: finalPassword,
        etapaIds: selectedEtapasForProf,
        disciplinaIds: selectedDisciplinasForProf
      } : p));
      setEditingProfId(null);
      toast.success("Cadastro do professor atualizado!");
    } else {
      const newProf: Professor = {
        id: Date.now().toString(),
        nome: nomeProfessor,
        email: emailProfessor,
        senha: finalPassword,
        etapaIds: selectedEtapasForProf,
        disciplinaIds: selectedDisciplinasForProf
      };
      setProfessores([...professores, newProf]);
      toast.success(`Professor cadastrado com sucesso! Senha: ${finalPassword}`);
    }

    setNomeProfessor("");
    setEmailProfessor("");
    setSenhaProfessor("");
    setSelectedEtapasForProf([]);
    setSelectedDisciplinasForProf([]);
  };

  const handleEditProfessor = (prof: Professor) => {
    setEditingProfId(prof.id);
    setNomeProfessor(prof.nome);
    setEmailProfessor(prof.email);
    setSenhaProfessor(prof.senha || "12345");
    setSelectedEtapasForProf(prof.etapaIds);
    setSelectedDisciplinasForProf(prof.disciplinaIds || []);
  };

  const handleDeleteProfessor = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este professor?")) {
      setProfessores(professores.filter(p => p.id !== id));
      toast.success("Professor excluído.");
    }
  };

  const cancelEditProfessor = () => {
    setEditingProfId(null);
    setNomeProfessor("");
    setEmailProfessor("");
    setSenhaProfessor("");
    setSelectedEtapasForProf([]);
    setSelectedDisciplinasForProf([]);
  };

  // ==========================================
  // ESTUDANTES PCD CRUD
  // ==========================================
  const handleAddPcd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pcdNome.trim() || !pcdEtapaId || !pcdTurmaId) {
      toast.error("Por favor, preencha Nome, Etapa e Turma do estudante.");
      return;
    }

    const etapa = etapas.find(et => et.id === pcdEtapaId);
    const turma = turmas.find(tr => tr.id === pcdTurmaId);

    if (!etapa || !turma) {
      toast.error("Erro ao selecionar Etapa/Turma.");
      return;
    }

    if (editingPcdId) {
      setPcdEstudantes(pcdEstudantes.map(p =>
        p.id === editingPcdId ? {
          ...p,
          nome: pcdNome,
          etapaId: pcdEtapaId,
          etapaNome: etapa.nome,
          turmaId: pcdTurmaId,
          turmaNome: turma.nome,
          cid: pcdCid,
          observacoes: pcdObservacoes,
          atividadesRecomendadas: pcdAtividades
        } : p
      ));
      setEditingPcdId(null);
      toast.success("Dados do estudante PCD atualizados!");
    } else {
      const newPcd: EstudantePCD = {
        id: Date.now().toString(),
        nome: pcdNome,
        etapaId: pcdEtapaId,
        etapaNome: etapa.nome,
        turmaId: pcdTurmaId,
        turmaNome: turma.nome,
        cid: pcdCid,
        observacoes: pcdObservacoes,
        atividadesRecomendadas: pcdAtividades
      };
      setPcdEstudantes([...pcdEstudantes, newPcd]);
      toast.success("Estudante PCD cadastrado!");
    }

    // Reset
    setPcdNome("");
    setPcdCid("");
    setPcdObservacoes("");
    setPcdAtividades("");
  };

  const handleEditPcd = (est: EstudantePCD) => {
    setEditingPcdId(est.id);
    setPcdNome(est.nome);
    setPcdEtapaId(est.etapaId);
    setPcdTurmaId(est.turmaId);
    setPcdCid(est.cid || "");
    setPcdObservacoes(est.observacoes || "");
    setPcdAtividades(est.atividadesRecomendadas || "");
  };

  const handleDeletePcd = (id: string) => {
    if (confirm("Deseja realmente remover este estudante PCD?")) {
      setPcdEstudantes(pcdEstudantes.filter(p => p.id !== id));
      toast.success("Estudante PCD excluído.");
    }
  };

  const cancelEditPcd = () => {
    setEditingPcdId(null);
    setPcdNome("");
    setPcdCid("");
    setPcdObservacoes("");
    setPcdAtividades("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
      <p className="text-muted-foreground">Gerencie as etapas de ensino, turmas, disciplinas e professores do sistema.</p>

      <Tabs defaultValue="etapas" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="etapas">Etapas de Ensino</TabsTrigger>
          <TabsTrigger value="turmas">Turmas</TabsTrigger>
          <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
          <TabsTrigger value="professores">Professores</TabsTrigger>
          <TabsTrigger value="pcd">Estudantes PCD</TabsTrigger>
        </TabsList>

        {/* ABA ETAPAS */}
        <TabsContent value="etapas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingEtapaId ? "Editar Etapa de Ensino" : "Nova Etapa de Ensino"}</CardTitle>
              <CardDescription>Cadastre as etapas, como Educação Infantil, Ensino Fundamental, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEtapa} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="nomeEtapa">Nome da Etapa</Label>
                  <Input 
                    id="nomeEtapa" 
                    placeholder="Ex: Ensino Fundamental I" 
                    value={nomeEtapa} 
                    onChange={e => setNomeEtapa(e.target.value)} 
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingEtapaId ? "Atualizar" : "Adicionar"}</Button>
                  {editingEtapaId && (
                    <Button type="button" variant="outline" onClick={cancelEditEtapa}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etapas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {etapas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada.</p>
              ) : (
                <ul className="space-y-2">
                  {etapas.map(etapa => (
                    <li key={etapa.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
                      <span>{etapa.nome}</span>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handleEditEtapa(etapa)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeleteEtapa(etapa.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA TURMAS */}
        <TabsContent value="turmas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingTurmaId ? "Editar Turma" : "Nova Turma"}</CardTitle>
              <CardDescription>Crie turmas e vincule-as a uma etapa de ensino existente.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTurma} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="etapaTurma">Etapa de Ensino</Label>
                  <Select value={selectedEtapaIdForTurma} onValueChange={setSelectedEtapaIdForTurma}>
                    <SelectTrigger id="etapaTurma" className="bg-white">
                      <SelectValue placeholder="Selecione uma etapa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map(etapa => (
                        <SelectItem key={etapa.id} value={etapa.id}>{etapa.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeTurma">Nome da Turma</Label>
                  <Input 
                    id="nomeTurma" 
                    placeholder="Ex: 1º Ano A" 
                    value={nomeTurma} 
                    onChange={e => setNomeTurma(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estudantesTurma">Quantidade de Alunos</Label>
                  <Input 
                    id="estudantesTurma" 
                    type="number"
                    min="1"
                    placeholder="Ex: 30" 
                    value={estudantesTurma} 
                    onChange={e => setEstudantesTurma(e.target.value)} 
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingTurmaId ? "Atualizar Turma" : "Adicionar Turma"}</Button>
                  {editingTurmaId && (
                    <Button type="button" variant="outline" onClick={cancelEditTurma}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Turmas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {turmas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada.</p>
              ) : (
                <ul className="space-y-2">
                  {turmas.map(turma => {
                    const etapa = etapas.find(e => e.id === turma.etapaId);
                    return (
                      <li key={turma.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
                        <div>
                          <span className="font-medium">{turma.nome}</span>
                          <span className="text-sm text-muted-foreground ml-3">
                            ({turma.estudantes} {turma.estudantes === 1 ? 'estudante' : 'estudantes'})
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                            {etapa ? etapa.nome : "Etapa desconhecida"}
                          </span>
                          <div className="flex gap-1 border-l pl-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handleEditTurma(turma)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeleteTurma(turma.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA DISCIPLINAS */}
        <TabsContent value="disciplinas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingDisciplinaId ? "Editar Disciplina" : "Nova Disciplina"}</CardTitle>
              <CardDescription>Cadastre as disciplinas lecionadas na escola (Matemática, Geografia, etc.).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDisciplina} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="nomeDisciplina">Nome da Disciplina</Label>
                  <Input 
                    id="nomeDisciplina" 
                    placeholder="Ex: Língua Portuguesa" 
                    value={nomeDisciplina} 
                    onChange={e => setNomeDisciplina(e.target.value)} 
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingDisciplinaId ? "Atualizar" : "Adicionar"}</Button>
                  {editingDisciplinaId && (
                    <Button type="button" variant="outline" onClick={cancelEditDisciplina}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disciplinas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {disciplinas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada.</p>
              ) : (
                <ul className="space-y-2">
                  {disciplinas.map(disc => (
                    <li key={disc.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
                      <span>{disc.nome}</span>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handleEditDisciplina(disc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeleteDisciplina(disc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA PROFESSORES */}
        <TabsContent value="professores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingProfId ? "Editar Professor" : "Novo Professor"}</CardTitle>
              <CardDescription>
                Cadastre ou edite professores, definindo etapas e disciplinas vinculadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProfessor} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeProfessor">Nome Completo</Label>
                    <Input 
                      id="nomeProfessor" 
                      placeholder="Ex: Maria Souza" 
                      value={nomeProfessor} 
                      onChange={e => {
                        const val = e.target.value;
                        setNomeProfessor(val);
                        if (!editingProfId) {
                          const clean = val
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]/g, "");
                          setEmailProfessor(clean ? `${clean}@eliel` : "");
                        }
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailProfessor">E-mail (Login)</Label>
                    <Input 
                      id="emailProfessor" 
                      type="text"
                      placeholder="Ex: maria@eliel" 
                      value={emailProfessor} 
                      onChange={e => setEmailProfessor(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senhaProfessor">Senha de Acesso</Label>
                    <Input 
                      id="senhaProfessor" 
                      type="text"
                      placeholder="Senha Padrão: 12345" 
                      value={senhaProfessor} 
                      onChange={e => setSenhaProfessor(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Seleção de Etapas */}
                  <div className="space-y-3">
                    <Label className="font-semibold">Etapas que leciona (múltipla escolha):</Label>
                    {etapas.length === 0 ? (
                      <p className="text-sm text-red-500">Cadastre etapas primeiro.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 border p-4 rounded-md bg-gray-50 max-h-48 overflow-y-auto">
                        {etapas.map(etapa => (
                          <div key={etapa.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`etapa-${etapa.id}`} 
                              checked={selectedEtapasForProf.includes(etapa.id)}
                              onCheckedChange={() => handleToggleEtapaForProf(etapa.id)}
                            />
                            <label htmlFor={`etapa-${etapa.id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {etapa.nome}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Seleção de Disciplinas */}
                  <div className="space-y-3">
                    <Label className="font-semibold">Disciplinas que leciona (múltipla escolha):</Label>
                    {disciplinas.length === 0 ? (
                      <p className="text-sm text-red-500">Cadastre disciplinas primeiro.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 border p-4 rounded-md bg-gray-50 max-h-48 overflow-y-auto">
                        {disciplinas.map(disc => (
                          <div key={disc.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`disc-${disc.id}`} 
                              checked={selectedDisciplinasForProf.includes(disc.id)}
                              onCheckedChange={() => handleToggleDisciplinaForProf(disc.id)}
                            />
                            <label htmlFor={`disc-${disc.id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {disc.nome}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">{editingProfId ? "Atualizar Cadastro" : "Cadastrar Professor"}</Button>
                  {editingProfId && (
                    <Button type="button" variant="outline" onClick={cancelEditProfessor}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professores Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {professores.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum professor cadastrado.</p>
              ) : (
                <ul className="space-y-3">
                  {professores.map(prof => (
                    <li key={prof.id} className="p-4 border rounded-md bg-white space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{prof.nome}</p>
                          <p className="text-sm text-muted-foreground">Login: {prof.email} | Senha: <strong className="font-mono">{prof.senha || "12345"}</strong></p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handleEditProfessor(prof)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeleteProfessor(prof.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-bold text-gray-700 block mb-1">Etapas:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {prof.etapaIds?.map(eId => {
                              const etapa = etapas.find(e => e.id === eId);
                              return (
                                <span key={eId} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                  {etapa ? etapa.nome : "Etapa desconhecida"}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700 block mb-1">Disciplinas:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(prof.disciplinaIds || []).map(dId => {
                              const disc = disciplinas.find(d => d.id === dId);
                              return (
                                <span key={dId} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                                  {disc ? disc.nome : "Disciplina desconhecida"}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA ESTUDANTES PCD */}
        <TabsContent value="pcd" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-sm border-gray-200 bg-white">
              <CardHeader>
                <CardTitle>{editingPcdId ? "Editar Estudante PCD" : "Novo Estudante PCD"}</CardTitle>
                <CardDescription>Cadastre as informações de apoio aos alunos com necessidades especiais.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPcd} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="pcd-nome">Nome Completo</Label>
                    <Input
                      id="pcd-nome"
                      placeholder="Ex: João da Silva Santos"
                      value={pcdNome}
                      onChange={e => setPcdNome(e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="pcd-etapa">Etapa</Label>
                      <Select 
                        value={pcdEtapaId} 
                        onValueChange={val => {
                          setPcdEtapaId(val);
                          const filtered = turmas.filter(t => t.etapaId === val);
                          if (filtered.length > 0) {
                            setPcdTurmaId(filtered[0].id);
                          } else {
                            setPcdTurmaId("");
                          }
                        }}
                      >
                        <SelectTrigger id="pcd-etapa" className="bg-white">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {etapas.map(et => (
                            <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pcd-turma">Turma</Label>
                      <Select value={pcdTurmaId} onValueChange={setPcdTurmaId}>
                        <SelectTrigger id="pcd-turma" className="bg-white">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.filter(t => t.etapaId === pcdEtapaId).map(tr => (
                            <SelectItem key={tr.id} value={tr.id}>{tr.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pcd-cid">Código CID (Opcional)</Label>
                    <Input
                      id="pcd-cid"
                      placeholder="Ex: F84.0"
                      value={pcdCid}
                      onChange={e => setPcdCid(e.target.value)}
                      className="bg-white uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pcd-obs">Dificuldades / Diagnóstico</Label>
                    <Textarea
                      id="pcd-obs"
                      placeholder="Descreva as dificuldades identificadas e necessidades especiais..."
                      value={pcdObservacoes}
                      onChange={e => setPcdObservacoes(e.target.value)}
                      className="bg-white text-xs h-16 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pcd-ativid">Atividades Recomendadas / Sugestões</Label>
                    <Textarea
                      id="pcd-ativid"
                      placeholder="Ex: Letras grandes, apoio visual colorido, provas orais..."
                      value={pcdAtividades}
                      onChange={e => setPcdAtividades(e.target.value)}
                      className="bg-white text-xs h-16 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingPcdId ? "Salvar Alterações" : "Salvar Cadastro"}
                    </Button>
                    {editingPcdId && (
                      <Button type="button" variant="outline" onClick={cancelEditPcd}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm border-gray-200 bg-white">
              <CardHeader>
                <CardTitle>Estudantes PCD Cadastrados</CardTitle>
                <CardDescription>Lista de alunos que necessitam de apoio pedagógico e materiais adaptados.</CardDescription>
              </CardHeader>
              <CardContent>
                {pcdEstudantes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum estudante PCD cadastrado.</p>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {pcdEstudantes.map(est => (
                      <div key={est.id} className="p-4 border rounded-xl bg-white hover:shadow-2xs transition-shadow relative group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-extrabold text-base text-gray-900">{est.nome}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Etapa: <strong>{est.etapaNome}</strong> | Turma: <strong>{est.turmaNome}</strong>
                            </p>
                          </div>
                          {est.cid && (
                            <span className="text-[10px] bg-red-50 border border-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full font-mono">
                              CID: {est.cid}
                            </span>
                          )}
                        </div>

                        {(est.observacoes || est.atividadesRecomendadas) && (
                          <div className="mt-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                            {est.observacoes && (
                              <p className="text-gray-700"><strong>Dificuldades/Diagnóstico:</strong> {est.observacoes}</p>
                            )}
                            {est.atividadesRecomendadas && (
                              <p className="text-indigo-900"><strong>Sugestões/Atividades:</strong> {est.atividadesRecomendadas}</p>
                            )}
                          </div>
                        )}

                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEditPcd(est)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDeletePcd(est.id)}>
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
        </TabsContent>

      </Tabs>
    </div>
  );
}
