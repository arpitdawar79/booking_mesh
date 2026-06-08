"use client";

import { PullToRefresh } from "@/components/pwa/pull-to-refresh";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { useHaptic } from "@/lib/pwa-hooks";
import {
    Banknote,
    BarChart3,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    Hotel,
    IndianRupee,
    LayoutDashboard,
    LogOut,
    Mail,
    Menu,
    MoreHorizontal,
    PlusCircle,
    Receipt,
    ShoppingCart,
    Smartphone,
    Users,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/new", label: "New Booking", icon: PlusCircle },
  { href: "/dashboard/guests", label: "Guests", icon: Users },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  {
    href: "/dashboard/additional-sales",
    label: "Additional Sales",
    icon: ShoppingCart,
  },
  { href: "/dashboard/salary", label: "Salary & Payroll", icon: Banknote },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  {
    href: "/dashboard/analytics/revenue",
    label: "Revenue Report",
    icon: IndianRupee,
  },
  {
    href: "/dashboard/analytics/occupancy",
    label: "Occupancy Report",
    icon: Hotel,
  },
  {
    href: "/dashboard/analytics/calendar",
    label: "Occupancy Calendar",
    icon: CalendarDays,
  },
  { href: "/dashboard/crons", label: "Crons", icon: Clock },
  { href: "/dashboard/templates", label: "Templates", icon: Mail },
  { href: "/dashboard/whatsapp", label: "WhatsApp Setup", icon: Smartphone },
];

const dockItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: "/dashboard/bookings",
    label: "Bookings",
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    href: "/dashboard/new",
    label: "New Booking",
    icon: <PlusCircle className="w-5 h-5" />,
  },
  {
    href: "/dashboard/guests",
    label: "Guests",
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: "/dashboard/expenses",
    label: "Expenses",
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    href: "/dashboard/salary",
    label: "Salary",
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    href: "/dashboard/additional-sales",
    label: "Sales",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
];

function LogoutForm({
  collapsed,
  className = "px-3 py-2 rounded-md",
  iconClassName = "w-4 h-4",
}: {
  collapsed?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth?action=logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!mounted) {
    return (
      <button
        disabled
        className={`flex items-center gap-3 w-full text-sm text-muted-foreground opacity-50 cursor-not-allowed transition ${
          collapsed ? "justify-center" : ""
        } ${className}`}
      >
        <LogOut className={`${iconClassName} shrink-0`} />
        {!collapsed && <span>Log out</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`flex items-center gap-3 w-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-50 ${
        collapsed ? "justify-center" : ""
      } ${className}`}
    >
      <LogOut className={`${iconClassName} shrink-0`} />
      {!collapsed && <span>{loading ? "Logging out..." : "Log out"}</span>}
    </button>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const haptic = useHaptic();

  const handleRefresh = useCallback(async () => {
    haptic("medium");
    window.location.reload();
  }, [haptic]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-muted/30 border-r border-border flex-col transition-all duration-300 hidden lg:flex ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          <Link
            href="/"
            className={`font-bold text-lg flex items-center gap-2 ${collapsed ? "hidden" : ""}`}
          >
            <LayoutDashboard className="w-5 h-5 text-teal-500" />
            <span className="truncate">The Stream</span>
          </Link>
          {collapsed && (
            <LayoutDashboard className="w-5 h-5 text-teal-500 mx-auto" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-muted transition"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => haptic("light")}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-3">
          <LogoutForm collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile Sidebar (drawer style) */}
      <aside
        className={`fixed lg:hidden top-0 left-0 z-50 h-screen w-72 bg-background border-r border-border flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-teal-500" />
            <span>The Stream</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-md hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  haptic("light");
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          <LogoutForm />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-border flex items-center justify-between px-4 lg:h-14 lg:pt-0 lg:px-6 sticky top-0 bg-background/95 backdrop-blur z-30">
          <button
            onClick={() => {
              haptic("light");
              setMobileOpen(true);
            }}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-medium truncate">
            {navItems.find(
              (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
            )?.label || "Dashboard"}
          </div>
          <div className="w-8" />
        </header>

        <main className="p-3 md:p-4 lg:p-6 max-w-7xl mx-auto">
          <PullToRefresh onRefresh={handleRefresh}>{children}</PullToRefresh>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <MobileBottomNav
          items={dockItems}
          onItemClick={() => haptic("light")}
        />

        {/* More options drawer trigger */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-50 w-10 h-10 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>More Options</DrawerTitle>
            <div className="mt-6 space-y-1">
              {navItems
                .filter((item) => !dockItems.some((d) => d.href === item.href))
                .map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-teal-500/10 text-teal-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              <div className="border-t border-border mt-4 pt-4">
                <LogoutForm
                  className="px-4 py-3 rounded-xl"
                  iconClassName="w-5 h-5"
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
