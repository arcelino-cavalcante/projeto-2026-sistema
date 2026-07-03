import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Bell, Clock, MailOpen, Mail, FileText, Link2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function ProfessorLayout() {
  const [professor, setProfessor] = useState<any>(null);
  const { data: todasNotificacoes } = useFirestoreCollection("notificacoes");
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  useEffect(() => {
    const sessao = localStorage.getItem("sessao_usuario");
    if (sessao) {
      setProfessor(JSON.parse(sessao));
    }
  }, []);

  useEffect(() => {
    if (!professor || !todasNotificacoes) return;
    
    // Filtrar apenas as destinadas a este professor específico conforme regras de destino
    const filtradas = todasNotificacoes.filter((n: any) => {
      if (n.alvo === "todos") return true;
      if (n.alvo === "etapa" && professor.etapaIds?.includes(n.etapaId)) return true;
      if (n.alvo === "etapa_disciplina" && professor.etapaIds?.includes(n.etapaId) && professor.disciplinaIds?.includes(n.disciplinaId)) return true;
      if (n.alvo === "professores" && n.profIds?.includes(professor.id)) return true;
      return false;
    });
    setNotificacoes(filtradas);
  }, [professor, todasNotificacoes]);

  const unreadCount = notificacoes.filter(
    n => !n.visualizadaPor?.includes(professor?.nome)
  ).length;

  const handleMarcarComoLida = async (id: string) => {
    if (!professor) return;
    try {
      const notif = todasNotificacoes.find((n: any) => n.id === id);
      if (!notif) return;
      const vis = notif.visualizadaPor || [];
      if (!vis.includes(professor.nome)) {
        const docRef = doc(db, "notificacoes", id);
        await updateDoc(docRef, {
          visualizadaPor: [...vis, professor.nome]
        });
        toast.success("Mensagem marcada como visualizada!");
      }
    } catch (err) {
      console.error("Erro ao marcar comunicado como lido:", err);
      toast.error("Erro ao atualizar status do comunicado.");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ProfessorSidebar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {/* Header Superior com Trigger Lateral e Sino de Notificações */}
          <div className="mb-6 flex items-center justify-between bg-white border p-3 rounded-xl shadow-xs">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
            </div>

            {/* Ícone do Sino com Lateral Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 transition-colors">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce-subtle">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[50vw] sm:max-w-none overflow-y-auto bg-white p-6">
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                    <Bell className="h-5 w-5 text-primary" /> Comunicados da Gestão
                  </SheetTitle>
                  <SheetDescription>
                    Avisos, reuniões e diretrizes enviadas pela coordenação pedagógica.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 pt-6">
                  {notificacoes.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhum comunicado encontrado.</p>
                  ) : (
                    <div className="space-y-4">
                      {notificacoes.map(n => {
                        const isRead = n.visualizadaPor?.includes(professor?.nome);
                        return (
                          <div
                            key={n.id}
                            className={`p-4 border rounded-xl space-y-3 transition-all bg-white shadow-xs ${
                              !isRead ? "border-l-4 border-l-primary bg-blue-50/5" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                {!isRead ? (
                                  <Mail className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                                ) : (
                                  <MailOpen className="h-4 w-4 text-gray-400 shrink-0" />
                                )}
                                {n.titulo}
                              </h4>
                              <span className="text-[10px] text-muted-foreground shrink-0 font-medium flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-gray-400" /> {n.dataEnvio}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{n.mensagem}</p>

                            {/* Link Útil estruturado */}
                            {n.linkUrl && (
                              <div className="mt-1">
                                <a
                                  href={n.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                                >
                                  <Link2 className="h-3.5 w-3.5 text-blue-500" />
                                  <span>{n.linkTexto || "Acessar Link"}</span>
                                  <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                                </a>
                              </div>
                            )}

                            {/* Anexo de PDF */}
                            {n.anexoNome && (
                              <div className="mt-2.5 p-3 rounded-lg border border-red-100 bg-red-50/30 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-red-500 shrink-0 animate-bounce-subtle" />
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-gray-800 truncate max-w-[140px] sm:max-w-[200px]" title={n.anexoNome}>
                                      {n.anexoNome}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-semibold">Documento Anexo (PDF)</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toast.success(`Baixando anexo: ${n.anexoNome}`)}
                                  className="h-7 text-xs flex items-center gap-1 border-red-200 hover:bg-red-50 text-red-700 font-semibold bg-white shrink-0"
                                >
                                  Baixar
                                </Button>
                              </div>
                            )}

                            {!isRead && (
                              <div className="flex justify-end pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleMarcarComoLida(n.id)}
                                  className="text-xs h-7 bg-primary text-white font-semibold hover:bg-primary/95"
                                >
                                  Marcar como Visualizada
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
