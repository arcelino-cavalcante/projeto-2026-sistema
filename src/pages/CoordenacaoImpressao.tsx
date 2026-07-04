import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, FileText, Printer, Calendar, User, Search, Award, TrendingUp, AlertTriangle, Filter, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestoreCollection } from "../hooks/useFirestore";

interface Solicitacao {
  id: string;
  profId: string;
  profNome: string;
  turmaId?: string;
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

interface EstudantePCD {
  id: string;
  nome: string;
  etapaId: string;
  etapaNome: string;
  turmaId: string;
  turmaNome: string;
  cid?: string;
  observacoes?: string;
  atividadesRecomendadas?: string;
}

export default function CoordenacaoImpressao() {
  const { data: solicitacoes = [] } = useFirestoreCollection<Solicitacao>("xerox_solicitacoes");
  const { data: pcdEstudantes = [] } = useFirestoreCollection<EstudantePCD>("pcd_estudantes");
  const { data: professores = [] } = useFirestoreCollection<any>("professores");
  const { data: etapas = [] } = useFirestoreCollection<any>("etapas");
  const { data: disciplinas = [] } = useFirestoreCollection<any>("disciplinas");

  // Filtros gerais e pesquisa
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filtros específicos da aba de acompanhamento PCD
  const [filtroEtapaId, setFiltroEtapaId] = useState("todas");
  const [filtroProfId, setFiltroProfId] = useState("todos");
  const [filtroDisciplinaId, setFiltroDisciplinaId] = useState("todas");

  // Modal de Visualização (Preview PDF)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);

  // Ordenar solicitações por data de envio (mais recentes primeiro)
  const solicitacoesOrdenadas = [...solicitacoes].sort((a, b) => Number(b.id) - Number(a.id));

  // Filtrar por nome do professor ou nome da turma (Aba Fila de Impressão)
  const filteredSolicitacoes = solicitacoesOrdenadas.filter(
    s =>
      s.profNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.turmaNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenPreview = (solicitacao: Solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setPreviewOpen(true);
  };

  // Simular perguntas fictícias baseadas no nome do arquivo ou assunto
  const renderMockPdfContent = (s: Solicitacao) => {
    const isMath = s.fileName.toLowerCase().includes("mat") || s.fileName.toLowerCase().includes("calculo");
    
    return (
      <div className="bg-white border shadow-md p-8 font-serif mx-auto max-w-[100%] min-h-[500px] text-gray-800 flex flex-col justify-between">
        {/* Cabeçalho Escolar */}
        <div className="border-b-2 border-gray-800 pb-4 text-center space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-wide">Escola Municipal de Ensino Fundamental</h2>
          <h3 className="text-xs uppercase font-semibold">Avaliação Diagnóstica Pedagógica</h3>
          <div className="grid grid-cols-2 text-left text-[11px] gap-2 pt-3">
            <div><strong>Professor(a):</strong> {s.profNome}</div>
            <div><strong>Turma:</strong> {s.turmaNome}</div>
            <div><strong>Estudante:</strong> ____________________________________</div>
            <div><strong>Data:</strong> {s.dataEnvio.split(" ")[0]}</div>
          </div>
        </div>

        {/* Conteúdo da Atividade */}
        <div className="py-6 space-y-6 flex-1 text-xs leading-relaxed">
          <div className="text-center font-bold text-sm uppercase underline">
            Atividade Temática: {s.fileName.replace(".pdf", "")}
          </div>
          
          <p className="text-[11px] text-gray-600 italic">
            Instruções: Leia atentamente as questões antes de responder. Responda à caneta azul ou preta. Evite rasuras.
          </p>

          {isMath ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <p className="font-bold">Questão 1. (EF05MA02) Resolva a operação abaixo e marque a alternativa correta:</p>
                <p className="pl-4">354 x 12 = ?</p>
                <p className="pl-4 text-gray-500">a) 4.248 &nbsp;&nbsp;&nbsp; b) 4.238 &nbsp;&nbsp;&nbsp; c) 3.980 &nbsp;&nbsp;&nbsp; d) 4.148</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold">Questão 2. Se uma sala de aula possui {s.estudantes} estudantes e faremos um projeto em duplas, quantas duplas serão formadas? Caso sobre um estudante sem dupla, indique na resposta.</p>
                <div className="h-12 border border-dashed rounded mt-1"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <p className="font-bold">Questão 1. Com base no assunto estudado em sala de aula, faça um breve resumo explicando as principais características observadas e discuta sua importância no cotidiano.</p>
                <div className="h-20 border border-dashed rounded mt-1"></div>
              </div>
              <div className="space-y-1">
                <p className="font-bold">Questão 2. Analise a frase abaixo e indique as classificações gramaticais dos termos destacados:</p>
                <p className="pl-4 italic">"A educação é a arma mais poderosa que você pode usar para mudar o mundo."</p>
                <div className="h-12 border border-dashed rounded mt-1"></div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé da folha */}
        <div className="border-t pt-2 text-center text-[9px] text-gray-400">
          Documento digitalizado para Xerox &copy; {new Date().getFullYear()} - Sistema de Apoio Pedagógico.
        </div>
      </div>
    );
  };

  // ==========================================
  // FILTRAGEM E CÁLCULO DE ACOMPANHAMENTO PCD
  // ==========================================
  
  // Lista de ID de turmas que de fato possuem estudantes PCD cadastrados
  const turmasComPcdIds = Array.from(new Set(pcdEstudantes.map(est => est.turmaId)));

  // Obter professores e disciplinas vinculados à etapa selecionada para popular os selects corretamente
  const professoresFiltradosSelect = filtroEtapaId === "todas"
    ? professores
    : professores.filter((p: any) => p.etapaIds?.includes(filtroEtapaId));

  // Filtrar as solicitações cujo destino é uma turma que tem PCD cadastrado
  const solicitacoesEmTurmasPcd = solicitacoes.filter(s => {
    // Busca se existe estudante PCD cadastrado na turma da solicitação
    const possuiPcd = pcdEstudantes.some(est => est.turmaNome.toLowerCase() === s.turmaNome.toLowerCase());
    if (!possuiPcd) return false;

    // Filtros adicionais da coordenação
    const prof = professores.find(p => p.nome === s.profNome);
    
    const matchEtapa = filtroEtapaId === "todas" || (prof && prof.etapaIds?.includes(filtroEtapaId));
    const matchProf = filtroProfId === "todos" || (prof && prof.id === filtroProfId);
    
    // Se houver filtro de disciplina, comparamos (como o s.fileName pode indicar a disciplina ou o prof lecionar a mesma)
    const matchDisc = filtroDisciplinaId === "todas" || (prof && prof.disciplinaIds?.includes(filtroDisciplinaId));

    return matchEtapa && matchProf && matchDisc;
  });

  // Métricas PCD
  const totalPrecisaAdaptar = solicitacoesEmTurmasPcd.length;
  const totalAdaptadas = solicitacoesEmTurmasPcd.filter(s => !!s.fileNameAdaptada).length;
  const taxaAdaptacao = totalPrecisaAdaptar > 0 ? Math.floor((totalAdaptadas / totalPrecisaAdaptar) * 100) : 0;

  // Gerar resumo por professor do seu histórico de inclusão
  const resumoProfessoresPcd: Record<string, { nome: string; enviadas: number; adaptadas: number; turmas: string[] }> = {};

  solicitacoesEmTurmasPcd.forEach(s => {
    if (!resumoProfessoresPcd[s.profNome]) {
      resumoProfessoresPcd[s.profNome] = { nome: s.profNome, enviadas: 0, adaptadas: 0, turmas: [] };
    }
    resumoProfessoresPcd[s.profNome].enviadas += 1;
    if (s.fileNameAdaptada) {
      resumoProfessoresPcd[s.profNome].adaptadas += 1;
    }
    if (!resumoProfessoresPcd[s.profNome].turmas.includes(s.turmaNome)) {
      resumoProfessoresPcd[s.profNome].turmas.push(s.turmaNome);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monitoramento de Impressões</h1>
        <p className="text-muted-foreground">Consulte e gerencie as atividades enviadas para Xerox e controle a adaptação de materiais PCD.</p>
      </div>

      <Tabs defaultValue="xerox" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-white border">
          <TabsTrigger value="xerox">Fila e Histórico Xerox</TabsTrigger>
          <TabsTrigger value="pcd" className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" /> Acompanhamento PCD
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FILA E HISTORICO GERAL */}
        <TabsContent value="xerox" className="space-y-6 pt-3">
          {/* Barra de Pesquisa */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por professor, turma ou arquivo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Histórico de Envios para Xerox</CardTitle>
              <CardDescription>Visualize o conteúdo das avaliações e atividades antes da impressão física.</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSolicitacoes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-medium">
                  Nenhuma solicitação de impressão encontrada.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSolicitacoes.map(s => (
                    <div key={s.id} className="p-4 border rounded-xl bg-white hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{s.profNome}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.status === "impresso" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                            {s.status === "impresso" ? "Impresso" : "Pendente"}
                          </span>
                          {s.fileNameAdaptada && (
                            <Badge className="bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-[9px] hover:bg-amber-150">
                              Adaptada PCD
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Printer className="h-3.5 w-3.5" /> Turma: <span className="font-semibold">{s.turmaNome}</span> | Cópias: <span className="font-semibold">{s.copias}</span>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-red-500" /> Arquivo: <span className="font-mono text-gray-700">{s.fileName}</span>
                        </p>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPreview(s)}
                          className="flex-1 md:flex-none flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Eye className="h-4 w-4" /> Visualizar Atividade
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ACOMPANHAMENTO PCD */}
        <TabsContent value="pcd" className="space-y-6 pt-3">
          {/* Painel de Filtros Pedagógicos */}
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-gray-800">
                <Filter className="h-4.5 w-4.5 text-primary" /> Filtros de Acompanhamento Curricular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600">Etapa de Ensino</Label>
                  <Select value={filtroEtapaId} onValueChange={setFiltroEtapaId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Todas as etapas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as etapas</SelectItem>
                      {etapas.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600">Professor lecionando</Label>
                  <Select value={filtroProfId} onValueChange={setFiltroProfId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Todos os professores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os professores</SelectItem>
                      {professoresFiltradosSelect.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600">Disciplina</Label>
                  <Select value={filtroDisciplinaId} onValueChange={setFiltroDisciplinaId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Todas as disciplinas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as disciplinas</SelectItem>
                      {disciplinas.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Indicadores de Inclusão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6 text-center space-y-1">
                <span className="text-xs font-bold text-gray-500 block uppercase">Avaliações em turmas PCD</span>
                <span className="text-3xl font-black text-gray-800 block">{totalPrecisaAdaptar}</span>
                <p className="text-[10px] text-gray-400">Total de atividades distintas enviadas para turmas com alunos PCD</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6 text-center space-y-1">
                <span className="text-xs font-bold text-gray-500 block uppercase">Atividades Adaptadas enviadas</span>
                <span className="text-3xl font-black text-amber-600 block">{totalAdaptadas}</span>
                <p className="text-[10px] text-gray-400">Materiais com anexo de PDF adaptado e configurações inclusivas</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6 text-center space-y-1">
                <span className="text-xs font-bold text-gray-500 block uppercase">Índice de Adaptação / Inclusão</span>
                <span className={`text-3xl font-black block ${taxaAdaptacao >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                  {taxaAdaptacao}%
                </span>
                <div className="px-6 pt-1">
                  <Progress value={taxaAdaptacao} className="h-2 bg-gray-100" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acompanhamento por Professor */}
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-1.5">
                <TrendingUp className="h-5 w-5 text-indigo-600" /> Índice de Adequação por Docente
              </CardTitle>
              <CardDescription>Acompanhe quais professores estão adaptando de fato as avaliações da escola.</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(resumoProfessoresPcd).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum envio registrado em turmas com PCD nos filtros ativos.</p>
              ) : (
                <div className="space-y-4">
                  {Object.values(resumoProfessoresPcd).map(item => {
                    const perc = item.enviadas > 0 ? Math.floor((item.adaptadas / item.enviadas) * 100) : 0;
                    return (
                      <div key={item.nome} className="p-4 border rounded-xl bg-white hover:bg-gray-50/50 transition-colors space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900">{item.nome}</h4>
                            <p className="text-[10px] text-muted-foreground">Turmas acompanhadas: <strong>{item.turmas.join(", ")}</strong></p>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${perc >= 80 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {perc}% de Adequação
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600 font-semibold">
                            <span>Atividades Adaptadas / Total Enviadas</span>
                            <span>{item.adaptadas} de {item.enviadas}</span>
                          </div>
                          <Progress value={perc} className="h-2 bg-gray-100" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Pré-visualização do PDF */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" /> Pré-visualização de Documento
            </DialogTitle>
            <DialogDescription className="truncate">
              Arquivo: <strong>{selectedSolicitacao?.fileName}</strong> | Professor: <strong>{selectedSolicitacao?.profNome}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Área de Visualização do PDF Simulada */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4 rounded-lg my-2 flex justify-center max-h-[60vh]">
            {selectedSolicitacao && renderMockPdfContent(selectedSolicitacao)}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            {selectedSolicitacao?.observacoes && (
              <div className="flex-1 text-left text-xs bg-amber-50 p-2.5 rounded text-amber-800 border border-amber-200/50 mr-auto self-stretch">
                <strong>Observações:</strong> {selectedSolicitacao.observacoes}
              </div>
            )}
            <div className="flex gap-2 self-end">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar Preview</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
