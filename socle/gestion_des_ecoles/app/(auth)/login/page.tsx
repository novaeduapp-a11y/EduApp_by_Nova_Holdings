"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/user";
import { useToast } from "@/hooks/use-toast";
import { getHomePathForRole } from "@/lib/role-routes";
import { PublicFooter, PublicHeader } from "@/components/eduadmins/public-chrome";
import { BrandLogo } from "@/components/brand/brand-logo";

function LoginForm() {
  const searchParams = useSearchParams();
  const portail = searchParams.get("portail");
  const ecoleId = searchParams.get("ecoleId") ?? "";
  const [adminSpace, setAdminSpace] = useState(false);
  const portailLabel =
    portail === "PROFESSEUR"
      ? "Portail Professeurs"
      : portail === "PREFET"
        ? "Portail Préfets"
        : portail === "DIRECTION"
          ? "Portail Direction"
          : null;
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const host = window.location.hostname.toLowerCase();
    setAdminSpace(host === "admin.eduadmin.net");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const finishSession = (role?: string) => {
    window.location.assign(getHomePathForRole(role));
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/auth/web-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: data.identifier,
          password: data.password,
          portail: portail || undefined,
          ecoleId: ecoleId || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(
          body.error || "Email, téléphone ou mot de passe incorrect. Vérifiez vos identifiants."
        );
        return;
      }

      if (body.data?.requires2fa) {
        setChallengeId(body.data.challengeId);
        setCodeError(null);
        return;
      }

      toast({ title: "Connexion réussie", description: "Bienvenue sur EduAdmins" });
      await finishSession(body.data?.role);
    } catch {
      setFormError("Impossible de se connecter. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerify2fa = async () => {
    if (!challengeId) return;
    if (code.trim().length < 6) {
      setCodeError("Saisissez les 6 chiffres du code.");
      codeRef.current?.focus();
      return;
    }
    setIsLoading(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/auth/web-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId,
          code: code.trim(),
          ecoleId: ecoleId || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCodeError(body.error || "Le code est incorrect ou a expiré. Saisissez-le à nouveau.");
        codeRef.current?.focus();
        return;
      }
      toast({ title: "Connexion réussie", description: "Bienvenue sur EduAdmins" });
      await finishSession(body.data?.role);
    } catch {
      setCodeError("Impossible de vérifier le code. Vérifiez votre connexion et réessayez.");
      codeRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <PublicHeader brand="EduAdmins" />

      <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="marketing-fade-up rounded-[1.5rem] border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="text-center">
            <div className="flex justify-center">
              <BrandLogo variant={mounted && adminSpace ? "nova" : "eduapps"} size={56} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[color:var(--color-ink)]">
              {mounted && adminSpace
                ? "Administration NOVA"
                : mounted && portailLabel
                  ? portailLabel
                  : "Connexion"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mounted && adminSpace
                ? "Établissements, comptes et paramètres"
                : "NOVA HOLDINGS · Sénégal"}
            </p>
            {mounted && adminSpace ? (
              <p className="mt-3 text-sm text-muted-foreground">Accès réservé à l’équipe NOVA.</p>
            ) : null}
          </div>

          {challengeId ? (
            <div className="mt-8 space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Un code à 6 chiffres a été envoyé par e-mail. Saisissez-le pour confirmer votre identité.
              </p>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  ref={codeRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setCodeError(null);
                  }}
                  disabled={isLoading}
                  aria-invalid={Boolean(codeError)}
                  aria-describedby={codeError ? "code-error" : undefined}
                  className="h-12 text-center text-2xl tracking-[0.4em] tabular-nums"
                />
                {codeError ? (
                  <p id="code-error" className="text-sm text-destructive" role="alert">
                    {codeError}
                  </p>
                ) : null}
              </div>
              <Button type="button" className="h-12 w-full" onClick={onVerify2fa} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification…
                  </>
                ) : (
                  "Valider le code"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setChallengeId(null);
                  setCode("");
                  setCodeError(null);
                }}
              >
                Retour
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email ou téléphone</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="email@ecole.sn"
                  autoComplete="username"
                  className="h-12"
                  {...register("identifier")}
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                />
                {errors.identifier && (
                  <p id="identifier-error" className="text-sm text-destructive" role="alert">
                    {errors.identifier.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-12 pr-12"
                    {...register("password")}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {formError ? (
                <p id="login-error" className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" className="h-12 w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <Link
                  href={portail ? "/eduadmins" : "/"}
                  className="font-medium text-primary hover:underline"
                >
                  {portail ? "Retour aux portails" : "Retour à l’accueil"}
                </Link>
              </div>
            </form>
          )}

        </div>
      </main>

      <PublicFooter brand="EduAdmins" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-background">
          <PublicHeader brand="EduAdmins" />
          <p className="p-8 text-sm text-muted-foreground">Chargement…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
