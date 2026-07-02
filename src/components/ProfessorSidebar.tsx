import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Printer,
  CalendarDays,
  Library,
  Laptop,
  Info,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/professor/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Impressão",
    url: "/professor/impressao",
    icon: Printer,
  },
  {
    title: "Planejamento",
    url: "/professor/planejamento",
    icon: CalendarDays,
  },
  {
    title: "Banco de Atividades",
    url: "/professor/banco-atividades",
    icon: Library,
  },
  {
    title: "Material Pedagógico",
    url: "/professor/material-pedagogico",
    icon: Laptop,
  },
  {
    title: "Dados Importantes",
    url: "/professor/dados-importantes",
    icon: Info,
  },
  {
    title: "Configurações",
    url: "/professor/configuracoes",
    icon: Settings,
  },
];

export function ProfessorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<any>(null);

  useEffect(() => {
    const sessao = localStorage.getItem("sessao_usuario");
    if (sessao) {
      setProfessor(JSON.parse(sessao));
    }
  }, []);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold mb-2 p-2">Sistema Professor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="text-base">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-100/50 bg-gray-50/50">
        {professor && (
          <div className="px-4 py-2 border-b border-gray-200/50 mb-2">
            <p className="text-xs font-bold text-gray-800 truncate" title={professor.nome}>
              {professor.nome}
            </p>
            <p className="text-[9px] text-gray-500 font-mono truncate" title={professor.email}>
              {professor.email}
            </p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={() => navigate("/login")} className="flex items-center gap-3 w-full text-red-500 hover:text-red-600">
                <LogOut className="h-5 w-5" />
                <span className="text-base">Sair</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
