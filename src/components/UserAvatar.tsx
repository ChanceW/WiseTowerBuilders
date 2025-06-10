import Image from "next/image";
import { User } from "next-auth";

interface UserAvatarProps {
  user: User | null | undefined;
  size?: number;
  className?: string;
}

export function UserAvatar({ user, size = 32, className = "" }: UserAvatarProps) {
  if (!user) return null;

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name || "User avatar"}
        width={size}
        height={size}
        className={`rounded-full ${className}`}
      />
    );
  }

  // Get initials from name or email
  const getInitials = () => {
    if (user.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    return (user.email?.[0] || "?").toUpperCase();
  };

  return (
    <div
      className={`rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--background)] font-medium ${className}`}
      style={{ width: size, height: size, fontSize: `${size * 0.4}px` }}
    >
      {getInitials()}
    </div>
  );
} 