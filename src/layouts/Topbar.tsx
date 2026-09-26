import { useNavigate, Link } from "react-router-dom";
import { useIsFetching, useQuery } from "@tanstack/react-query";
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { authService } from "@/services/auth.service";
import { notificationsService } from "@/services/notifications.service";

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps): JSX.Element => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clear = useAuthStore((state) => state.clear);
  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggle);
  const activeRequests = useIsFetching();

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsService.unreadCount,
    refetchInterval: 60_000,
  });

  const handleLogout = (): void => {
    // Start the server/Firebase cleanup with captured credentials, then update
    // the UI immediately instead of making navigation wait on the network.
    const logoutRequest = refreshToken
      ? authService.logout(refreshToken, accessToken)
      : Promise.resolve();
    clear();
    navigate("/login", { replace: true });
    void logoutRequest;
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      {activeRequests > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-primary"
          role="progressbar"
          aria-label="Updating admin data"
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
      >
        <Bars3Icon className="h-5 w-5" />
      </Button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>

        <Button variant="ghost" size="icon" asChild title="Notifications">
          <Link to="/notifications" className="relative">
            <BellIcon className="h-5 w-5" />
            {typeof unread === "number" && unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-7 w-7 text-muted-foreground" />
              )}
              <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                {user?.name ?? "Admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="truncate">{user?.name}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/settings")}>
              <UserCircleIcon /> Profile & settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout}>
              <ArrowRightStartOnRectangleIcon /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
