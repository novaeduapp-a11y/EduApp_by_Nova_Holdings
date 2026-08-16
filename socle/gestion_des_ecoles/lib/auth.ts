import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      nom: string;
      prenom: string;
      role: Role;
      photo?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: Role;
    photo?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: Role;
    photo?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email ou Téléphone", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Email/Téléphone/Matricule et mot de passe requis");
        }

        const identifier = (credentials.identifier as string).trim();
        const isEmail = identifier.includes("@");
        const isMatricule = /^\d{4}[A-Za-z]{2,3}\d+$/.test(identifier); // Format: 2025CI001
        
        let user;
        if (isEmail) {
          // Connexion par email
          user = await prisma.user.findUnique({
            where: { email: identifier },
          });
        } else if (isMatricule) {
          // Connexion par matricule (pour les élèves)
          const eleve = await prisma.eleve.findUnique({
            where: { matricule: identifier.toUpperCase() },
            include: { user: true },
          });
          user = eleve?.user || null;
        } else {
          // Connexion par téléphone - normaliser le numéro
          const phoneNormalized = identifier.replace(/\s/g, "");
          user = await prisma.user.findFirst({
            where: { 
              telephone: { contains: phoneNormalized.slice(-9) },
              actif: true,
            },
          });
        }

        if (!user || !user.actif) {
          throw new Error("Identifiants invalides");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Identifiants invalides");
        }

        return {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          photo: user.photo,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.nom = user.nom;
        token.prenom = user.prenom;
        token.role = user.role;
        token.photo = user.photo;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.nom = token.nom;
        session.user.prenom = token.prenom;
        session.user.role = token.role;
        session.user.photo = token.photo;
      }
      return session;
    },
  },
});
