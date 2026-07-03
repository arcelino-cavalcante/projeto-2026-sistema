import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShieldAlert, Award, FileText, Image as ImageIcon, Calendar } from "lucide-react";
import { uploadFileToStorage, addDocument } from "../services/firebaseService";
import { useFirestoreCollection } from "../hooks/useFirestore";

export default function BancoAtividades() {
  const { data: todasTurmas } = useFirestoreCollection("turmas");
  const { data: todasDisciplinas } = useFirestoreCollection("disciplinas");
  const [professor, setProfessor] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);

  // Form de Emergência
  const [emergenciaTurmaId, setEmergenciaTurmaId] = useState("");
  const [emergenciaDisciplinaId, setEmergenciaDisciplinaId] = useState("");
  const [emergenciaAssunto, setEmergenciaAssunto] = useState("");
  const [emergenciaPdf, setEmergenciaPdf] = useState<File | null>(null);

  // Form de Exitosas
  const [exitosaTurmaId, setExitosaTurmaId] = useState("");
  const [exitosaDisciplinaId, setExitosaDisciplinaId] = useState("");
  const [exitosaData, setExitosaData] = useState("");
  const [exitosaNome, setExitosaNome] = useState("");
  const [exitosaObjetivo, setExitosaObjetivo] = useState("");
  const [exitosaHabilidade, setExitosaHabilidade] = useState("");
  const [exitosaDescricao, setExitosaDescricao] = useState("");
  const [exitosaResultados, setExitosaResultados] = useState("");
  const [exitosaArquivos, setExitosaArquivos] = useState<File[]>([]);

  // Carregar dados de sessão e filtros
  useEffect(() => {
    const sessao = localStorage.getItem("sessao_usuario");
    if (sessao) {
      setProfessor(JSON.parse(sessao));
    }
    // Setar data do dia
    setExitosaData(new Date().toLocaleDateString("pt-BR"));
  }, []);

  useEffect(() => {
    if (professor) {
      if (todasTurmas) {
        const turmasFiltradas = todasTurmas.filter((t: any) => professor.etapaIds?.includes(t.etapaId));
        setTurmas(turmasFiltradas);
      }
      if (todasDisciplinas) {
        const discFiltradas = todasDisciplinas.filter((d: any) => professor.disciplinaIds?.includes(d.id));
        setDisciplinas(discFiltradas);
      }
    }
  }, [professor, todasTurmas, todasDisciplinas]);

  // Handler do arquivo PDF de emergência
  const handleEmergenciaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos em formato PDF são aceitos.");
        e.target.value = "";
        return;
      }
      setEmergenciaPdf(file);
    }
  };

  // Handler dos arquivos anexos das práticas exitosas
  const handleExitosaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const invalid = filesArray.some(f => f.type !== "application/pdf" && !f.type.startsWith("image/"));
      if (invalid) {
        toast.error("Selecione apenas arquivos PDF ou Imagens.");
        e.target.value = "";
        return;
      }
      setExitosaArquivos(filesArray);
    }
  };

  // Submissão de Emergência
  // Submissão de Emergência
  const handleSendEmergencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergenciaTurmaId || !emergenciaDisciplinaId || !emergenciaAssunto.trim() || !emergenciaPdf) {
      toast.error("Por favor, preencha todos os campos e selecione o PDF.");
      return;
    }

    const turma = turmas.find(t => t.id === emergenciaTurmaId);
    const disc = disciplinas.find(d => d.id === emergenciaDisciplinaId);

    toast.loading("Enviando atividade de emergência...", { id: "emergencia-upload" });

    try {
      const pdfUrl = await uploadFileToStorage(emergenciaPdf, "emergencias");

      const novaAtividade = {
        id: Date.now().toString(),
        profId: professor?.id,
        profNome: professor?.nome,
        turmaId: emergenciaTurmaId,
        turmaNome: turma?.nome || "Turma",
        disciplinaId: emergenciaDisciplinaId,
        disciplinaNome: disc?.nome || "Disciplina",
        assunto: emergenciaAssunto,
        fileName: pdfUrl, // URL segura de download
        dataEnvio: new Date().toLocaleDateString("pt-BR")
      };

      await addDocument("atividades_emergencia", novaAtividade);

      setEmergenciaTurmaId("");
      setEmergenciaDisciplinaId("");
      setEmergenciaAssunto("");
      setEmergenciaPdf(null);
      const input = document.getElementById("pdf-emergencia") as HTMLInputElement;
      if (input) input.value = "";

      toast.success("Atividade de Emergência enviada com sucesso!", { id: "emergencia-upload" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao fazer upload da atividade de emergência.", { id: "emergencia-upload" });
    }
  };

  // Submissão de Exitosas
  const handleSendExitosa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !exitosaTurmaId ||
      !exitosaDisciplinaId ||
      !exitosaData.trim() ||
      !exitosaNome.trim() ||
      !exitosaObjetivo.trim() ||
      !exitosaHabilidade.trim() ||
      !exitosaDescricao.trim() ||
      !exitosaResultados.trim()
    ) {
      toast.error("Preencha todos os campos obrigatórios da atividade.");
      return;
    }

    const turma = turmas.find(t => t.id === exitosaTurmaId);
    const disc = disciplinas.find(d => d.id === exitosaDisciplinaId);

    toast.loading("Enviando prática exitosa e arquivos...", { id: "exitosa-upload" });

    try {
      // Upload de todos os arquivos em paralelo
      const uploadPromises = exitosaArquivos.map(file => uploadFileToStorage(file, "exitosas"));
      const downloadUrls = await Promise.all(uploadPromises);

      const metadataArquivos = exitosaArquivos.map((file, idx) => ({
        name: downloadUrls[idx], // URL de download
        originalName: file.name,
        type: file.type
      }));

      const novaPratica = {
        id: Date.now().toString(),
        profId: professor?.id,
        profNome: professor?.nome,
        turmaId: exitosaTurmaId,
        turmaNome: turma?.nome || "Turma",
        disciplinaId: exitosaDisciplinaId,
        disciplinaNome: disc?.nome || "Disciplina",
        data: exitosaData,
        nome: exitosaNome,
        objetivo: exitosaObjetivo,
        habilidade: exitosaHabilidade,
        descricao: exitosaDescricao,
        resultados: exitosaResultados,
        files: metadataArquivos
      };

      await addDocument("atividades_exitosas", novaPratica);

      setExitosaTurmaId("");
      setExitosaDisciplinaId("");
      setExitosaNome("");
      setExitosaObjetivo("");
      setExitosaHabilidade("");
      setExitosaDescricao("");
      setExitosaResultados("");
      setExitosaArquivos([]);
      const input = document.getElementById("arquivos-exitosas") as HTMLInputElement;
      if (input) input.value = "";

      toast.success("Prática Exitosa cadastrada com sucesso!", { id: "exitosa-upload" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao fazer upload da prática exitosa no Firebase Storage.", { id: "exitosa-upload" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banco de Atividades</h1>
          <p className="text-muted-foreground">Cadastre atividades pedagógicas no repositório escolar.</p>
        </div>
      </div>

      <Tabs defaultValue="emergencia" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="emergencia" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Atividades de Emergência
          </TabsTrigger>
          <TabsTrigger value="exitosas" className="flex items-center gap-2">
            <Award className="h-4 w-4" /> Práticas Exitosas
          </TabsTrigger>
        </TabsList>

        {/* ATIVIDADE DE EMERGÊNCIA */}
        <TabsContent value="emergencia">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Atividade de Emergência</CardTitle>
              <CardDescription>
                Esta atividade ficará disponível para a coordenação aplicar em turmas caso você precise se ausentar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendEmergencia} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergenciaTurma">Selecione a Turma</Label>
                    <Select value={emergenciaTurmaId} onValueChange={setEmergenciaTurmaId}>
                      <SelectTrigger id="emergenciaTurma" className="bg-white">
                        <SelectValue placeholder="Escolha a turma..." />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.length === 0 ? (
                          <div className="p-2 text-sm text-center text-muted-foreground">Nenhuma turma cadastrada</div>
                        ) : (
                          turmas.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergenciaDisciplina">Disciplina</Label>
                    <Select value={emergenciaDisciplinaId} onValueChange={setEmergenciaDisciplinaId}>
                      <SelectTrigger id="emergenciaDisciplina" className="bg-white">
                        <SelectValue placeholder="Escolha a disciplina..." />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinas.length === 0 ? (
                          <div className="p-2 text-sm text-center text-muted-foreground">Nenhuma disciplina cadastrada</div>
                        ) : (
                          disciplinas.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergenciaAssunto">Assunto da Atividade</Label>
                  <Input
                    id="emergenciaAssunto"
                    placeholder="Ex: Frações e números decimais"
                    value={emergenciaAssunto}
                    onChange={e => setEmergenciaAssunto(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pdf-emergencia">Arquivo da Atividade (Apenas PDF)</Label>
                  <Input
                    id="pdf-emergencia"
                    type="file"
                    accept=".pdf"
                    onChange={handleEmergenciaFileChange}
                    className="bg-white cursor-pointer"
                  />
                </div>

                <Button type="submit">Enviar Atividade de Emergência</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRÁTICAS EXITOSAS */}
        <TabsContent value="exitosas">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Prática Exitosa</CardTitle>
              <CardDescription>
                Compartilhe projetos, dinâmicas e atividades que deram muito certo com seus estudantes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendExitosa} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exitosaTurma">Selecione a Turma</Label>
                    <Select value={exitosaTurmaId} onValueChange={setExitosaTurmaId}>
                      <SelectTrigger id="exitosaTurma" className="bg-white">
                        <SelectValue placeholder="Escolha a turma..." />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exitosaDisciplina">Disciplina</Label>
                    <Select value={exitosaDisciplinaId} onValueChange={setExitosaDisciplinaId}>
                      <SelectTrigger id="exitosaDisciplina" className="bg-white">
                        <SelectValue placeholder="Escolha a disciplina..." />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinas.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exitosaData">Data do Registro</Label>
                    <div className="relative">
                      <Input
                        id="exitosaData"
                        value={exitosaData}
                        onChange={e => setExitosaData(e.target.value)}
                        placeholder="Ex: DD/MM/AAAA"
                      />
                      <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitosaNome">Nome da Atividade / Projeto</Label>
                  <Input
                    id="exitosaNome"
                    placeholder="Ex: Feira de Ciências Sustentável"
                    value={exitosaNome}
                    onChange={e => setExitosaNome(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exitosaObjetivo">Objetivo Pedagógico</Label>
                    <Textarea
                      id="exitosaObjetivo"
                      placeholder="Quais eram as metas dessa atividade?"
                      value={exitosaObjetivo}
                      onChange={e => setExitosaObjetivo(e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exitosaHabilidade">Conteúdo / Habilidade (BNCC)</Label>
                    <Textarea
                      id="exitosaHabilidade"
                      placeholder="Ex: (EF06MA01) Identificar números inteiros..."
                      value={exitosaHabilidade}
                      onChange={e => setExitosaHabilidade(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitosaDescricao">Descrição da Atividade</Label>
                  <Textarea
                    id="exitosaDescricao"
                    placeholder="Descreva passo a passo como a atividade foi conduzida em sala de aula..."
                    value={exitosaDescricao}
                    onChange={e => setExitosaDescricao(e.target.value)}
                    className="bg-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitosaResultados">Resultados Observados</Label>
                  <Textarea
                    id="exitosaResultados"
                    placeholder="Quais foram os impactos da atividade? Como os alunos reagiram?"
                    value={exitosaResultados}
                    onChange={e => setExitosaResultados(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arquivos-exitosas">Fotos e PDFs de Evidências (Múltiplos)</Label>
                  <Input
                    id="arquivos-exitosas"
                    type="file"
                    multiple
                    accept=".pdf, image/*"
                    onChange={handleExitosaFilesChange}
                    className="bg-white cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">Você pode anexar vários arquivos de imagens e PDFs simultaneamente.</p>
                </div>

                <Button type="submit">Registrar Prática Exitosa</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
