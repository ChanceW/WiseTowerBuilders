import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    createdAt?: Date;
  }

  interface Session {
    user: User;
  }
} 