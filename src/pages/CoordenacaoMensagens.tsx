import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Send, Clock, Users, Mail, FileText, Link2, ExternalLink } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { addDocument } from "../services/firebaseService";

interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  alvo: "todos" | "etapa" | "etapa_disciplina" | "professores";
  etapaId?: string;
  etapaNome?: string;
  disciplinaId?: string;
  disciplinaNome?: string;
  profIds?: string[];
  profNomes?: string[];
  dataEnvio: string;
  visualizadaPor?: string[];
  anexoNome?: string;
  linkTexto?: string;
  linkUrl?: string;
}

export default function CoordenacaoMensagens() {
  const { data: etapas } = useFirestoreCollection<any>("etapas");
  const { data: disciplinas } = useFirestoreCollection<any>("disciplinas");
  const { data: professores } = useFirestoreCollection<any>("professores");
  const { data: historico } = useFirestoreCollection<Notification>("notificacoes");

  // Form States
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [alvo, setAlvo] = useState<"todos" | "etapa" | "etapa_disciplina" | "professores">("todos");
  const [selectedEtapaId, setSelectedEtapaId] = useState("");
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState("");
  const [selectedProfIds, setSelectedProfIds] = useState<string[]>([]);
  
  // Anexos e Links estruturados
  const [anexoNome, setAnexoNome] = useState("");
  const [linkTexto, setLinkTexto] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleToggleProf = (profId: string) => {
    setSelectedProfIds(prev =>
      prev.includes(profId) ? prev.filter(id => id !== profId) : [...prev, profId]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error("Preencha o título e a mensagem.");
      return;
    }

    if (alvo === "etapa" && !selectedEtapaId) {
      toast.error("Selecione a etapa de destino.");
      return;
    }
    if (alvo === "etapa_disciplina" && (!selectedEtapaId || !selectedDisciplinaId)) {
      toast.error("Selecione a etapa e a disciplina de destino.");
      return;
    }
    if (alvo === "professores" && selectedProfIds.length === 0) {
      toast.error("Selecione pelo menos um professor destinatário.");
      return;
    }

    if (linkUrl && !linkUrl.startsWith("http://") && !linkUrl.startsWith("https://")) {
      toast.error("O endereço do link deve começar com http:// ou https://");
      return;
    }

    const etapa = etapas.find(et => et.id === selectedEtapaId);
    const disciplina = disciplinas.find(d => d.id === selectedDisciplinaId);
    const profs = professores.filter(p => selectedProfIds.includes(p.id));

    const novaNotificacao = {
      titulo,
      mensagem,
      alvo,
      etapaId: selectedEtapaId || null,
      etapaNome: etapa ? etapa.nome : null,
      disciplinaId: selectedDisciplinaId || null,
      disciplinaNome: disciplina ? disciplina.nome : null,
      profIds: selectedProfIds.length > 0 ? selectedProfIds : null,
      profNomes: profs.length > 0 ? profs.map((p: any) => p.nome) : null,
      dataEnvio: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      visualizadaPor: [],
      anexoNome: anexoNome || null,
      linkTexto: linkUrl ? (linkTexto || "Acessar Link") : null,
      linkUrl: linkUrl || null
    };

    try {
      await addDocument("notificacoes", novaNotificacao);

      // Reset Form
      setTitulo("");
      setMensagem("");
      setAlvo("todos");
      setSelectedEtapaId("");
      setSelectedDisciplinaId("");
      setSelectedProfIds([]);
      setAnexoNome("");
      setLinkTexto("");
      setLinkUrl("");
      
      // Limpar input de arquivo fisicamente
      const fileInput = document.getElementById("anexo") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      toast.success("Mensagem enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar mensagem.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comunicados e Mensagens</h1>
        <p className="text-muted-foreground">Envie comunicados gerais ou direcionados para as caixas de notificação dos professores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enviar Mensagem */}
        <Card className="lg:col-span-1 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Nova Mensagem</CardTitle>
            <CardDescription>Escreva e defina os destinatários do aviso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-5">
              {/* Alvo / Destinatários */}
              <div className="space-y-2">
                <Label htmlFor="alvo">Destinatários</Label>
                <Select value={alvo} onValueChange={(val: any) => setAlvo(val)}>
                  <SelectTrigger id="alvo" className="bg-white">
                    <SelectValue placeholder="Selecione o grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Professores</SelectItem>
                    <SelectItem value="etapa">Por Etapa de Ensino</SelectItem>
                    <SelectItem value="etapa_disciplina">Por Disciplina em uma Etapa</SelectItem>
                    <SelectItem value="professores">Professores Específicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros Condicionais */}
              {alvo === "etapa" && (
                <div className="space-y-2">
                  <Label htmlFor="etapaSelect">Etapa de Ensino</Label>
                  <Select value={selectedEtapaId} onValueChange={setSelectedEtapaId}>
                    <SelectTrigger id="etapaSelect" className="bg-white">
                      <SelectValue placeholder="Selecione a etapa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {alvo === "etapa_disciplina" && (
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="etapaSelectD">Etapa de Ensino</Label>
                    <Select value={selectedEtapaId} onValueChange={setSelectedEtapaId}>
                      <SelectTrigger id="etapaSelectD" className="bg-white">
                        <SelectValue placeholder="Selecione a etapa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {etapas.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discSelectD">Disciplina</Label>
                    <Select value={selectedDisciplinaId} onValueChange={setSelectedDisciplinaId}>
                      <SelectTrigger id="discSelectD" className="bg-white">
                        <SelectValue placeholder="Selecione a disciplina..." />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinas.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {alvo === "professores" && (
                <div className="space-y-2">
                  <Label>Selecione os Professores</Label>
                  <div className="border rounded-md bg-gray-50 p-3 max-h-36 overflow-y-auto space-y-1.5">
                    {professores.map(p => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dest-prof-${p.id}`}
                          checked={selectedProfIds.includes(p.id)}
                          onCheckedChange={() => handleToggleProf(p.id)}
                        />
                        <label htmlFor={`dest-prof-${p.id}`} className="text-xs font-medium cursor-pointer">
                          {p.nome}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Comunicado</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Reunião de Planejamento"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* Mensagem normal */}
              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem / Conteúdo</Label>
                <Textarea
                  id="mensagem"
                  placeholder="Escreva a mensagem ou comunicado..."
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  className="bg-white min-h-[120px]"
                />
              </div>

              {/* Seção de Anexos e Links Estruturados */}
              <div className="border p-3.5 rounded-xl bg-gray-50/50 space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">Recursos Adicionais (Opcional)</span>
                
                {/* PDF */}
                <div className="space-y-1.5">
                  <Label htmlFor="anexo" className="text-xs">Anexar Documento (PDF)</Label>
                  <Input
                    id="anexo"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== "application/pdf") {
                          toast.error("Por favor, selecione apenas arquivos PDF.");
                          e.target.value = "";
                          return;
                        }
                        setAnexoNome(file.name);
                      } else {
                        setAnexoNome("");
                      }
                    }}
                    className="bg-white text-xs"
                  />
                </div>

                {/* LINK */}
                <div className="space-y-3 pt-2 border-t border-gray-200/60">
                  <Label className="text-xs">Adicionar Link Útil</Label>
                  <div className="grid grid-cols-1 gap-2.5">
                    <Input
                      placeholder="Texto do Link (Ex: Acessar Formulário)"
                      value={linkTexto}
                      onChange={e => setLinkTexto(e.target.value)}
                      className="bg-white text-xs"
                    />
                    <Input
                      placeholder="Endereço do Link (Ex: https://google.com)"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                      className="bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full flex items-center gap-2">
                <Send className="h-4 w-4" /> Enviar Mensagem
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Histórico de Mensagens Enviadas */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Histórico de Mensagens</CardTitle>
            <CardDescription>Visualize e acompanhe as notificações enviadas aos professores.</CardDescription>
          </CardHeader>
          <CardContent>
            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum comunicado enviado ainda.</p>
            ) : (
              <div className="space-y-4">
                {historico.map(h => (
                  <div key={h.id} className="p-4 border rounded-xl bg-white space-y-3 shadow-xs">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-1">
                        <h3 className="font-bold text-gray-900 text-base">{h.titulo}</h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-gray-400" /> Enviado em: {h.dataEnvio}
                        </p>
                      </div>

                      {/* Badges de Alvo */}
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                        {h.alvo === "todos" && "Todos"}
                        {h.alvo === "etapa" && `Etapa: ${h.etapaNome}`}
                        {h.alvo === "etapa_disciplina" && `Etapa: ${h.etapaNome} | Disc: ${h.disciplinaNome}`}
                        {h.alvo === "professores" && `Professores (${h.profNomes?.length})`}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50/50 p-3 rounded-lg border border-gray-100 font-medium">
                      {h.mensagem}
                    </p>

                    {/* Exibir Anexo no histórico */}
                    {h.anexoNome && (
                      <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 bg-red-50 p-2 rounded border border-red-100 max-w-max">
                        <FileText className="h-4 w-4 text-red-500" /> Anexo: {h.anexoNome}
                      </div>
                    )}

                    {/* Exibir Link no histórico */}
                    {h.linkUrl && (
                      <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 p-2 rounded border border-blue-100 max-w-max">
                        <Link2 className="h-4 w-4 text-blue-600" /> Link:{" "}
                        <a href={h.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
                          {h.linkTexto} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {h.alvo === "professores" && h.profNomes && (
                      <p className="text-[10px] text-muted-foreground">
                        <strong>Destinatários:</strong> {h.profNomes.join(", ")}
                      </p>
                    )}

                    <div className="text-[10px] text-muted-foreground border-t pt-2 mt-2 flex flex-wrap items-center gap-1">
                      <strong className="text-gray-600">Visualizado por:</strong>{" "}
                      {h.visualizadaPor && h.visualizadaPor.length > 0 ? (
                        <span className="text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded border border-green-100">
                          {h.visualizadaPor.join(", ")}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic font-medium">Ninguém visualizou ainda</span>
                      )}
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
