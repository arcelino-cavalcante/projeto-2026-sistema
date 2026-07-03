import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, User, Search, Printer, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Professor {
  id: string;
  nome: string;
  email: string;
}

interface Solicitacao {
  id: string;
  profId: string;
  profNome: string;
  copias: number;
  dataEnvio: string;
}

import { useFirestoreCollection } from "../hooks/useFirestore";

export default function QuantidadeImpressao() {
  const { data: professoresDB } = useFirestoreCollection<Professor>("professores");
  const { data: solicitacoes } = useFirestoreCollection<Solicitacao>("xerox_solicitacoes");
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const limiteCota = 500;

  useEffect(() => {
    if (!professoresDB || !solicitacoes) return;

    // Garantir que todos os professores de solicitações constem na lista (caso o login mock crie algum não listado)
    const extraProfs: Professor[] = [];
    solicitacoes.forEach((req: Solicitacao) => {
      if (!professoresDB.some((p: Professor) => p.id === req.profId)) {
        if (!extraProfs.some(p => p.id === req.profId)) {
          extraProfs.push({
            id: req.profId,
            nome: req.profNome,
            email: "teste@escola.com" // email placeholder para mock
          });
        }
      }
    });

    setProfessores([...professoresDB, ...extraProfs]);
  }, [professoresDB, solicitacoes]);

  const getMonthlyPrintsForProf = (profId: string) => {
    const now = new Date();
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
    const currentYearStr = String(now.getFullYear());

    return solicitacoes
      .filter(s => {
        if (s.profId !== profId) return false;
        try {
          const datePart = s.dataEnvio.split(" ")[0]; // "DD/MM/AAAA"
          const [, month, year] = datePart.split("/");
          return month === currentMonthStr && year === currentYearStr;
        } catch {
          return false;
        }
      })
      .reduce((acc, curr) => acc + curr.copias, 0);
  };

  const getMonthName = () => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[new Date().getMonth()];
  };

  // Filtrar professores pela barra de pesquisa
  const filteredProfessores = professores.filter(p => 
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quantidade de Impressão</h1>
          <p className="text-muted-foreground">Monitoramento de cotas de cópias mensais por professor.</p>
        </div>
        <div className="text-sm font-semibold bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full">
          Mês de Referência: <span className="text-primary">{getMonthName()}</span>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar professor por nome ou email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Grid de Professores */}
      {filteredProfessores.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum professor encontrado com esta pesquisa ou cadastrado no sistema.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessores.map(p => {
            const totalImpressos = getMonthlyPrintsForProf(p.id);
            const restante = Math.max(0, limiteCota - totalImpressos);
            const porcentagem = Math.min(100, (totalImpressos / limiteCota) * 100);
            const pertoDoLimite = porcentagem >= 80;

            return (
              <Card key={p.id} className={`shadow-sm border border-gray-200 transition-all ${pertoDoLimite ? "border-amber-300 bg-amber-50/10" : "hover:border-gray-300"}`}>
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1 max-w-[80%]">
                    <CardTitle className="text-lg font-bold truncate" title={p.nome}>{p.nome}</CardTitle>
                    <CardDescription className="text-xs truncate" title={p.email}>{p.email}</CardDescription>
                  </div>
                  <div className={`p-2.5 rounded-lg ${pertoDoLimite ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                    <User className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Cópias Efetuadas</p>
                      <p className="text-2xl font-black text-gray-800">{totalImpressos} <span className="text-xs font-normal text-muted-foreground">/ {limiteCota}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Restantes</p>
                      <p className={`text-sm font-bold ${restante === 0 ? "text-red-600 font-extrabold" : "text-gray-700"}`}>
                        {restante} pág.
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1">
                    <Progress value={porcentagem} className={`h-2 ${pertoDoLimite ? "bg-amber-100" : ""}`} />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Uso: {porcentagem.toFixed(1)}%</span>
                      {pertoDoLimite && (
                        <span className="text-amber-700 font-bold flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" /> Limite Próximo
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
