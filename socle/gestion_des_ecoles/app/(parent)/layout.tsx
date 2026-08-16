"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Home, 
  GraduationCap, 
  LogOut, 
  User, 
  Bell, 
  Menu, 
  X,
  CreditCard,
  MessageSquare,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getHomePathForRole } from "@/lib/role-routes";

const navItems = [
  { href: "/parent", label: "Accueil", icon: Home },
  { href: "/parent/paiements", label: "Paiements", icon: CreditCard },
  { href: "/parent/messages", label: "Messages", icon: MessageSquare, soon: true },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role && session.user.role !== "PARENT") {
      router.push(getHomePathForRole(session.user.role));
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const userInitials = session?.user ? 
    `${session.user.prenom?.[0] || ''}${session.user.nom?.[0] || ''}` : 'P';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/parent" className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Espace Parent
                </span>
                <p className="text-xs text-muted-foreground -mt-1">Gestion Scolaire Pro</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"} 
                      size="sm"
                      className={cn(
                        "gap-2",
                        isActive && "bg-blue-100 text-blue-700"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {"soon" in item && item.soon ? (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                          Bientôt
                        </Badge>
                      ) : null}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline-block font-medium">
                      {session?.user?.prenom}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{session?.user?.prenom} {session?.user?.nom}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {session?.user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/parent/profil">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Mon profil
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/parent/parametres">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button 
                      variant={isActive ? "secondary" : "ghost"} 
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-blue-100 text-blue-700"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {"soon" in item && item.soon ? (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          Bientôt
                        </Badge>
                      ) : null}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Gestion Scolaire Pro - Espace Parent
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary">Aide</Link>
              <Link href="#" className="hover:text-primary">Contact</Link>
              <Link href="#" className="hover:text-primary">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
