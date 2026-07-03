import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock } from "lucide-react";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ProfessorConfiguracoes() {
  const [professor, setProfessor] = useState<any>(null);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  useEffect(() => {
    const sessao = localStorage.getItem("sessao_usuario");
    if (sessao) {
      setProfessor(JSON.parse(sessao));
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professor) return;

    if (!senhaAtual.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    // A senha atual do professor pode vir como 'senha' ou 'password' (vamos checar ambos, com padrão '12345')
    const senhaSalva = professor.senha || professor.password || "12345";
    if (senhaAtual !== senhaSalva) {
      toast.error("A senha atual digitada está incorreta.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("A nova senha e a confirmação não coincidem.");
      return;
    }

    if (novaSenha.length < 4) {
      toast.error("A nova senha deve conter pelo menos 4 caracteres.");
      return;
    }

    try {
      // 1. Atualizar no Firestore na coleção de professores
      const docRef = doc(db, "professores", professor.id);
      await updateDoc(docRef, { senha: novaSenha });

      // 2. Atualizar sessão local do usuário
      const professorAtualizado = { ...professor, senha: novaSenha };
      setProfessor(professorAtualizado);
      localStorage.setItem("sessao_usuario", JSON.stringify(professorAtualizado));

      // Resetar campos
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      toast.success("Senha alterada com sucesso!");
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      toast.error("Erro ao alterar senha no servidor.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações da Conta</h1>
        <p className="text-muted-foreground">Gerencie suas credenciais de acesso e segurança.</p>
      </div>

      <div className="max-w-md">
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Alterar Senha
            </CardTitle>
            <CardDescription>
              Após a alteração, use a nova senha para acessar o painel nas próximas sessões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="c-email">E-mail de Acesso (Não alterável)</Label>
                <Input
                  id="c-email"
                  value={professor?.email || ""}
                  disabled
                  className="bg-gray-100 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-atual">Senha Atual</Label>
                <Input
                  id="c-atual"
                  type="password"
                  placeholder="Sua senha atual"
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-nova">Nova Senha</Label>
                <Input
                  id="c-nova"
                  type="password"
                  placeholder="Mínimo de 4 dígitos"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-conf">Confirmar Nova Senha</Label>
                <Input
                  id="c-conf"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  className="bg-white"
                />
              </div>

              <Button type="submit" className="w-full mt-2">
                Salvar Nova Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
