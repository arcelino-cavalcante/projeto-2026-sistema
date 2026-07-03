import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, UserCheck, Key } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { addDocument } from "../services/firebaseService";
import { db } from "../firebase";

interface Coordenador {
  id: string;
  nome: string;
  email: string;
  senha: string;
}

export default function AdminCadastroCoordenadores() {
  const { data: coordenadores } = useFirestoreCollection<Coordenador>("coordenadores");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      toast.error("Nome e E-mail são obrigatórios.");
      return;
    }

    const finalPassword = senha.trim() || "12345";

    try {
      if (editingId) {
        await updateDoc(doc(db, "coordenadores", editingId), {
          nome,
          email,
          senha: finalPassword
        });
        setEditingId(null);
        toast.success("Coordenador atualizado!");
      } else {
        await addDocument("coordenadores", {
          nome,
          email,
          senha: finalPassword
        });
        toast.success(`Coordenador cadastrado com sucesso! Senha padrão: ${finalPassword}`);
      }

      setNome("");
      setEmail("");
      setSenha("");
    } catch (error) {
      toast.error("Erro ao salvar coordenador.");
    }
  };

  const handleEdit = (c: Coordenador) => {
    setEditingId(c.id);
    setNome(c.nome);
    setEmail(c.email);
    setSenha(c.senha);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este coordenador?")) {
      try {
        await deleteDoc(doc(db, "coordenadores", id));
        toast.success("Coordenador excluído.");
      } catch (error) {
        toast.error("Erro ao excluir coordenador.");
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setNome("");
    setEmail("");
    setSenha("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastro de Coordenadores</h1>
        <p className="text-muted-foreground">Gerencie as contas dos coordenadores que possuem acesso ao painel de gestão pedagógica.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form de Cadastro */}
        <Card className="lg:col-span-1 shadow-sm border-gray-200 bg-white">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Coordenador" : "Novo Coordenador"}</CardTitle>
            <CardDescription>Crie credenciais de acesso para a equipe de coordenação.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="c-nome">Nome Completo</Label>
                <Input
                  id="c-nome"
                  placeholder="Ex: Carlos Oliveira"
                  value={nome}
                  onChange={e => {
                    const val = e.target.value;
                    setNome(val);
                    // Gerar e-mail automaticamente
                    if (!editingId) {
                      const clean = val
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]/g, "");
                      setEmail(clean ? `${clean}@eliel` : "");
                    }
                  }}
                  className="bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-email">E-mail / Login</Label>
                <Input
                  id="c-email"
                  type="text"
                  placeholder="Ex: carlos@eliel"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-senha">Senha de Acesso</Label>
                <Input
                  id="c-senha"
                  type="text"
                  placeholder="Senha padrão: 12345"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Salvar" : "Cadastrar"}
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
        <Card className="lg:col-span-2 shadow-sm border-gray-200 bg-white">
          <CardHeader>
            <CardTitle>Coordenadores Registrados</CardTitle>
            <CardDescription>Estes perfis possuem acesso completo à interface `/coordenacao`.</CardDescription>
          </CardHeader>
          <CardContent>
            {coordenadores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum coordenador cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {coordenadores.map(c => (
                  <div key={c.id} className="p-4 border rounded-xl bg-white flex justify-between items-center gap-4 hover:shadow-2xs transition-shadow">
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-purple-600" /> {c.nome}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">Login: {c.email} | Senha: {c.senha}</p>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(c.id)}>
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
