import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChartBarIcon,
  BanknotesIcon,
  BellIcon,
  CheckBadgeIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  FireIcon,
  HomeIcon,
  MegaphoneIcon,
  PhotoIcon,
  CircleStackIcon,
  FlagIcon,
  QrCodeIcon,
  UserPlusIcon,
  UsersIcon,
  GiftIcon,
  PuzzlePieceIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/utils/cn";
import { notificationsService } from "@/services/notifications.service";
import { preloadRoute } from "@/routes/preload";

interface NavItem {
  to: string;
  label: string;
  icon: typeof HomeIcon;
  end?: boolean;
  badge?: "unread";
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
      { to: "/analytics", label: "Analytics", icon: ChartBarIcon },
    ],
  },
  {
    title: "Earn",
    items: [
      { to: "/campaigns", label: "Campaigns", icon: MegaphoneIcon },
      { to: "/claims", label: "Claims", icon: CheckBadgeIcon },
      { to: "/hot-offers", label: "Hot Offers", icon: FireIcon },
      { to: "/app-offers", label: "App Offers", icon: DevicePhoneMobileIcon },
      { to: "/missions", label: "Mission Board", icon: FlagIcon },
      { to: "/roulette", label: "Roulette", icon: SparklesIcon },
      { to: "/referrals", label: "Referrals", icon: UserPlusIcon },
    ],
  },
  {
    title: "Money",
    items: [
      { to: "/wallet", label: "Wallet", icon: BanknotesIcon },
      { to: "/redemptions", label: "Redemptions", icon: GiftIcon },
      { to: "/payment-requests", label: "Payment Requests", icon: QrCodeIcon },
    ],
  },
  {
    title: "Games",
    items: [
      {
        to: "/game-management",
        label: "Game Management",
        icon: PuzzlePieceIcon,
      },
    ],
  },
  {
    title: "Platform",
    items: [
      { to: "/users", label: "Users", icon: UsersIcon },
      {
        to: "/notifications",
        label: "Notifications",
        icon: BellIcon,
        badge: "unread",
      },
      { to: "/app-graphics", label: "App Graphics", icon: PhotoIcon },
      { to: "/media", label: "Media Library", icon: CircleStackIcon },
      { to: "/settings", label: "Settings", icon: Cog6ToothIcon },
    ],
  },
];

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps): JSX.Element => {
  // Same key/fn as Topbar's bell badge — react-query dedupes, no extra request.
  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsService.unreadCount,
    refetchInterval: 60_000,
  });

  return (
    <div className="flex h-full flex-col">
      {/* brand block + collapse toggle */}
      <div
        className={cn(
          "flex border-b",
          collapsed
            ? "flex-col items-center gap-2 px-2 py-3"
            : "h-14 items-center gap-2.5 px-4",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[0_0_14px_-2px_hsl(var(--primary)/0.6)]">
          <GiftIcon className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight">
              Money Marathon
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Admin
            </p>
          </div>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              !collapsed && "ml-auto",
            )}
          >
            {collapsed ? (
              <ChevronDoubleRightIcon className="h-4 w-4" />
            ) : (
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-3",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.title}>
            {collapsed ? (
              gi > 0 && <div className="mx-2 my-2 border-t" aria-hidden />
            ) : (
              <p
                className={cn(
                  "px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70",
                  gi > 0 && "pt-4",
                )}
              >
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map(({ to, label, icon: Icon, end, badge }) => {
                const count =
                  badge === "unread" && typeof unread === "number" ? unread : 0;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    onPointerEnter={() => preloadRoute(to)}
                    onFocus={() => preloadRoute(to)}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-0" : "gap-3 px-3",
                        isActive
                          ? // ponytail: text-primary-foreground, not literal white — white on the neon #05FF08 dark-mode pill is unreadable
                            "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_0_18px_-2px_hsl(var(--primary)/0.55)]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {count > 0 &&
                      (collapsed ? (
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                      ) : (
                        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                          {count > 99 ? "99+" : count}
                        </span>
                      ))}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            Money Marathon Admin v1.0
          </p>
        </div>
      )}
    </div>
  );
};
