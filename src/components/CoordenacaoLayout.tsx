import { Outlet } from "react-router-dom";
import { CoordenacaoSidebar } from "./CoordenacaoSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export default function CoordenacaoLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <CoordenacaoSidebar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="mb-6 flex items-center">
            <SidebarTrigger className="mr-4" />
          </div>
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
