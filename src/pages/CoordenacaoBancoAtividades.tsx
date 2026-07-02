import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Image as ImageIcon, Calendar, BookOpen, User } from "lucide-react";

interface AtividadeEmergencia {
  id: string;
  profId: string;
  profNome: string;
  turmaNome: string;
  disciplinaNome: string;
  assunto: string;
  fileName: string;
  dataEnvio: string;
}

interface AtividadeExitosa {
  id: string;
  profId: string;
  profNome: string;
  turmaNome: string;
  disciplinaNome: string;
  data: string;
  nome: string;
  objetivo: string;
  habilidade: string;
  descricao: string;
  resultados: string;
  files: Array<{ name: string; type: string }>;
}

export default function CoordenacaoBancoAtividades() {
  const [professores, setProfessores] = useState<any[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>("");

  const [atividadesEmergencia, setAtividadesEmergencia] = useState<AtividadeEmergencia[]>([]);
  const [atividadesExitosas, setAtividadesExitosas] = useState<AtividadeExitosa[]>([]);

  useEffect(() => {
    // Carregar professores
    const savedProfs = localStorage.getItem("coordenacao_professores");
    if (savedProfs) {
      const list = JSON.parse(savedProfs);
      setProfessores(list);
      if (list.length > 0) {
        setSelectedProfId(list[0].id);
      }
    }

    // Carregar atividades
    const savedEmergencia = localStorage.getItem("atividades_emergencia");
    if (savedEmergencia) {
      setAtividadesEmergencia(JSON.parse(savedEmergencia));
    }

    const savedExitosas = localStorage.getItem("atividades_exitosas");
    if (savedExitosas) {
      setAtividadesExitosas(JSON.parse(savedExitosas));
    }
  }, []);

  const currentProf = professores.find(p => p.id === selectedProfId);

  // Filtrar atividades
  const emergenciaFiltradas = atividadesEmergencia.filter(a => a.profId === selectedProfId);
  const exitosasFiltradas = atividadesExitosas.filter(a => a.profId === selectedProfId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banco de Atividades</h1>
          <p className="text-muted-foreground">Consulte o repositório de atividades de emergência e práticas exitosas.</p>
        </div>
      </div>

      {/* Seleção do Professor */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="max-w-md space-y-2">
            <Label htmlFor="filtroProfessor" className="font-semibold text-gray-700">Selecione o Professor para consultar:</Label>
            <Select value={selectedProfId} onValueChange={setSelectedProfId}>
              <SelectTrigger id="filtroProfessor" className="bg-white">
                <SelectValue placeholder="Escolha um professor..." />
              </SelectTrigger>
              <SelectContent>
                {professores.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhum professor cadastrado</SelectItem>
                ) : (
                  professores.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} ({p.email})</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {currentProf ? (
        <Tabs defaultValue="emergencia" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="emergencia">Atividades de Emergência ({emergenciaFiltradas.length})</TabsTrigger>
            <TabsTrigger value="exitosas">Práticas Exitosas ({exitosasFiltradas.length})</TabsTrigger>
          </TabsList>

          {/* ABA DE EMERGÊNCIA */}
          <TabsContent value="emergencia" className="space-y-4">
            {emergenciaFiltradas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhuma atividade de emergência cadastrada para o professor {currentProf.nome}.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergenciaFiltradas.map(a => (
                  <Card key={a.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                          {a.disciplinaNome}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {a.dataEnvio}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold mt-2">{a.assunto}</CardTitle>
                      <CardDescription>Turma: {a.turmaNome}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 border p-3 rounded-lg bg-gray-50">
                        <FileText className="h-5 w-5 text-red-500 shrink-0" />
                        <span className="text-sm font-mono truncate text-gray-700" title={a.fileName}>
                          {a.fileName}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ABA DE Práticas Exitosas */}
          <TabsContent value="exitosas" className="space-y-4">
            {exitosasFiltradas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhuma prática exitosa cadastrada para o professor {currentProf.nome}.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {exitosasFiltradas.map(a => (
                  <Card key={a.id} className="shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <span className="text-sm font-semibold bg-purple-50 text-purple-800 px-2.5 py-0.5 rounded">
                            {a.disciplinaNome}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground ml-3">
                            Turma: {a.turmaNome}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 rounded">
                          Data do Registro: {a.data}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold mt-3 text-primary">{a.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Grid de Informações Pedagógicas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-gray-700">Objetivo:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100">{a.objetivo}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-gray-700">Habilidade (BNCC):</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100">{a.habilidade}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-700">Descrição da Atividade:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 whitespace-pre-wrap">{a.descricao}</p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-700">Resultados Observados:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 whitespace-pre-wrap">{a.resultados}</p>
                      </div>

                      {/* Anexos */}
                      {a.files && a.files.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h4 className="font-bold text-sm text-gray-700">Anexos / Evidências:</h4>
                          <div className="flex flex-wrap gap-2">
                            {a.files.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 border px-3 py-1.5 rounded-lg bg-gray-50 text-xs">
                                {file.type.startsWith("image/") ? (
                                  <ImageIcon className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <FileText className="h-4 w-4 text-red-500" />
                                )}
                                <span className="font-medium text-gray-700 truncate max-w-[120px]" title={file.name}>
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Cadastre professores e atividades para visualizar o banco de dados.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
