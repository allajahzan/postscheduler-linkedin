"use client";

import Link from "next/link";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { LogoHeader } from "./logo-header";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Navbar() {
  const { data } = useUser();
  const user = data?.user;
  const logout = useLogout();

  const pathname = usePathname();
  const router = useRouter();

  const { data: notifData } = useNotifications();

  const unread =
    notifData?.pages.flatMap((p) => p.notifications).filter((n) => !n.is_read)
      .length ?? 0;

  if (!user)
    return (
      <header className="fixed inset-x-0 top-0 z-40 py-4 bg-background/20 backdrop-blur-xl border-b">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6">
          <Link href="/posts">
            <LogoHeader />
          </Link>
        </div>
      </header>
    );

  return (
    <header className="fixed inset-x-0 top-0 z-40 py-4 bg-background/20 backdrop-blur-xl border-b">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6">
        <Link href="/posts">
          <LogoHeader />
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href="/posts"
            className={cn(
              "hidden text-sm transition-colors md:block",
              pathname === "/posts"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Posts
          </Link>

          <Link
            href="/suggestions"
            className={cn(
              "hidden text-sm transition-colors md:block",
              pathname === "/suggestions"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Suggestions
          </Link>

          {/* Notification Bell → links to /notifications page */}
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread === 0 && (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[10px] font-semibold text-white ring-2 ring-background">
                {unread}
              </span>
            )}
          </Link>

          {/* User Avatar — shadcn DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white ring-2 ring-transparent transition hover:ring-primary/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {user.profile_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile_picture}
                  alt="Avatar"
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                getInitials(user.name ?? "U")
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#0B1120]/50 backdrop-blur-xl"
            >
              {/* User info header */}
              <div className="px-2 py-2.5 select-none truncate">
                <div className="text-sm font-semibold text-foreground truncate">
                  {user.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="flex items-center gap-2 p-2 text-sm text-muted-foreground cursor-pointer"
                onClick={() => router.push("/profile")}
              >
                <UserIcon />
                Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                className="flex items-center gap-2.5 p-2 text-sm cursor-pointer"
                onClick={() => logout.mutate()}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
