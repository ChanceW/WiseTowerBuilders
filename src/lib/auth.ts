import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set in environment variables");
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Auth - Missing credentials");
            throw new Error("Invalid credentials");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user) {
            console.log("Auth - User not found:", credentials.email);
            throw new Error("Invalid credentials");
          }

          // If user has no password, they can only sign in with OAuth
          if (!user.password) {
            console.log("Auth - User has no password, OAuth only:", credentials.email);
            throw new Error("Please sign in with Google");
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            console.log("Auth - Invalid password for user:", credentials.email);
            throw new Error("Invalid credentials");
          }

          console.log("Auth - Successful login for user:", credentials.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth - Error in authorize:", error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
        }
        return token;
      } catch (error) {
        console.error("Auth - Error in jwt callback:", error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
          session.user.image = token.picture as string;
        }
        return session;
      } catch (error) {
        console.error("Auth - Error in session callback:", error);
        throw error;
      }
    },
    async signIn({ user, account, profile }) {
      try {
        // Log sign in attempt
        console.log("Auth - Sign in attempt:", {
          email: user.email,
          provider: account?.provider,
        });

        // For OAuth providers, ensure the user exists in the database
        if (account?.provider !== "credentials") {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // Create new user for OAuth sign in
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
              }
            });
          }
        }

        return true;
      } catch (error) {
        console.error("Auth - Error in signIn callback:", error);
        throw error;
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("Auth - Error:", { code, metadata });
    },
    warn(code) {
      console.warn("Auth - Warning:", code);
    },
    debug(code, metadata) {
      console.log("Auth - Debug:", { code, metadata });
    },
  },
}; 