import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar as CalendarIcon, HardDrive, Trash2, CalendarDays, Search, Filter } from "lucide-react";

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

export default function AlmoxarifadoAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Reserva[]>([]);
  const [filterEquipamento, setFilterEquipamento] = useState<string>("todos");
  const [filterData, setFilterData] = useState<string>("");
  const [filterProf, setFilterProf] = useState<string>("");

  useEffect(() => {
    const loadAgendamentos = () => {
      const salvas = localStorage.getItem("agendamentos_equipamentos");
      if (salvas) {
        setAgendamentos(JSON.parse(salvas));
      }
    };
    loadAgendamentos();

    // Adiciona listener para atualizações locais
    window.addEventListener("storage", loadAgendamentos);
    return () => window.removeEventListener("storage", loadAgendamentos);
  }, []);

  const handleDeletarAgendamento = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
      const atualizados = agendamentos.filter((a) => a.id !== id);
      setAgendamentos(atualizados);
      localStorage.setItem("agendamentos_equipamentos", JSON.stringify(atualizados));
      toast.success("Agendamento cancelado com sucesso!");
    }
  };

  // Filtragem dos agendamentos
  const agendamentosFiltrados = agendamentos.filter((a) => {
    if (!a) return false;
    const equipamento = a.equipamento || "";
    const data = a.data || "";
    const profNome = a.profNome || "";
    const etapaNome = a.etapaNome || "";

    const matchEquip = filterEquipamento === "todos" || equipamento === filterEquipamento;
    
    const matchData = !filterData || data === filterData;
    
    const matchProf = !filterProf.trim() || 
      profNome.toLowerCase().includes(filterProf.toLowerCase()) ||
      etapaNome.toLowerCase().includes(filterProf.toLowerCase());

    return matchEquip && matchData && matchProf;
  });

  // Ordenar por data mais recente primeiro
  const agendamentosOrdenados = [...agendamentosFiltrados].sort((a, b) => {
    const dateA = a?.data ? new Date(a.data).getTime() : 0;
    const dateB = b?.data ? new Date(b.data).getTime() : 0;
    return dateB - dateA;
  });

  const getTurnoBadge = (turno: string) => {
    switch (turno) {
      case "manha":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-semibold">Manhã</Badge>;
      case "tarde":
        return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 border-none font-semibold">Tarde</Badge>;
      case "noite":
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none font-semibold">Noite</Badge>;
      default:
        return <Badge>{turno}</Badge>;
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "-";
    const partes = dataStr.split("-");
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-blue-600" />
          Agendamentos de Equipamentos
        </h1>
        <p className="text-muted-foreground">
          Gerencie e visualize as reservas de equipamentos pedagógicos feitas pelos professores.
        </p>
      </div>

      {/* Seção de Filtros */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-4 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
            <Filter className="h-4 w-4 text-slate-500" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="equipamento-filter">Equipamento</Label>
            <Select value={filterEquipamento} onValueChange={setFilterEquipamento}>
              <SelectTrigger id="equipamento-filter" className="bg-white">
                <SelectValue placeholder="Selecione um equipamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Equipamentos</SelectItem>
                <SelectItem value="Data Show">Data Show</SelectItem>
                <SelectItem value="TV 1">TV 1</SelectItem>
                <SelectItem value="TV 2">TV 2</SelectItem>
                <SelectItem value="Caixa de Som Bluetooth">Caixa de Som Bluetooth</SelectItem>
                <SelectItem value="Caixa de Som Cabo">Caixa de Som Cabo</SelectItem>
                <SelectItem value="Microfone">Microfone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-filter">Data</Label>
            <Input
              id="data-filter"
              type="date"
              className="bg-white"
              value={filterData}
              onChange={(e) => setFilterData(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-filter">Buscar Professor ou Etapa</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="prof-filter"
                placeholder="Nome do professor ou etapa..."
                className="pl-9 bg-white"
                value={filterProf}
                onChange={(e) => setFilterProf(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total de Reservas</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-blue-600">{agendamentos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 text-xs uppercase font-bold tracking-wider">Reservas Filtradas</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-700">{agendamentosFiltrados.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 text-xs uppercase font-bold tracking-wider">Hoje</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-green-600">
              {agendamentos.filter((a) => a.data === new Date().toISOString().split("T")[0]).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabela de Agendamentos */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Equipamento</TableHead>
                  <TableHead className="font-semibold text-slate-700">Professor</TableHead>
                  <TableHead className="font-semibold text-slate-700">Etapa</TableHead>
                  <TableHead className="font-semibold text-slate-700">Data</TableHead>
                  <TableHead className="font-semibold text-slate-700">Turno</TableHead>
                  <TableHead className="font-semibold text-slate-700">Aula</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentosOrdenados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum agendamento encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  agendamentosOrdenados.map((reserva) => (
                    <TableRow key={reserva.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-900 flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-blue-500" />
                        {reserva.equipamento}
                      </TableCell>
                      <TableCell className="text-slate-700">{reserva.profNome}</TableCell>
                      <TableCell className="text-slate-600">{reserva.etapaNome}</TableCell>
                      <TableCell className="text-slate-600 font-medium">{formatarData(reserva.data)}</TableCell>
                      <TableCell>{getTurnoBadge(reserva.turno)}</TableCell>
                      <TableCell className="text-slate-600 font-medium">Aula {reserva.aula}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletarAgendamento(reserva.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
