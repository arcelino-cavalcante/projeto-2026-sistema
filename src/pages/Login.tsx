import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserCheck, ShieldAlert, Users, Printer, Key, Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useFirestoreCollection } from "../hooks/useFirestore";

export default function Login() {
  const navigate = useNavigate();
  
  // Lendo diretamente do Firestore em tempo real
  const { data: professores, loading: profsLoading } = useFirestoreCollection("professores");
  const { data: coordenadores, loading: coordsLoading } = useFirestoreCollection("coordenadores");
  
  const [loading, setLoading] = useState(false);

  // Perfil de login ativo no formulário
  const [role, setRole] = useState<"professor" | "coordenacao" | "impressao" | "admin" | "almoxarifado">("professor");
  
  // Seleção de lista
  const [selectedProfId, setSelectedProfId] = useState<string>("");
  const [selectedCoordId, setSelectedCoordId] = useState<string>("");
  const [senhaInput, setSenhaInput] = useState<string>("");

  // Login direto com email/senha (para Admin e credenciais do Firebase Auth)
  const [emailInput, setEmailInput] = useState("");

  // Método de autenticação
  const [authMethod, setAuthMethod] = useState<"lista" | "credenciais">("lista");

  // Autoselecionar primeiro item quando a lista carregar
  useEffect(() => {
    if (professores.length > 0 && !selectedProfId) setSelectedProfId(professores[0].id);
  }, [professores]);

  useEffect(() => {
    if (coordenadores.length > 0 && !selectedCoordId) setSelectedCoordId(coordenadores[0].id);
  }, [coordenadores]);

  const handleLogin = async () => {
    if (role === "admin") {
      // Login de Admin usa obrigatoriamente Firebase Authentication com email/senha
      if (!emailInput.trim() || !senhaInput.trim()) {
        toast.error("Por favor, preencha o email e senha do Administrador.");
        return;
      }

      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, emailInput.trim(), senhaInput.trim());
        toast.success("Acesso Administrador autenticado no Firebase com sucesso!");
        navigate("/admin");
      } catch (err: any) {
        console.error(err);
        toast.error("Erro na autenticação do Administrador no Firebase. Verifique as credenciais.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login via formulário clássico com dados sincronizados do Firestore
    if (role === "professor") {
      if (professores.length === 0) {
        toast.error("Nenhum professor cadastrado no banco de dados.");
        return;
      }

      const prof = professores.find(p => p.id === selectedProfId);
      const senhaCorreta = prof?.senha || "12345";
      if (senhaInput !== senhaCorreta) {
        toast.error("Senha de acesso incorreta.");
        return;
      }
      localStorage.setItem("sessao_usuario", JSON.stringify(prof));
      toast.success("Login do Professor efetuado!");
      navigate("/professor");
    } else if (role === "coordenacao") {
      const coord = coordenadores.find(c => c.id === selectedCoordId);
      const senhaCorreta = coord?.senha || "12345";
      if (senhaInput !== senhaCorreta) {
        toast.error("Senha de acesso incorreta.");
        return;
      }
      localStorage.setItem("sessao_coordenador", JSON.stringify(coord));
      toast.success("Acesso da Coordenação autorizado!");
      navigate("/coordenacao");
    } else if (role === "impressao") {
      toast.success("Bem-vindo ao Setor de Impressão!");
      navigate("/setor-impressao");
    } else if (role === "almoxarifado") {
      toast.success("Bem-vindo ao Almoxarifado!");
      navigate("/almoxarifado");
    }
  };

  const handleRoleChange = (newRole: typeof role) => {
    setRole(newRole);
    setSenhaInput("");
    setEmailInput("");
    if (newRole === "admin") {
      setAuthMethod("credenciais");
    } else {
      setAuthMethod("lista");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sistema Pedagógico</h1>
            <p className="text-sm text-gray-500">Selecione seu perfil de acesso e entre com suas credenciais.</p>
          </div>

          {/* Selecionar Perfil */}
          <div className="space-y-1.5 text-left">
            <Label htmlFor="perfil-select" className="text-xs font-bold text-gray-500 uppercase">Perfil de Acesso</Label>
            <Select value={role} onValueChange={(val: any) => handleRoleChange(val)}>
              <SelectTrigger id="perfil-select" className="bg-white h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professor">Professor(a)</SelectItem>
                <SelectItem value="coordenacao">Coordenação</SelectItem>
                <SelectItem value="impressao">Setor de Impressão (Xerox)</SelectItem>
                <SelectItem value="almoxarifado">Almoxarifado</SelectItem>
                <SelectItem value="admin">Administrador (Firebase Auth)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inputs Condicionais baseados no Perfil */}
          <div className="space-y-4 text-left border-t pt-4">
            
            {/* Login de Professor */}
            {role === "professor" && (
              <div className="space-y-3">
                {professores.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-select" className="text-xs font-bold text-gray-500 uppercase">Selecione seu Perfil de Professor</Label>
                    <Select value={selectedProfId} onValueChange={setSelectedProfId}>
                      <SelectTrigger id="prof-select" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {professores.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome} ({p.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 italic">Carregando professores do Firestore...</p>
                )}
                
                <div className="space-y-1.5">
                  <Label htmlFor="senha-prof" className="text-xs font-bold text-gray-500 uppercase">Senha</Label>
                  <Input
                    id="senha-prof"
                    type="password"
                    placeholder="Digite sua senha de professor..."
                    value={senhaInput}
                    onChange={e => setSenhaInput(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            {/* Login de Coordenação */}
            {role === "coordenacao" && (
              <div className="space-y-3">
                {coordenadores.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="coord-select" className="text-xs font-bold text-gray-500 uppercase">Selecione seu Perfil de Coordenador</Label>
                    <Select value={selectedCoordId} onValueChange={setSelectedCoordId}>
                      <SelectTrigger id="coord-select" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {coordenadores.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome} ({c.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 italic">Carregando coordenadores do Firestore...</p>
                )}
                
                <div className="space-y-1.5">
                  <Label htmlFor="senha-coord" className="text-xs font-bold text-gray-500 uppercase">Senha de Coordenador</Label>
                  <Input
                    id="senha-coord"
                    type="password"
                    placeholder="Digite sua senha..."
                    value={senhaInput}
                    onChange={e => setSenhaInput(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            {/* Login de Xerox */}
            {role === "impressao" && (
              <div className="p-4 bg-gray-50 border rounded-xl text-center text-xs text-muted-foreground">
                O Setor de Impressão não requer senha no ambiente de testes. Basta clicar em "Entrar".
              </div>
            )}

            {/* Login de Almoxarifado */}
            {role === "almoxarifado" && (
              <div className="p-4 bg-gray-50 border rounded-xl text-center text-xs text-muted-foreground">
                O acesso ao Almoxarifado é liberado no ambiente de testes. Clique em "Entrar".
              </div>
            )}

            {/* Login de Admin (Firebase Auth) */}
            {role === "admin" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-admin" className="text-xs font-bold text-gray-500 uppercase">Email do Administrador</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-admin"
                      type="email"
                      placeholder="Ex: arcelino@eliel"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      className="bg-white pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="senha-admin" className="text-xs font-bold text-gray-500 uppercase">Senha do Administrador</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="senha-admin"
                      type="password"
                      placeholder="Digite sua senha de autenticação..."
                      value={senhaInput}
                      onChange={e => setSenhaInput(e.target.value)}
                      className="bg-white pl-9"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full h-11 text-base font-bold mt-2"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Processando..." : "Entrar"}
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t">
          Sistema de Apoio Pedagógico &copy; {new Date().getFullYear()} - Banco de Dados em Nuvem (Firebase)
        </div>
      </div>
    </div>
  );
}
