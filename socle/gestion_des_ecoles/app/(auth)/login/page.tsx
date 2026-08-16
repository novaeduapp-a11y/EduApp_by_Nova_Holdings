"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);

    try {
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
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur la plateforme",
        });
        // Récupérer le rôle de l'utilisateur pour rediriger
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        router.push(getHomePathForRole(session?.user?.role));
        router.refresh();
      }
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

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <GraduationCap className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder à la plateforme
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email, Téléphone ou Matricule</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="email@ecole.sn, 77 123 45 67 ou 2025CI001"
              {...register("identifier")}
              disabled={isLoading}
            />
            {errors.identifier && (
              <p className="text-sm text-red-500">{errors.identifier.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Élèves : utilisez votre matricule (ex: 2025CI001)
            </p>
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
            <Link href="/" className="hover:text-primary underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        </CardFooter>
      </form>
      {process.env.NODE_ENV === "development" && (
        <div className="px-6 pb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Compte de test (dev)
              </span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Email: <code className="bg-muted px-1 rounded">admin@ecole.sn</code></p>
            <p>Mot de passe: <code className="bg-muted px-1 rounded">Admin@123</code></p>
          </div>
        </div>
      )}
    </Card>
  );
}
