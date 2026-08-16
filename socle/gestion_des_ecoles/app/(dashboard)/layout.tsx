"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore, useHydration } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { PageLoading } from "@/components/shared/loading-spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { sidebarCollapsed } = useUIStore();
  const hydrated = useHydration();

  if (status === "loading" || !hydrated) {
    return <PageLoading />;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "pl-16" : "pl-64"
        )}
      >
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
