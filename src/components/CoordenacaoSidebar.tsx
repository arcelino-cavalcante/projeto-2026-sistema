import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderPlus,
  BookOpen,
  Printer,
  Info,
  Mail,
  ClipboardList,
  TrendingUp,
  LogOut,
  Calendar,
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
    url: "/coordenacao/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Cadastros",
    url: "/coordenacao/cadastros",
    icon: FolderPlus,
  },
  {
    title: "Banco de Atividades",
    url: "/coordenacao/banco-atividades",
    icon: BookOpen,
  },
  {
    title: "Impressão",
    url: "/coordenacao/impressao",
    icon: Printer,
  },
  {
    title: "Informações",
    url: "/coordenacao/informacoes",
    icon: Info,
  },
  {
    title: "Mensagens",
    url: "/coordenacao/mensagens",
    icon: Mail,
  },
  {
    title: "Gestão Pedagógica",
    url: "/coordenacao/gestao",
    icon: ClipboardList,
  },
  {
    title: "Planejamentos",
    url: "/coordenacao/planejamentos",
    icon: Calendar,
  },
];

export function CoordenacaoSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold mb-2 p-2">Coordenação</SidebarGroupLabel>
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
      <SidebarFooter>
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
