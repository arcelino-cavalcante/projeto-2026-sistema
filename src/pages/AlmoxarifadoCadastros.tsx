import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Package, HelpCircle } from "lucide-react";

interface ItemEstoque {
  id: string;
  nome: string;
  categoria: "pedagogico" | "nao_pedagogico";
  qtdAtual: number;
  qtdMax: number;
  unidade: string;
}

export default function AlmoxarifadoCadastros() {
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [nome, setNome] = useState("");
  const [qtdMax, setQtdMax] = useState("");
  const [qtdInicial, setQtdInicial] = useState("");
  const [unidade, setUnidade] = useState("Unidades");
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadItens = () => {
    const saved = localStorage.getItem("escola_estoque_itens");
    if (saved) {
      setItens(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadItens();
  }, []);

  const saveItens = (newList: ItemEstoque[]) => {
    setItens(newList);
    localStorage.setItem("escola_estoque_itens", JSON.stringify(newList));
  };

  const handleCadastrar = (categoria: "pedagogico" | "nao_pedagogico") => {
    if (!nome.trim() || !qtdMax.trim() || !qtdInicial.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const max = Number(qtdMax);
    const inicial = Number(qtdInicial);

    if (isNaN(max) || max <= 0 || isNaN(inicial) || inicial < 0) {
      toast.error("Quantidades devem ser valores numéricos positivos.");
      return;
    }

    if (inicial > max) {
      toast.error("A quantidade inicial não pode superar a capacidade máxima.");
      return;
    }

    if (editingId) {
      // Editar
      const updated = itens.map(i =>
        i.id === editingId ? {
          ...i,
          nome,
          qtdMax: max,
          qtdAtual: inicial,
          unidade
        } : i
      );
      saveItens(updated);
      setEditingId(null);
      toast.success("Item atualizado no almoxarifado!");
    } else {
      // Criar novo
      const newItem: ItemEstoque = {
        id: Date.now().toString(),
        nome,
        categoria,
        qtdAtual: inicial,
        qtdMax: max,
        unidade
      };
      saveItens([...itens, newItem]);
      toast.success(`Item "${nome}" cadastrado com sucesso!`);
    }

    setNome("");
    setQtdMax("");
    setQtdInicial("");
    setUnidade("Unidades");
  };

  const handleEdit = (item: ItemEstoque) => {
    setEditingId(item.id);
    setNome(item.nome);
    setQtdMax(item.qtdMax.toString());
    setQtdInicial(item.qtdAtual.toString());
    setUnidade(item.unidade);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item do almoxarifado? Os registros de estoque deste item serão perdidos.")) {
      const filtered = itens.filter(i => i.id !== id);
      saveItens(filtered);
      toast.success("Item excluído com sucesso.");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setNome("");
    setQtdMax("");
    setQtdInicial("");
    setUnidade("Unidades");
  };

  const renderTabContent = (categoria: "pedagogico" | "nao_pedagogico") => {
    const list = itens.filter(i => i.categoria === categoria);
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Form */}
        <Card className="lg:col-span-1 shadow-sm border-gray-200 bg-white">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Item" : "Cadastrar Novo Item"}</CardTitle>
            <CardDescription>
              Adicione insumos ao catálogo do almoxarifado para controle ativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="item-nome">Nome do Insumo</Label>
                <Input
                  id="item-nome"
                  placeholder="Ex: Giz Branco, Papel Toalha..."
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="item-inicial">Estoque Inicial</Label>
                  <Input
                    id="item-inicial"
                    type="number"
                    placeholder="Ex: 50"
                    value={qtdInicial}
                    onChange={e => setQtdInicial(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="item-max">Capacidade Ideal</Label>
                  <Input
                    id="item-max"
                    type="number"
                    placeholder="Ex: 100"
                    value={qtdMax}
                    onChange={e => setQtdMax(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="item-unidade">Unidade de Medida</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger id="item-unidade" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unidades">Unidades (Peças)</SelectItem>
                    <SelectItem value="Folhas">Folhas</SelectItem>
                    <SelectItem value="Rolos">Rolos</SelectItem>
                    <SelectItem value="Litros">Litros</SelectItem>
                    <SelectItem value="Caixas">Caixas</SelectItem>
                    <SelectItem value="Pacotes">Pacotes</SelectItem>
                    <SelectItem value="%">Porcentagem (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleCadastrar(categoria)} className="flex-1">
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200 bg-white">
          <CardHeader>
            <CardTitle>Catálogo do Almoxarifado</CardTitle>
            <CardDescription>
              Lista de itens de tipo {categoria === "pedagogico" ? "pedagógico" : "não pedagógico"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum item cadastrado nesta aba.</p>
            ) : (
              <div className="space-y-3">
                {list.map(i => (
                  <div key={i.id} className="p-4 border rounded-xl flex justify-between items-center hover:shadow-2xs transition-shadow bg-white">
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-primary" /> {i.nome}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Capacidade Ideal: <strong>{i.qtdMax} {i.unidade}</strong> | Estoque Atual: <strong>{i.qtdAtual} {i.unidade}</strong>
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(i)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(i.id)}>
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
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastro de Almoxarifado</h1>
        <p className="text-muted-foreground">Gerencie o catálogo de itens escolares de todas as categorias.</p>
      </div>

      <Tabs defaultValue="pedagogico" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-white border">
          <TabsTrigger value="pedagogico">Materiais Pedagógicos</TabsTrigger>
          <TabsTrigger value="nao_pedagogico">Materiais Não Pedagógicos</TabsTrigger>
        </TabsList>

        <TabsContent value="pedagogico">
          {renderTabContent("pedagogico")}
        </TabsContent>

        <TabsContent value="nao_pedagogico">
          {renderTabContent("nao_pedagogico")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
