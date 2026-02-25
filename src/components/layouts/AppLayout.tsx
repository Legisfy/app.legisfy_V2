import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { AppNavbar } from "@/components/layouts/AppNavbar";


interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative">
          <AppNavbar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}