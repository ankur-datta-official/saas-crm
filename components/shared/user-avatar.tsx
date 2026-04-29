import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

type UserAvatarProps = {
  imageUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  className?: string;
  initialsClassName?: string;
};

export function UserAvatar({
  imageUrl,
  fullName,
  email,
  className,
  initialsClassName,
}: UserAvatarProps) {
  const initials = getInitials(fullName, email);
  const altText = fullName?.trim() || email || "User avatar";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm",
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={altText}
          fill
          unoptimized
          className="object-cover"
          sizes="128px"
        />
      ) : (
        <span className={cn("text-sm font-semibold", initialsClassName)}>{initials}</span>
      )}
    </div>
  );
}
