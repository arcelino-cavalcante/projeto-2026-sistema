import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Trash2, Pencil, Calendar, ArrowRight, CheckCircle, AlertCircle, Search, Filter } from "lucide-react";

interface Task {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  coluna: "todo" | "in_progress" | "urgent" | "done";
  dataLimite?: string;
}

interface Professor {
  id: string;
  nome: string;
  email: string;
  etapaIds: string[];
  disciplinaIds: string[];
}

export default function CoordenacaoGestao() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);

  // Diários de classe status: mapping professorId -> boolean (true: OK, false: Pendente)
  const [diariosStatus, setDiariosStatus] = useState<Record<string, boolean>>({});

  // Filtros Diários
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEtapa, setSelectedEtapa] = useState("todas");
  const [selectedDisciplina, setSelectedDisciplina] = useState("todas");

  // Modal de Tarefa Kanban
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitulo, setTaskTitulo] = useState("");
  const [taskDescricao, setTaskDescricao] = useState("");
  const [taskPrioridade, setTaskPrioridade] = useState<"alta" | "media" | "baixa">("media");
  const [taskColuna, setTaskColuna] = useState<"todo" | "in_progress" | "urgent" | "done">("todo");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Carregar tarefas Kanban
    const savedTasks = localStorage.getItem("coordenacao_kanban_tasks");
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    // Carregar professores, etapas e disciplinas
    const savedProfs = localStorage.getItem("coordenacao_professores");
    if (savedProfs) setProfessores(JSON.parse(savedProfs));

    setEtapas(JSON.parse(localStorage.getItem("coordenacao_etapas") || "[]"));
    setDisciplinas(JSON.parse(localStorage.getItem("coordenacao_disciplinas") || "[]"));

    // Carregar status dos diários
    const savedDiarios = localStorage.getItem("coordenacao_diarios_status");
    if (savedDiarios) setDiariosStatus(JSON.parse(savedDiarios));
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("coordenacao_kanban_tasks", JSON.stringify(newTasks));
  };

  const saveDiariosStatus = (newStatus: Record<string, boolean>) => {
    setDiariosStatus(newStatus);
    localStorage.setItem("coordenacao_diarios_status", JSON.stringify(newStatus));
  };

  // Kanban Actions
  const handleCreateOrEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitulo.trim()) {
      toast.error("O título da tarefa é obrigatório.");
      return;
    }

    if (editingTaskId) {
      const updated = tasks.map(t =>
        t.id === editingTaskId
          ? { ...t, titulo: taskTitulo, descricao: taskDescricao, prioridade: taskPrioridade, coluna: taskColuna }
          : t
      );
      saveTasks(updated);
      setEditingTaskId(null);
      toast.success("Tarefa editada com sucesso!");
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        titulo: taskTitulo,
        descricao: taskDescricao,
        prioridade: taskPrioridade,
        coluna: taskColuna,
      };
      saveTasks([...tasks, newTask]);
      toast.success("Tarefa criada no Kanban!");
    }

    setTaskTitulo("");
    setTaskDescricao("");
    setTaskPrioridade("media");
    setTaskColuna("todo");
    setTaskModalOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitulo(task.titulo);
    setTaskDescricao(task.descricao);
    setTaskPrioridade(task.prioridade);
    setTaskColuna(task.coluna);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Deseja realmente excluir esta tarefa?")) {
      const filtered = tasks.filter(t => t.id !== id);
      saveTasks(filtered);
      toast.success("Tarefa excluída.");
    }
  };

  // HTML5 Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  const handleDrop = (e: React.DragEvent, col: Task["coluna"]) => {
    const id = e.dataTransfer.getData("taskId");
    if (!id) return;
    
    const updated = tasks.map(t =>
      t.id === id ? { ...t, coluna: col } : t
    );
    saveTasks(updated);
    toast.success("Tarefa movida!");
  };

  // Diários Actions
  const handleToggleDiario = (profId: string) => {
    const nextVal = !diariosStatus[profId];
    const updated = { ...diariosStatus, [profId]: nextVal };
    saveDiariosStatus(updated);
    toast.success(`Status do diário atualizado com sucesso!`);
  };

  // Filtrar Professores para Diários
  const filteredProfessores = professores.filter(p => {
    // Busca textual
    const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Etapa
    const matchesEtapa = selectedEtapa === "todas" || p.etapaIds.includes(selectedEtapa);

    // Disciplina
    const matchesDisciplina = selectedDisciplina === "todas" || p.disciplinaIds.includes(selectedDisciplina);

    return matchesSearch && matchesEtapa && matchesDisciplina;
  });

  const getPriorityColor = (prio: Task["prioridade"]) => {
    switch (prio) {
      case "alta": return "bg-red-100 text-red-800 border-red-200";
      case "media": return "bg-amber-100 text-amber-800 border-amber-200";
      case "baixa": return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Pedagógica</h1>
          <p className="text-muted-foreground">Gerencie o planejamento estratégico da escola e o acompanhamento dos diários de classe.</p>
        </div>

        {/* Modal trigger de Kanban */}
        <Dialog open={taskModalOpen} onOpenChange={(open) => {
          setTaskModalOpen(open);
          if (!open) {
            setEditingTaskId(null);
            setTaskTitulo("");
            setTaskDescricao("");
            setTaskPrioridade("media");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Nova Tarefa Kanban
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>{editingTaskId ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
              <DialogDescription>
                Crie um cartão para monitoramento do planejamento pedagógico.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrEditTask} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="t-titulo">Título da Tarefa</Label>
                <Input
                  id="t-titulo"
                  placeholder="Ex: Organizar conselho de classe"
                  value={taskTitulo}
                  onChange={e => setTaskTitulo(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="t-desc">Descrição</Label>
                <Textarea
                  id="t-desc"
                  placeholder="Instruções ou notas da atividade..."
                  value={taskDescricao}
                  onChange={e => setTaskDescricao(e.target.value)}
                  className="bg-white min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="t-prio">Prioridade</Label>
                  <Select value={taskPrioridade} onValueChange={(val: any) => setTaskPrioridade(val)}>
                    <SelectTrigger id="t-prio" className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="t-col">Coluna Inicial</Label>
                  <Select value={taskColuna} onValueChange={(val: any) => setTaskColuna(val)}>
                    <SelectTrigger id="t-col" className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">A Fazer</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="urgent">Atenção / Pendente</SelectItem>
                      <SelectItem value="done">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="submit">{editingTaskId ? "Salvar Alterações" : "Adicionar Tarefa"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="kanban">Kanban de Planejamento</TabsTrigger>
          <TabsTrigger value="diarios">Controle de Diários de Classe ({filteredProfessores.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Kanban */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[500px]">
            {/* Coluna 1: A Fazer */}
            <div
              className="bg-gray-100/70 p-4 rounded-xl border border-dashed flex flex-col space-y-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "todo")}
            >
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-gray-700 text-sm">A Fazer</h3>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter(t => t.coluna === "todo").length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {tasks.filter(t => t.coluna === "todo").map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    className="bg-white border p-4 rounded-xl shadow-2xs hover:shadow cursor-grab active:cursor-grabbing space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${getPriorityColor(t.prioridade)}`}>
                        {t.prioridade}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditTask(t)} className="text-gray-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{t.titulo}</h4>
                      {t.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-3">{t.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 2: Em Andamento */}
            <div
              className="bg-gray-100/70 p-4 rounded-xl border border-dashed flex flex-col space-y-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "in_progress")}
            >
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-gray-700 text-sm">Em Andamento</h3>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter(t => t.coluna === "in_progress").length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {tasks.filter(t => t.coluna === "in_progress").map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    className="bg-white border p-4 rounded-xl shadow-2xs hover:shadow cursor-grab active:cursor-grabbing space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${getPriorityColor(t.prioridade)}`}>
                        {t.prioridade}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditTask(t)} className="text-gray-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{t.titulo}</h4>
                      {t.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-3">{t.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 3: Pendente / Urgente */}
            <div
              className="bg-gray-100/70 p-4 rounded-xl border border-dashed flex flex-col space-y-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "urgent")}
            >
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-red-700 text-sm">Atenção / Pendente</h3>
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter(t => t.coluna === "urgent").length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {tasks.filter(t => t.coluna === "urgent").map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    className="bg-white border p-4 rounded-xl shadow-2xs hover:shadow cursor-grab active:cursor-grabbing space-y-3 border-l-4 border-l-red-500"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${getPriorityColor(t.prioridade)}`}>
                        {t.prioridade}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditTask(t)} className="text-gray-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{t.titulo}</h4>
                      {t.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-3">{t.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 4: Concluído */}
            <div
              className="bg-gray-100/70 p-4 rounded-xl border border-dashed flex flex-col space-y-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "done")}
            >
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-green-700 text-sm">Concluído</h3>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter(t => t.coluna === "done").length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {tasks.filter(t => t.coluna === "done").map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    className="bg-white border p-4 rounded-xl shadow-2xs hover:shadow cursor-grab active:cursor-grabbing space-y-3 opacity-80"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="bg-green-50 text-green-700 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border border-green-200">
                        Concluída
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditTask(t)} className="text-gray-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm line-through text-gray-500">{t.titulo}</h4>
                      {t.descricao && <p className="text-xs text-gray-400 mt-1 line-clamp-3">{t.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Diários */}
        <TabsContent value="diarios">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader className="pb-4">
              <CardTitle>Diários de Classe - Entrega</CardTitle>
              <CardDescription>Monitore a entrega dos diários e classifique quem está pendente para contato.</CardDescription>
              
              {/* Filtros de Diário */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar professor..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Filtrar por etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Etapas</SelectItem>
                      {etapas.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Filtrar por disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Disciplinas</SelectItem>
                      {disciplinas.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProfessores.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-medium">
                  Nenhum professor encontrado com os filtros selecionados.
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-6 py-4">Nome do Professor</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Etapas / Matérias</th>
                        <th className="px-6 py-4 text-center">Status Diário</th>
                        <th className="px-6 py-4 text-right">Confirmar Entrega</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProfessores.map(p => {
                        const ok = !!diariosStatus[p.id];
                        
                        // Obter nomes das etapas e disciplinas do prof
                        const profEtapas = etapas.filter(e => p.etapaIds?.includes(e.id)).map(e => e.nome);
                        const profDiscs = disciplinas.filter(d => p.disciplinaIds?.includes(d.id)).map(d => d.nome);

                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900">{p.nome}</td>
                            <td className="px-6 py-4 text-xs font-mono">{p.email}</td>
                            <td className="px-6 py-4 space-y-1">
                              <p className="text-[10px] text-gray-500 font-semibold truncate max-w-[200px]" title={profEtapas.join(", ")}>
                                Etapas: {profEtapas.join(", ") || "-"}
                              </p>
                              <p className="text-[10px] text-gray-500 font-semibold truncate max-w-[200px]" title={profDiscs.join(", ")}>
                                Matérias: {profDiscs.join(", ") || "-"}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {ok ? (
                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
                                  <CheckCircle className="h-3.5 w-3.5" /> OK (Entregue)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">
                                  <AlertCircle className="h-3.5 w-3.5" /> Pendente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center">
                                <Checkbox
                                  checked={ok}
                                  onCheckedChange={() => handleToggleDiario(p.id)}
                                  className="h-5 w-5"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
