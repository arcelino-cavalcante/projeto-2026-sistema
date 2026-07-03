import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, FileText, ExternalLink, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import { useFirestoreCollection } from "../hooks/useFirestore";

interface InfoLink {
  id: string;
  tipo: "link" | "dado";
  titulo: string;
  conteudo: string;
}

export default function ProfessorDadosImportantes() {
  const { data: items } = useFirestoreCollection<InfoLink>("coordenacao_info_links");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(
    item =>
      item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.conteudo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dados Importantes</h1>
        <p className="text-muted-foreground">Consulte informações estratégicas e links úteis recomendados pela gestão escolar.</p>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar informações ou links..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Grid de Informações */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground font-medium">
            Nenhuma informação relevante ou link útil cadastrado no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className="shadow-sm border-gray-200 hover:shadow-md transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.tipo === "link" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                      {item.tipo === "link" ? "Link Útil" : "Dados Gerais"}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 mt-2">{item.titulo}</CardTitle>
                </div>
                <div className={`p-2.5 rounded-lg shrink-0 ${item.tipo === "link" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                  {item.tipo === "link" ? <Link2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
              </CardHeader>
              <CardContent className="pt-2 flex-1 flex flex-col justify-between gap-4">
                {item.tipo === "link" ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 font-medium">Link de acesso externo recomendado:</p>
                    <div className="bg-gray-50 p-2.5 rounded border border-gray-100 font-mono text-xs truncate text-blue-600">
                      {item.conteudo}
                    </div>
                    <Button asChild className="w-full mt-2" variant="outline">
                      <a href={item.conteudo} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                        Acessar Link <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium">
                      {item.conteudo}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
