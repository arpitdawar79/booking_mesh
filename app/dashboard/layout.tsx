"use client";

import { PullToRefresh } from "@/components/pwa/pull-to-refresh";
import { QuickAddFAB } from "@/components/quick-add/fab";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { ToastProvider } from "@/components/ui/toast";
import { useHaptic } from "@/lib/pwa-hooks";
import { motion } from "framer-motion";
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
    <ToastProvider>
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
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-zinc-950/25 backdrop-blur-2xl border-r border-border/40 flex-col transition-all duration-300 hidden lg:flex ${
            collapsed ? "w-16" : "w-60"
          }`}
        >
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-border/40 shrink-0">
            <Link
              href="/"
              className={`font-bold text-lg flex items-center gap-2.5 ${collapsed ? "hidden" : ""}`}
            >
              <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <LayoutDashboard className="w-5 h-5 text-teal-400" />
              </div>
              <span className="truncate bg-linear-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                The Stream
              </span>
            </Link>
            {collapsed && (
              <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 mx-auto">
                <LayoutDashboard className="w-5 h-5 text-teal-400" />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-muted border border-transparent hover:border-border/45 transition"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => haptic("light")}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "text-teal-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 rounded-xl bg-teal-500/10 border border-teal-500/15 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105" />
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
          className={`fixed lg:hidden top-0 left-0 z-50 h-screen w-72 bg-background/95 backdrop-blur-3xl border-r border-border/40 flex flex-col transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-14 flex items-center justify-between px-5 border-b border-border/40 shrink-0">
            <Link
              href="/"
              className="font-bold text-lg flex items-center gap-2.5"
            >
              <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <LayoutDashboard className="w-5 h-5 text-teal-400" />
              </div>
              <span className="bg-linear-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                The Stream
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted border border-transparent hover:border-border/45 transition"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-1">
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
                  className={`relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "text-teal-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileActivePill"
                      className="absolute inset-0 rounded-xl bg-teal-500/10 border border-teal-500/15 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon className="w-5 h-5 shrink-0" />
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
          <header className="h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-border/40 flex items-center justify-between px-5 lg:h-14 lg:pt-0 lg:px-6 sticky top-0 bg-background/60 backdrop-blur-3xl z-30">
            <button
              onClick={() => {
                haptic("light");
                setMobileOpen(true);
              }}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-muted/80 active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-bold text-foreground/90 uppercase tracking-wider"
            >
              {navItems.find(
                (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
              )?.label || "Dashboard"}
            </motion.div>
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
                  .filter(
                    (item) => !dockItems.some((d) => d.href === item.href),
                  )
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
        <QuickAddFAB />
      </div>
    </ToastProvider>
  );
}
