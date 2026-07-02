import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Library,
  Layers,
  FolderPlus,
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
    url: "/almoxarifado/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Materiais Pedagógicos",
    url: "/almoxarifado/pedagogico",
    icon: Library,
  },
  {
    title: "Materiais Não Pedagógicos",
    url: "/almoxarifado/nao-pedagogico",
    icon: Layers,
  },
  {
    title: "Cadastros",
    url: "/almoxarifado/cadastros",
    icon: FolderPlus,
  },
];

export function AlmoxarifadoSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold mb-2 p-2">Almoxarifado</SidebarGroupLabel>
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
