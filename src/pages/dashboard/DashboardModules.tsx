import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRightIcon,
  BanknotesIcon,
  BellIcon,
  ChartBarIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  FireIcon,
  FlagIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { preloadRoute } from "@/routes/preload";

const modules = [
  {
    title: "Offers",
    description: "Content, proofs & performance",
    path: "/offers",
    icon: FireIcon,
    group: "Earn",
  },
  {
    title: "Mission Board",
    description: "Missions & completion reviews",
    path: "/missions",
    icon: FlagIcon,
    group: "Earn",
  },
  {
    title: "Roulette",
    description: "Rounds, rewards & probability",
    path: "/roulette",
    icon: SparklesIcon,
    group: "Earn",
  },
  {
    title: "Surveys",
    description: "CPX completions & reversals",
    path: "/surveys",
    icon: ClipboardDocumentListIcon,
    group: "Earn",
  },
  {
    title: "Referrals",
    description: "Invites & referral rewards",
    path: "/referrals",
    icon: UserPlusIcon,
    group: "Earn",
  },
  {
    title: "Wallet",
    description: "Balances & transaction ledger",
    path: "/wallet",
    icon: BanknotesIcon,
    group: "Money",
  },
  {
    title: "Redemptions",
    description: "Voucher requests & fulfilment",
    path: "/redemptions",
    icon: GiftIcon,
    group: "Money",
  },
  {
    title: "Payment Requests",
    description: "UPI payouts & processing",
    path: "/payment-requests",
    icon: QrCodeIcon,
    group: "Money",
  },
  {
    title: "Game Management",
    description: "Ludo rooms, players & safety",
    path: "/game-management",
    icon: PuzzlePieceIcon,
    group: "Games",
  },
  {
    title: "Users",
    description: "Accounts, access & activity",
    path: "/users",
    icon: UsersIcon,
    group: "Platform",
  },
  {
    title: "Notifications",
    description: "Push campaigns & delivery",
    path: "/notifications",
    icon: BellIcon,
    group: "Platform",
  },
  {
    title: "App Graphics",
    description: "App banners & visual slots",
    path: "/app-graphics",
    icon: PhotoIcon,
    group: "Platform",
  },
  {
    title: "Media Library",
    description: "Uploads & reusable assets",
    path: "/media",
    icon: CircleStackIcon,
    group: "Platform",
  },
  {
    title: "Analytics",
    description: "Tracked events & reports",
    path: "/analytics",
    icon: ChartBarIcon,
    group: "Platform",
  },
  {
    title: "Settings",
    description: "Rewards & platform controls",
    path: "/settings",
    icon: Cog6ToothIcon,
    group: "Platform",
  },
];

export function DashboardModules(): JSX.Element {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("All modules");
  const visible = modules.filter(
    (item) =>
      (group === "All modules" || item.group === group) &&
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  return (
    <section className="dashboard-panel" aria-labelledby="workspace-title">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 pb-3">
        <div>
          <h2 id="workspace-title" className="font-semibold">
            Your workspace
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Every module, one place. Pick up where you need to.
          </p>
        </div>
        <label className="flex h-9 w-full items-center gap-2 rounded-lg border px-3 sm:w-56">
          <MagnifyingGlassIcon
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Find a module"
            placeholder="Find a module…"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            type="search"
          />
        </label>
      </div>
      <div
        className="flex flex-wrap gap-1 px-5 pb-4"
        role="group"
        aria-label="Module category"
      >
        {["All modules", "Earn", "Money", "Games", "Platform"].map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setGroup(item)}
            aria-pressed={group === item}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${group === item ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-px overflow-hidden rounded-b-2xl bg-border sm:grid-cols-2 xl:grid-cols-3">
        {visible.map(({ title, description, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onPointerEnter={() => preloadRoute(path)}
            onFocus={() => preloadRoute(path)}
            className="dashboard-module group flex items-center gap-3 p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
              <Icon className="h-[18px] w-[18px] text-muted-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{title}</span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {description}
              </span>
            </span>
            <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
          </Link>
        ))}
      </div>
      {visible.length === 0 && (
        <p
          className="p-8 text-center text-sm text-muted-foreground"
          role="status"
        >
          No modules match. Try another name or category.
        </p>
      )}
    </section>
  );
}
