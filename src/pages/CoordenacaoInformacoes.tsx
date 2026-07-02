import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Trash2, Link2, FileText } from "lucide-react";

interface InfoLink {
  id: string;
  tipo: "link" | "dado";
  titulo: string;
  conteudo: string;
}

export default function CoordenacaoInformacoes() {
  const [items, setItems] = useState<InfoLink[]>([]);
  const [tipo, setTipo] = useState<"link" | "dado">("link");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("coordenacao_info_links");
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  const saveItems = (newItems: InfoLink[]) => {
    setItems(newItems);
    localStorage.setItem("coordenacao_info_links", JSON.stringify(newItems));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }

    if (tipo === "link" && !conteudo.startsWith("http://") && !conteudo.startsWith("https://")) {
      toast.error("Para links, o conteúdo deve ser uma URL válida (começando com http:// ou https://).");
      return;
    }

    if (editingId) {
      const updated = items.map(item =>
        item.id === editingId ? { ...item, tipo, titulo, conteudo } : item
      );
      saveItems(updated);
      setEditingId(null);
      toast.success("Informação atualizada com sucesso!");
    } else {
      const newItem: InfoLink = {
        id: Date.now().toString(),
        tipo,
        titulo,
        conteudo,
      };
      saveItems([...items, newItem]);
      toast.success("Informação cadastrada com sucesso!");
    }

    setTitulo("");
    setConteudo("");
  };

  const handleEdit = (item: InfoLink) => {
    setEditingId(item.id);
    setTipo(item.tipo);
    setTitulo(item.titulo);
    setConteudo(item.conteudo);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta informação?")) {
      const filtered = items.filter(item => item.id !== id);
      saveItems(filtered);
      toast.success("Informação excluída.");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitulo("");
    setConteudo("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar Informações e Links</h1>
        <p className="text-muted-foreground">Compartilhe links importantes e dados gerais diretamente no painel dos professores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form de Cadastro */}
        <Card className="lg:col-span-1 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Registro" : "Novo Registro"}</CardTitle>
            <CardDescription>Cadastre links úteis ou informações gerais.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Informação</Label>
                <Select value={tipo} onValueChange={(val: "link" | "dado") => setTipo(val)}>
                  <SelectTrigger id="tipo" className="bg-white">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link de Acesso (URL)</SelectItem>
                    <SelectItem value="dado">Dado Geral (Texto/Contatos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título / Nome</Label>
                <Input
                  id="titulo"
                  placeholder={tipo === "link" ? "Ex: Portal BNCC" : "Ex: Professores Substitutos"}
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo / Link</Label>
                {tipo === "link" ? (
                  <Input
                    id="conteudo"
                    placeholder="Ex: https://basenacionalcomum.mec.gov.br"
                    value={conteudo}
                    onChange={e => setConteudo(e.target.value)}
                    className="bg-white"
                  />
                ) : (
                  <Textarea
                    id="conteudo"
                    placeholder="Escreva as informações aqui (ex: nomes de contatos, telefones, regulamentos, etc.)."
                    value={conteudo}
                    onChange={e => setConteudo(e.target.value)}
                    className="bg-white min-h-[100px]"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Atualizar" : "Cadastrar"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Listagem */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Dados e Links Cadastrados</CardTitle>
            <CardDescription>Estes são os itens atualmente visíveis na interface do professor.</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum link ou dado cadastrado ainda.</p>
            ) : (
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="p-4 border rounded-xl bg-white flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${item.tipo === "link" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                        {item.tipo === "link" ? <Link2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{item.titulo}</h3>
                          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-semibold capitalize">
                            {item.tipo}
                          </span>
                        </div>
                        {item.tipo === "link" ? (
                          <a href={item.conteudo} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block truncate max-w-[280px] sm:max-w-md">
                            {item.conteudo}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">{item.conteudo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}>
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
    </div>
  );
}
