import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  BookOpen,
  User,
  Users,
  GraduationCap,
  Calendar,
  Filter,
  Search,
  FileText,
  FileCheck2,
  ListFilter
} from "lucide-react";

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
  tipoPlanejamento?: string;
  dataInicio?: string;
  dataFim?: string;
  fileName?: string;
}

export default function CoordenacaoPlanejamentos() {
  const [planos, setPlanos] = useState<PlanoAula[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterProf, setFilterProf] = useState("todos");
  const [filterTurma, setFilterTurma] = useState("todas");
  const [filterDisciplina, setFilterDisciplina] = useState("todas");
  const [filterTipo, setFilterTipo] = useState("todos");

  useEffect(() => {
    // Carregar planos, professores, turmas e disciplinas
    const savedPlanos = JSON.parse(localStorage.getItem("professor_planejamentos") || "[]");
    const savedProfs = JSON.parse(localStorage.getItem("coordenacao_professores") || "[]");
    const savedTurmas = JSON.parse(localStorage.getItem("coordenacao_turmas") || "[]");
    const savedDisciplinas = JSON.parse(localStorage.getItem("coordenacao_disciplinas") || "[]");

    setPlanos(savedPlanos);
    setProfessores(savedProfs);
    setTurmas(savedTurmas);
    setDisciplinas(savedDisciplinas);
  }, []);

  // Filtrar planos de acordo com os inputs
  const planosFiltrados = planos.filter(p => {
    const matchSearch =
      search.trim() === "" ||
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      p.profNome.toLowerCase().includes(search.toLowerCase()) ||
      (p.bnccCodes && p.bnccCodes.toLowerCase().includes(search.toLowerCase())) ||
      (p.fileName && p.fileName.toLowerCase().includes(search.toLowerCase())) ||
      (p.objetivos && p.objetivos.toLowerCase().includes(search.toLowerCase()));

    const matchProf = filterProf === "todos" || p.profId === filterProf;
    const matchTurma = filterTurma === "todas" || p.turmaId === filterTurma;
    const matchDisc = filterDisciplina === "todas" || p.disciplinaId === filterDisciplina;
    const matchTipo = filterTipo === "todos" || p.tipoPlanejamento === filterTipo;

    return matchSearch && matchProf && matchTurma && matchDisc && matchTipo;
  });

  // Agrupamentos baseados nos planos FILTRADOS
  const planosPorProfessor = planosFiltrados.reduce<Record<string, { profNome: string; planos: PlanoAula[] }>>((acc, p) => {
    if (!acc[p.profId]) {
      acc[p.profId] = { profNome: p.profNome, planos: [] };
    }
    acc[p.profId].planos.push(p);
    return acc;
  }, {});

  const planosPorTurma = planosFiltrados.reduce<Record<string, { turmaNome: string; planos: PlanoAula[] }>>((acc, p) => {
    if (!acc[p.turmaId]) {
      acc[p.turmaId] = { turmaNome: p.turmaNome, planos: [] };
    }
    acc[p.turmaId].planos.push(p);
    return acc;
  }, {});

  // Estatísticas rápidas
  const totalPlanos = planos.length;
  const planosSemanal = planos.filter(p => p.tipoPlanejamento === "Semanal").length;
  const planosQuinzenal = planos.filter(p => p.tipoPlanejamento === "Quinzenal").length;
  const planosSequencia = planos.filter(p => p.tipoPlanejamento === "Sequência Didática").length;

  const handleOpenPdf = (filename: string) => {
    toast.success(`Abrindo o arquivo "${filename}" no visualizador de PDFs...`);
  };

  const renderPlanoCard = (plano: PlanoAula) => (
    <div key={plano.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-3 relative group">
      <div className="flex justify-between items-start">
        <div>
          <h5 className="font-extrabold text-base text-gray-950 flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-primary" /> {plano.titulo}
          </h5>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Professor(a): <strong>{plano.profNome}</strong> | Turma: <strong>{plano.turmaNome}</strong> | Disciplina: <strong>{plano.disciplinaNome}</strong>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
            {plano.tipoPlanejamento || "Semanal"}
          </span>
          {plano.dataInicio && plano.dataFim ? (
            <span className="text-[9px] text-muted-foreground font-semibold">
              Período: {new Date(plano.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")} a {new Date(plano.dataFim + "T00:00:00").toLocaleDateString("pt-BR")}
            </span>
          ) : (
            <span className="text-[9px] text-muted-foreground font-semibold">
              {plano.bimestre} - {plano.mes}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium items-center">
        <div className="md:col-span-2">
          <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Arquivo Anexo:</span>
          <span className="text-emerald-800 font-bold block truncate">{plano.fileName || "Nenhum PDF anexado"}</span>
        </div>
        <div className="flex justify-end">
          {plano.fileName && (
            <button
              onClick={() => handleOpenPdf(plano.fileName!)}
              className="text-xs flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2.5 py-1 rounded-md hover:bg-emerald-100 transition-colors"
            >
              <FileCheck2 className="h-4 w-4" /> Visualizar PDF
            </button>
          )}
        </div>
      </div>

      {(plano.bnccCodes || plano.objetivos || plano.metodologia) && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="detalhes" className="border-none">
            <AccordionTrigger className="py-1.5 text-xs text-indigo-600 hover:no-underline font-semibold justify-start gap-1">
              Ver Detalhes Pedagógicos Adicionais
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2 text-xs text-gray-750">
              {plano.bnccCodes && <p><strong>Habilidades BNCC:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">{plano.bnccCodes}</code></p>}
              {plano.objetivos && <p><strong>Objetivos:</strong> {plano.objetivos}</p>}
              {plano.metodologia && <p><strong>Metodologia:</strong> {plano.metodologia}</p>}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Histórico de Planejamentos</h1>
          <p className="text-muted-foreground">Monitore e gerencie os planejamentos pedagógicos enviados pelos professores.</p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs border-gray-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-600">Total Enviado</CardTitle>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{totalPlanos}</div>
            <p className="text-xs text-muted-foreground mt-1">Planos registrados no banco</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-600">Planejamentos Semanais</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Calendar className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">{planosSemanal}</div>
            <p className="text-xs text-muted-foreground mt-1">Aulas estruturadas semanalmente</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-600">Planejamentos Quinzenais</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-700">{planosQuinzenal}</div>
            <p className="text-xs text-muted-foreground mt-1">Aulas estruturadas quinzenalmente</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-600">Sequências Didáticas</CardTitle>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-700">{planosSequencia}</div>
            <p className="text-xs text-muted-foreground mt-1">Projetos de médio/longo prazo</p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Filtros */}
      <Card className="shadow-xs border-gray-200/80 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-primary" /> Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="search-input">Buscar por Termo</Label>
              <div className="relative">
                <Input
                  id="search-input"
                  placeholder="Busque por assunto, professor..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-prof">Professor</Label>
              <Select value={filterProf} onValueChange={setFilterProf}>
                <SelectTrigger id="filter-prof" className="bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Professores</SelectItem>
                  {professores.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-turma">Turma</Label>
              <Select value={filterTurma} onValueChange={setFilterTurma}>
                <SelectTrigger id="filter-turma" className="bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Turmas</SelectItem>
                  {turmas.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-disc">Disciplina</Label>
              <Select value={filterDisciplina} onValueChange={setFilterDisciplina}>
                <SelectTrigger id="filter-disc" className="bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Disciplinas</SelectItem>
                  {disciplinas.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-tipo">Tipo de Planejamento</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger id="filter-tipo" className="bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="Sequência Didática">Sequência Didática</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização de Dados */}
      <Tabs defaultValue="professores" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-4">
          <TabsTrigger value="professores" className="flex items-center gap-1.5">
            <User className="h-4 w-4" /> Por Professor
          </TabsTrigger>
          <TabsTrigger value="turmas" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Por Turma
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex items-center gap-1.5">
            <ListFilter className="h-4 w-4" /> Lista Geral
          </TabsTrigger>
        </TabsList>

        {/* POR PROFESSOR TAB */}
        <TabsContent value="professores">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Planejamentos por Professor</CardTitle>
              <CardDescription>Visualize o histórico expandindo o painel de cada docente.</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(planosPorProfessor).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Nenhum planejamento encontrado com os filtros atuais.</div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {Object.entries(planosPorProfessor).map(([profId, { profNome, planos: profPlanos }]) => (
                    <AccordionItem key={profId} value={profId} className="border rounded-xl px-4 bg-gray-50/50">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left">
                          <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                            {profNome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{profNome}</h4>
                            <p className="text-xs text-muted-foreground">{profPlanos.length} planejamento(s) enviado(s)</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-3">
                        {profPlanos.map(plano => renderPlanoCard(plano))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POR TURMA TAB */}
        <TabsContent value="turmas">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Planejamentos por Turma</CardTitle>
              <CardDescription>Acompanhe os planejamentos organizados por sala de aula.</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(planosPorTurma).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Nenhum planejamento encontrado com os filtros atuais.</div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {Object.entries(planosPorTurma).map(([turmaId, { turmaNome, planos: turmaPlanos }]) => (
                    <AccordionItem key={turmaId} value={turmaId} className="border rounded-xl px-4 bg-gray-50/50">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left">
                          <div className="h-9 w-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-sm">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{turmaNome}</h4>
                            <p className="text-xs text-muted-foreground">{turmaPlanos.length} planejamento(s) vinculado(s)</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-3">
                        {turmaPlanos.map(plano => renderPlanoCard(plano))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TODOS OS PLANOS TAB */}
        <TabsContent value="todos">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Histórico Geral de Envio</CardTitle>
              <CardDescription>Todos os planejamentos individuais listados em ordem cronológica de envio.</CardDescription>
            </CardHeader>
            <CardContent>
              {planosFiltrados.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Nenhum planejamento encontrado.</div>
              ) : (
                <div className="space-y-4">
                  {planosFiltrados.map(plano => renderPlanoCard(plano))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
