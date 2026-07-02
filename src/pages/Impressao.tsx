import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { uploadFileToStorage } from "../services/firebaseService";

type RequestType = "individual" | "dupla" | "trio" | "personalizado";

interface Solicitacao {
  id: string;
  profId: string;
  profNome: string;
  turmaId: string;
  turmaNome: string;
  estudantes: number;
  tipo: RequestType;
  copias: number;
  observacoes: string;
  fileName: string;
  status: "pendente" | "impresso";
  dataEnvio: string;
  fileNameAdaptada?: string;
  coloridaAdaptada?: boolean;
}

export default function Impressao() {
  const [professor, setProfessor] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [tipoCopia, setTipoCopia] = useState<RequestType>("individual");
  const [copiasPersonalizadas, setCopiasPersonalizadas] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // Estados para Estudantes PCD e atividades adaptadas
  const [pcdEstudantes, setPcdEstudantes] = useState<any[]>([]);
  const [enviarAdaptada, setEnviarAdaptada] = useState(false);
  const [pdfFileAdaptada, setPdfFileAdaptada] = useState<File | null>(null);
  const [coloridaAdaptada, setColoridaAdaptada] = useState(false);

  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);

  // Carregar dados da sessão e localStorage
  useEffect(() => {
    const sessao = localStorage.getItem("sessao_usuario");
    if (sessao) {
      const prof = JSON.parse(sessao);
      setProfessor(prof);

      // Carregar turmas e filtrar pelas etapas que o professor leciona
      const todasTurmas = JSON.parse(localStorage.getItem("coordenacao_turmas") || "[]");
      const turmasFiltradas = todasTurmas.filter((t: any) => prof.etapaIds?.includes(t.etapaId));
      setTurmas(turmasFiltradas);
    }

    // Carregar estudantes PCD
    setPcdEstudantes(JSON.parse(localStorage.getItem("coordenacao_pcd_estudantes") || "[]"));

    // Carregar todas as solicitações de impressão
    const salvas = localStorage.getItem("xerox_solicitacoes");
    if (salvas) {
      setSolicitacoes(JSON.parse(salvas));
    }
  }, []);

  // Salvar solicitações no localStorage
  useEffect(() => {
    if (solicitacoes.length > 0) {
      localStorage.setItem("xerox_solicitacoes", JSON.stringify(solicitacoes));
    }
  }, [solicitacoes]);

  // Encontrar turma selecionada para saber total de alunos
  const turmaSelecionada = turmas.find(t => t.id === selectedTurmaId);
  const totalAlunos = turmaSelecionada ? turmaSelecionada.estudantes : 0;

  // Calcular número total de cópias
  let calculoCopia = 0;
  if (tipoCopia === "individual") {
    calculoCopia = totalAlunos;
  } else if (tipoCopia === "dupla") {
    calculoCopia = Math.ceil(totalAlunos / 2);
  } else if (tipoCopia === "trio") {
    calculoCopia = Math.ceil(totalAlunos / 3);
  } else if (tipoCopia === "personalizado") {
    calculoCopia = parseInt(copiasPersonalizadas, 10) || 0;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Por favor, envie apenas arquivos em formato PDF.");
        e.target.value = "";
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurmaId) {
      toast.error("Selecione uma turma.");
      return;
    }
    if (tipoCopia === "personalizado" && (!copiasPersonalizadas || parseInt(copiasPersonalizadas, 10) <= 0)) {
      toast.error("Insira uma quantidade de cópias personalizada válida.");
      return;
    }
    if (!pdfFile) {
      toast.error("Por favor, anexe o arquivo PDF da atividade.");
      return;
    }
    if (enviarAdaptada && !pdfFileAdaptada) {
      toast.error("Você ativou o envio da atividade adaptada, mas não anexou o arquivo.");
      return;
    }

    toast.loading("Enviando arquivo(s) para o banco de dados...", { id: "upload-toast" });

    try {
      // 1. Fazer upload da atividade padrão
      const pdfUrl = await uploadFileToStorage(pdfFile, "atividades");
      
      // 2. Fazer upload da atividade adaptada se selecionada
      let pdfUrlAdaptada = undefined;
      if (enviarAdaptada && pdfFileAdaptada) {
        pdfUrlAdaptada = await uploadFileToStorage(pdfFileAdaptada, "adaptadas");
      }

      const novaSolicitacao: Solicitacao = {
        id: Date.now().toString(),
        profId: professor?.id || "unknown",
        profNome: professor?.nome || "Professor",
        turmaId: selectedTurmaId,
        turmaNome: turmaSelecionada?.nome || "Turma",
        estudantes: totalAlunos,
        tipo: tipoCopia,
        copias: calculoCopia,
        observacoes: observacoes,
        fileName: pdfUrl, // URL de download seguro
        status: "pendente",
        dataEnvio: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }),
        fileNameAdaptada: pdfUrlAdaptada,
        coloridaAdaptada: enviarAdaptada ? coloridaAdaptada : undefined
      };

      const atualizadas = [...solicitacoes, novaSolicitacao];
      setSolicitacoes(atualizadas);
      localStorage.setItem("xerox_solicitacoes", JSON.stringify(atualizadas));

      // Reset formulário
      setSelectedTurmaId("");
      setTipoCopia("individual");
      setCopiasPersonalizadas("");
      setObservacoes("");
      setPdfFile(null);
      setEnviarAdaptada(false);
      setPdfFileAdaptada(null);
      setColoridaAdaptada(false);
      
      const fileInput = document.getElementById("pdf-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      const fileInputPcd = document.getElementById("pdf-file-pcd") as HTMLInputElement;
      if (fileInputPcd) fileInputPcd.value = "";

      toast.success("Solicitação de impressão enviada com sucesso!", { id: "upload-toast" });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar arquivos para o Firebase Storage.", { id: "upload-toast" });
    }
  };

  // Simular alteração de status para testes de interface
  const handleSimulatePrint = (id: string) => {
    const atualizadas = solicitacoes.map(s => s.id === id ? { ...s, status: "impresso" as const } : s);
    setSolicitacoes(atualizadas);
    localStorage.setItem("xerox_solicitacoes", JSON.stringify(atualizadas));
    toast.success("Impressão simulada! A atividade foi marcada como impressa.");
  };

  // Filtrar solicitações do professor logado
  const enviadas = solicitacoes.filter(s => s.profId === professor?.id && s.status === "pendente");
  const impressas = solicitacoes.filter(s => s.profId === professor?.id && s.status === "impresso");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impressão de Atividades</h1>
          <p className="text-muted-foreground">Envie e acompanhe as solicitações de cópias para a Xerox.</p>
        </div>
      </div>

      <Tabs defaultValue="enviar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="enviar" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Enviar Atividade
          </TabsTrigger>
          <TabsTrigger value="enviados" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Enviados
            {enviadas.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {enviadas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="impressos" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Impressos
          </TabsTrigger>
        </TabsList>

        {/* ABA ENVIAR */}
        <TabsContent value="enviar">
          <Card>
            <CardHeader>
              <CardTitle>Nova Solicitação de Impressão</CardTitle>
              <CardDescription>Preencha os dados e envie a atividade para a fila de impressão.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seleção de Turma */}
                  <div className="space-y-2">
                    <Label htmlFor="turma">Selecione a Turma</Label>
                    <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                      <SelectTrigger id="turma" className="bg-white">
                        <SelectValue placeholder="Escolha a turma..." />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">Nenhuma turma disponível.</div>
                        ) : (
                          turmas.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {turmaSelecionada && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Esta turma possui <strong className="text-foreground">{totalAlunos}</strong> estudantes.
                        </p>
                        {pcdEstudantes.filter(est => est.turmaId === selectedTurmaId).length > 0 && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold">Turma com Estudante(s) PCD!</strong>
                              Esta turma possui estudante(s) com necessidades especiais cadastrado(s):
                              <ul className="list-disc list-inside mt-1 font-semibold">
                                {pcdEstudantes.filter(est => est.turmaId === selectedTurmaId).map(est => (
                                  <li key={est.id}>{est.nome} {est.cid ? `(CID: ${est.cid})` : ""}</li>
                                ))}
                              </ul>
                              <p className="mt-1.5 text-[10px] text-amber-700 font-bold">Por favor, prepare e envie uma atividade adaptada no campo abaixo.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seleção de Distribuição */}
                  <div className="space-y-3">
                    <Label>Modo de Distribuição</Label>
                    <RadioGroup 
                      value={tipoCopia} 
                      onValueChange={(val: RequestType) => setTipoCopia(val)}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="cursor-pointer">Individual</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="dupla" id="dupla" />
                        <Label htmlFor="dupla" className="cursor-pointer">Em dupla</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="trio" id="trio" />
                        <Label htmlFor="trio" className="cursor-pointer">Trio</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="personalizado" id="personalizado" />
                        <Label htmlFor="personalizado" className="cursor-pointer">Personalizado</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quantidade Calculada */}
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade de Cópias</Label>
                    {tipoCopia === "personalizado" ? (
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        placeholder="Digite a quantidade manual..."
                        value={copiasPersonalizadas}
                        onChange={e => setCopiasPersonalizadas(e.target.value)}
                        className="bg-white"
                      />
                    ) : (
                      <Input
                        id="quantidade"
                        type="number"
                        value={calculoCopia}
                        readOnly
                        className="bg-gray-100 font-semibold text-primary"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Calculado automaticamente com base na distribuição selecionada.
                    </p>
                  </div>

                  {/* Envio de Arquivo */}
                  <div className="space-y-2">
                    <Label htmlFor="pdf-file">Arquivo de Atividade (Apenas PDF)</Label>
                    <Input 
                      id="pdf-file" 
                      type="file" 
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="bg-white cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: <strong>.pdf</strong> apenas. Imagens não são permitidas.
                    </p>
                  </div>
                </div>

                {/* Atividade Adaptada PCD */}
                {selectedTurmaId && pcdEstudantes.filter(est => est.turmaId === selectedTurmaId).length > 0 && (
                  <div className="p-4 border border-amber-200 bg-amber-50/10 rounded-xl space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="enviar-adaptada" 
                        checked={enviarAdaptada} 
                        onCheckedChange={(checked: boolean) => setEnviarAdaptada(checked)} 
                      />
                      <Label htmlFor="enviar-adaptada" className="font-extrabold text-amber-950 cursor-pointer text-sm">
                        Enviar atividade adaptada especial para o(s) estudante(s) PCD?
                      </Label>
                    </div>

                    {enviarAdaptada && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 pt-1">
                        <div className="space-y-1">
                          <Label htmlFor="pdf-file-pcd" className="text-xs font-bold text-gray-700">Arquivo Adaptado (Apenas PDF)</Label>
                          <Input 
                            id="pdf-file-pcd" 
                            type="file" 
                            accept=".pdf"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                if (file.type !== "application/pdf") {
                                  toast.error("Por favor, envie apenas arquivos em formato PDF.");
                                  e.target.value = "";
                                  return;
                                }
                                setPdfFileAdaptada(file);
                              }
                            }}
                            className="bg-white cursor-pointer text-xs"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Checkbox 
                            id="colorida-adaptada" 
                            checked={coloridaAdaptada} 
                            onCheckedChange={(checked: boolean) => setColoridaAdaptada(checked)} 
                          />
                          <Label htmlFor="colorida-adaptada" className="font-bold text-xs text-gray-700 cursor-pointer">
                            Necessita de Impressão Colorida? (Recursos visuais coloridos)
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações para Impressão</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Escreva detalhes como: frente e verso, orientação horizontal, grampeado, etc."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <Button type="submit" className="w-full md:w-auto px-8">Enviar para Xerox</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA ENVIADOS */}
        <TabsContent value="enviados">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
              <CardDescription>Acompanhe suas solicitações aguardando impressão na Xerox.</CardDescription>
            </CardHeader>
            <CardContent>
              {enviadas.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">Nenhuma solicitação pendente no momento.</div>
              ) : (
                <div className="space-y-4">
                  {enviadas.map(s => (
                    <div key={s.id} className="p-4 border rounded-xl bg-white space-y-3 shadow-sm hover:shadow transition-shadow">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <h3 className="font-semibold text-lg text-primary">{s.turmaNome}</h3>
                          <p className="text-sm text-muted-foreground">Arquivo: <span className="font-mono text-xs">{s.fileName}</span></p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
                            Aguardando Impressão
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Distribuição</p>
                          <p className="font-medium capitalize">{s.tipo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Alunos</p>
                          <p className="font-medium">{s.estudantes}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Cópias</p>
                          <p className="font-bold text-primary">{s.copias}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Data Envio</p>
                          <p className="font-medium">{s.dataEnvio}</p>
                        </div>
                      </div>

                      {s.fileNameAdaptada && (
                        <div className="bg-amber-50/50 p-2.5 border border-amber-100 rounded text-sm text-amber-900 flex justify-between items-center">
                          <span>
                            <strong>Arquivo PCD Adaptado:</strong> <span className="font-mono text-xs">{s.fileNameAdaptada}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.coloridaAdaptada ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                            {s.coloridaAdaptada ? 'Impressão Colorida' : 'Preto e Branco'}
                          </span>
                        </div>
                      )}

                      {s.observacoes && (
                        <div className="bg-gray-50 p-2.5 rounded text-sm text-gray-700">
                          <strong>Obs:</strong> {s.observacoes}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleSimulatePrint(s.id)}
                          className="text-xs"
                        >
                          Simular Impressão (Fins de Teste)
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA IMPRESSOS */}
        <TabsContent value="impressos">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Impressos</CardTitle>
              <CardDescription>Veja as solicitações que já foram finalizadas pelo setor de xerox.</CardDescription>
            </CardHeader>
            <CardContent>
              {impressas.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">Nenhuma atividade impressa registrada.</div>
              ) : (
                <div className="space-y-4">
                  {impressas.map(s => (
                    <div key={s.id} className="p-4 border rounded-xl bg-gray-50 opacity-90 space-y-3">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{s.turmaNome}</h3>
                          <p className="text-sm text-muted-foreground">Arquivo: <span className="font-mono text-xs">{s.fileName}</span></p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Impresso
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Distribuição</p>
                          <p className="font-medium capitalize">{s.tipo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Alunos</p>
                          <p className="font-medium">{s.estudantes}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Cópias</p>
                          <p className="font-bold">{s.copias}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold text-green-700">Concluído em</p>
                          <p className="font-medium text-green-800">Pronto para retirar</p>
                        </div>
                      </div>
                      
                      {s.fileNameAdaptada && (
                        <div className="bg-amber-50/50 p-2.5 border border-amber-100 rounded text-sm text-amber-900 flex justify-between items-center">
                          <span>
                            <strong>Arquivo PCD Adaptado:</strong> <span className="font-mono text-xs">{s.fileNameAdaptada}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.coloridaAdaptada ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                            {s.coloridaAdaptada ? 'Impressão Colorida' : 'Preto e Branco'}
                          </span>
                        </div>
                      )}

                      {s.observacoes && (
                        <div className="bg-gray-200/50 p-2.5 rounded text-sm text-gray-700">
                          <strong>Obs:</strong> {s.observacoes}
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
