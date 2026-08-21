import { cn } from "@product/lib/utils";
import {
  Rocket,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Receipt,
  Target,
  UserSquare,
  FileText,
  Film,
  BarChart3,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import UserMenu from "./UserMenu";
import { useAuth } from "@product/hooks/useAuth";

const logoWordmark = "/brand/logo.png";
const logoMark = "/brand/mark.png";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

/**
 * The nav, in two groups.
 *
 * It used to be one undifferentiated list of eight, which put "Subscription"
 * at the same level as "Film" — a billing page and the tool you use every day
 * reading as equals. The split says what the product is: the first group is
 * the campaign workflow in the order you actually do it, the second is the
 * account.
 *
 * The workflow order matters and is not alphabetical: you define who you are
 * selling to, research them, write, cast a presenter, film, then measure.
 * Someone new to the product can read the sidebar and understand the job.
 */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { icon: Rocket, label: "Campaigns", href: "/campaigns" },
      { icon: Target, label: "ICP", href: "/icp" },
      { icon: FileText, label: "Content", href: "/content" },
      { icon: UserSquare, label: "Avatar Studio", href: "/avatar-studio" },
      { icon: Film, label: "Film", href: "/film" },
      { icon: BarChart3, label: "Reports", href: "/reports" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: CreditCard, label: "Pricing", href: "/pricing" },
      { icon: Receipt, label: "Subscription", href: "/subscription" },
      { icon: Settings, label: "Settings", href: "/settings" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────
          No bottom border. The rule under the logo cut the sidebar into two
          boxes and made the nav look like a separate widget dropped inside it;
          the space alone separates them. */}
      <div className={cn("flex h-[74px] flex-none items-center", collapsed ? "justify-center px-3" : "px-5")}>
        <Link to="/" aria-label="Video Funker" className="flex items-center">
          <img
            src={collapsed ? logoMark : logoWordmark}
            alt="Video Funker"
            className={collapsed ? "h-8 w-8 object-contain" : "h-[30px] w-auto object-contain"}
          />
        </Link>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-7" : ""}>
            {/* The label is dropped when collapsed rather than truncated: a
                three-letter stub of "Workspace" is noise, and the grouping is
                still carried by the gap between the two blocks. */}
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  location.pathname.startsWith(item.href + "/") ||
                  /*
                    "/" renders Campaigns (see App.tsx), so landing on /app —
                    which is where every sign-in and every logo click goes —
                    left the whole nav unhighlighted while Campaigns was
                    plainly on screen.
                  */
                  (location.pathname === "/" && item.href === "/campaigns");
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors duration-150",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    {/* The active marker is a bar on the rail, not a background
                        alone — it survives being read at a glance from the far
                        side of a wide screen. */}
                    {isActive && (
                      <span className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <item.icon
                      className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                      strokeWidth={isActive ? 2.2 : 1.9}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Account ───────────────────────────────────────────────────────
          A real row showing who is signed in, rather than a bare avatar button
          beside the word "Account". On a shared machine, whose workspace this
          is should be answerable without opening a menu. */}
      <div className="flex-none border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent",
            collapsed && "justify-center px-0"
          )}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {user?.displayName || "Your account"}
              </p>
              <p className="truncate text-[12px] text-muted-foreground">{user?.email}</p>
            </div>
          )}
          <UserMenu />
        </div>
      </div>

      {/* ── Collapse ──────────────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[58px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
