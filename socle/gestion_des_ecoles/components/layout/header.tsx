"use client";

import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { getProfilePathForRole } from "@/lib/role-routes";
import Link from "next/link";

const roleLabels: Record<string, string> = {
  ADMIN: "Administration NOVA",
  DIRECTEUR: "Directeur",
  PROFESSEUR: "Professeur",
  PREFET: "Préfet",
  PARENT: "Parent",
};

export function Header() {
  const { data: session } = useSession();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  const user = session?.user;
  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : "??";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 transition-[left] duration-300 motion-reduce:transition-none",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Ouvrir le menu"
            onClick={toggleSidebarCollapsed}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block">
            <p className="text-lg font-bold leading-tight tracking-tight">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.role && roleLabels[user.role]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Menu du compte">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.photo || undefined} alt={user?.nom} />
                  <AvatarFallback className="bg-secondary text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={getProfilePathForRole(user?.role)} className="cursor-pointer">
                  Mon profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/eduadmins" })}
              >
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
