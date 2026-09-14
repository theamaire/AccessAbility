"use client";

import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { MapSidebar } from "@/components/map-sidebar";


export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      <SidebarProvider>
        <MapSidebar />

        <main className="relative flex-1 h-screen overflow-hidden">
          <SidebarTrigger className="absolute top-4 left-4 z-[9999] pointer-events-auto bg-white" />

          <div className="w-full h-screen">
            {children}
          </div>
        </main>
      </SidebarProvider>

  );
}