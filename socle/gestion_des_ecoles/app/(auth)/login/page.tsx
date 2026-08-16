"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/lib/validations/user";
import { useToast } from "@/hooks/use-toast";
import { getHomePathForRole } from "@/lib/role-routes";

const DEMO: Record<string, string> = {
  PROFESSEUR: "professeur@ecole.sn",
  PREFET: "prefet.primaire@ecole.sn",
  DIRECTION: "directeur@ecole.sn",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portail = searchParams.get("portail");
  const portailLabel =
    portail === "PROFESSEUR" ? "Portail Professeurs" :
    portail === "PREFET" ? "Portail Préfets" :
    portail === "DIRECTION" ? "Portail Direction" :
    null;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const demoEmail = useMemo(() => (portail && DEMO[portail]) || "admin@ecole.sn", [portail]);

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

  const finishSession = async () => {
    const response = await fetch("/api/auth/session");
    const session = await response.json();
    router.push(getHomePathForRole(session?.user?.role));
    router.refresh();
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const pre = await fetch("/api/auth/web-prelogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: data.identifier,
          password: data.password,
          portail: portail || undefined,
        }),
      });
      const body = await pre.json();
      if (!pre.ok) {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: body.error || "Email ou mot de passe incorrect",
        });
        return;
      }

      if (body.data?.requires2fa) {
        setChallengeId(body.data.challengeId);
        setDebugCode(body.data.debugCode ?? null);
        toast({
          title: "Code à 6 chiffres",
          description: "Saisissez le code Direction pour continuer.",
        });
        return;
      }

      const result = await signIn("credentials", {
        identifier: data.identifier,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Email/Téléphone ou mot de passe incorrect",
        });
        return;
      }
      toast({ title: "Connexion réussie", description: "Bienvenue sur EduAdmins" });
      await finishSession();
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerify2fa = async () => {
    if (!challengeId || code.trim().length < 6) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        challengeId,
        code: code.trim(),
        identifier: "2fa",
        password: "2fa",
        redirect: false,
      });
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Code invalide",
          description: "Le code est incorrect ou a expiré.",
        });
        return;
      }
      toast({ title: "Connexion réussie", description: "Portail Direction" });
      await finishSession();
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vérifier le code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-[#E8F0FE] rounded-full">
            <GraduationCap className="h-10 w-10 text-[#1A5FD4]" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">EduAdmins</CardTitle>
        <CardDescription>
          {portailLabel
            ? `${portailLabel} — site web NOVA HOLDINGS`
            : "Connexion à l'espace établissement — NOVA HOLDINGS"}
        </CardDescription>
      </CardHeader>

      {challengeId ? (
        <>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Un code à 6 chiffres est obligatoire pour la Direction.
            </p>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isLoading}
                className="text-center text-2xl tracking-[0.4em]"
              />
            </div>
            {debugCode ? (
              <p className="text-center text-sm text-[#1A5FD4]">
                Code de test : <code className="font-mono">{debugCode}</code>
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" onClick={onVerify2fa} disabled={isLoading || code.length < 6}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Valider le code"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setChallengeId(null);
                setCode("");
                setDebugCode(null);
              }}
            >
              Retour
            </Button>
          </CardFooter>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="email@ecole.sn"
                {...register("identifier")}
                disabled={isLoading}
              />
              {errors.identifier && (
                <p className="text-sm text-red-500">{errors.identifier.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/eduadmins" className="hover:text-primary underline">
                Retour aux portails
              </Link>
            </div>
          </CardFooter>
        </form>
      )}

      {process.env.NODE_ENV === "development" && !challengeId && (
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
          <p>
            Compte : <code className="bg-muted px-1 rounded">{demoEmail}</code>
          </p>
          <p>
            Mot de passe : <code className="bg-muted px-1 rounded">Admin@123</code>
          </p>
        </div>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
