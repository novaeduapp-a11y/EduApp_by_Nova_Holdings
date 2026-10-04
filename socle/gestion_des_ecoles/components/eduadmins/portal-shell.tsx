"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Menu, User, X } from "lucide-react";
import { BrandLogo, type BrandVariant } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getHomePathForRole } from "@/lib/role-routes";

export const portalCardClass =
  "rounded-3xl bg-card p-4 shadow-card transition-[box-shadow,transform] duration-150 ease-out hover:shadow-[0_16px_40px_rgb(11_47_122_/_0.16)] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100";

export const portalHeroClass =
  "rounded-3xl bg-gradient-to-br from-[#0B2F7A] via-primary to-[#3D7AE8] p-6 sm:p-8 text-white";

export const portalPanelClass = "rounded-3xl bg-card p-4 shadow-card";

export const portalKpiClass = "text-4xl font-bold tabular-nums tracking-tight text-primary";

export const portalTitleClass = "font-bold text-foreground tracking-tight";

export const portalMutedClass = "text-sm text-muted-foreground leading-6";

export const portalLinkClass =
  "font-medium text-primary underline-offset-4 hover:underline";

export const portalChipClass =
  "inline-flex min-h-9 items-center whitespace-nowrap rounded-full bg-secondary px-3.5 text-sm font-semibold text-primary";

export const portalTableWrapClass =
  "overflow-x-auto rounded-3xl bg-card shadow-card";

export type PortalNavItem = {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export function PortalShell({
  title,
  subtitle,
  homeHref,
  allowedRole,
  navigation,
  children,
  mePath = "/api/staff/me",
  brand = "EduAdmins",
  signOutHref = "/eduadmins",
  accountLinks = [],
}: {
  title: string;
  subtitle: string;
  homeHref: string;
  allowedRole: string;
  navigation: PortalNavItem[];
  children: React.ReactNode;
  mePath?: string;
  brand?: string;
  signOutHref?: string;
  accountLinks?: { name: string; href: string }[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ecoleNom, setEcoleNom] = useState("");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== allowedRole) {
      router.push(getHomePathForRole(session.user.role));
    }
  }, [status, session, router, allowedRole]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(mePath)
      .then((res) => res.json())
      .then((body) => {
        setEcoleNom(body.data?.ecole?.nom ?? body.data?.etablissement?.nom ?? "");
        setUnread(Number(body.data?.unread ?? body.data?.notificationsNonLues ?? 0));
      })
      .catch(() => {});
  }, [status, mePath]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  if (status === "loading" || status !== "authenticated" || !session || session.user.role !== allowedRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-background" role="status">
        <span className="sr-only">Chargement du portail</span>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const initials = `${session.user.prenom?.[0] || ""}${session.user.nom?.[0] || ""}`.toUpperCase();
  const profileHref = `${homeHref}/profil`;
  const badgeHref =
    navigation.find((item) => item.href.includes("alertes"))?.href ??
    navigation.find((item) => item.href.includes("messages"))?.href;
  const logoVariant: BrandVariant = brand === "NOVA" ? "nova" : "eduapps";

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-4 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-card focus:ring-2 focus:ring-ring"
      >
        Aller au contenu
      </a>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0B2F7A] to-primary transform transition-transform duration-300 ease-out motion-reduce:transition-none lg:translate-x-0 print:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-white/20 px-6">
            <BrandLogo variant={logoVariant} size={36} onDark />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-white">{title}</p>
              <p className="truncate text-[11px] tracking-wide text-white/70">{ecoleNom || subtitle}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fermer le menu"
              className="ml-auto text-white hover:bg-white/20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6" aria-label="Navigation du portail">
            {navigation.map((item) => {
              const active =
                item.href === homeHref
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const showBadge = unread > 0 && item.href === badgeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-full px-4 py-2.5 font-medium transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100",
                    active ? "bg-white text-primary" : "text-white/90 hover:bg-white/10"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.name}</span>
                  {showBadge ? (
                    <span
                      className={cn(
                        "min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold tabular-nums",
                        active ? "bg-primary text-white" : "bg-white text-primary"
                      )}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/20 p-4">
            <Link
              href={profileHref}
              onClick={() => setSidebarOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-2xl px-2 py-1 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Avatar className="h-10 w-10 ring-2 ring-white/30">
                <AvatarFallback className="bg-white font-bold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {session.user.prenom} {session.user.nom}
                </p>
                <p className="truncate text-xs text-white/70">Mon profil</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6 print:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="hidden min-w-0 truncate text-sm font-medium text-muted-foreground sm:block">
            {brand} · {title}
            {ecoleNom ? ` · ${ecoleNom}` : ""}
          </p>
          <div className="flex-1" />
          {unread > 0 && !badgeHref ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold tabular-nums text-white">
              {unread > 99 ? "99+" : unread} non lu{unread > 1 ? "s" : ""}
            </span>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2" aria-label="Menu du compte">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-sm text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden font-medium sm:inline-block">{session.user.prenom}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">
                  {session.user.prenom} {session.user.nom}
                </p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
                {ecoleNom ? <p className="text-xs text-muted-foreground">{ecoleNom}</p> : null}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={profileHref} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  Mon profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={homeHref} className="cursor-pointer">
                  Accueil
                </Link>
              </DropdownMenuItem>
              {accountLinks.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="cursor-pointer">
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: signOutHref })}
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main id="contenu" className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
