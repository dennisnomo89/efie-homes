"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  Heart,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { useToast } from "./ui/Toast";
import { Portal } from "./ui/Portal";
import { cn, initials } from "@/lib/utils";

export type NavUser = { name: string; role: string; avatarUrl: string | null } | null;

export function Navbar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLandlord = user?.role === "LANDLORD" || user?.role === "ADMIN";
  const dashboardHref = user ? (isLandlord ? "/dashboard/landlord" : "/dashboard/tenant") : "/login";

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast({ title: "Signed out", description: "See you again soon. Nante yie!" });
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/properties", label: "Browse homes", icon: Search },
    { href: "/properties?region=Greater+Accra", label: "Accra", icon: House },
    { href: "/properties?region=Ashanti", label: "Kumasi", icon: House },
    isLandlord
      ? { href: "/dashboard/landlord/properties/new", label: "List a property", icon: Plus }
      : { href: "/register?role=LANDLORD", label: "For landlords", icon: Building2 },
  ];

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    return base === "/properties" ? pathname === "/properties" && !href.includes("?") : pathname.startsWith(base);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-cream/85 backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-ink",
                isActive(l.href) && "text-forest-800",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 text-sm font-medium shadow-sm transition hover:border-stone-300"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar user={user} />
                <span className="max-w-[140px] truncate">{user.name.split(" ")[0]}</span>
                <ChevronDown className={cn("h-4 w-4 text-stone-500 transition", menuOpen && "rotate-180")} />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-60 animate-fade-in overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lift">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-stone-500">{roleLabel(user.role)}</p>
                  </div>
                  <div className="my-1 h-px bg-stone-100" />
                  <MenuLink href={dashboardHref} icon={LayoutDashboard} label="Dashboard" />
                  {!isLandlord && <MenuLink href="/dashboard/tenant#saved" icon={Heart} label="Saved homes" />}
                  {isLandlord && <MenuLink href="/dashboard/landlord/properties/new" icon={Plus} label="New listing" />}
                  <MenuLink href="/dashboard/profile" icon={UserRound} label="Profile settings" />
                  <div className="my-1 h-px bg-stone-100" />
                  <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-stone-100 lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <Portal>
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm animate-slide-in-right flex-col bg-cream shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-stone-200 px-4">
              <Logo />
              <button onClick={() => setDrawerOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-stone-100" aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4">
                <Avatar user={user} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.name}</p>
                  <p className="text-xs text-stone-500">{roleLabel(user.role)}</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-4">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-base font-medium hover:bg-white">
                  <l.icon className="h-5 w-5 text-forest-700" />
                  {l.label}
                </Link>
              ))}
              {user && (
                <>
                  <div className="my-3 h-px bg-stone-200" />
                  <Link href={dashboardHref} className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-base font-medium hover:bg-white">
                    <LayoutDashboard className="h-5 w-5 text-forest-700" /> Dashboard
                  </Link>
                  <Link href="/dashboard/profile" className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-base font-medium hover:bg-white">
                    <UserRound className="h-5 w-5 text-forest-700" /> Profile settings
                  </Link>
                </>
              )}
            </div>

            <div className="kente-stripe h-1.5" />
            <div className="grid gap-2 p-4">
              {user ? (
                <button onClick={logout} className="btn btn-outline w-full text-red-600">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary w-full">
                    Create an account
                  </Link>
                  <Link href="/login" className="btn btn-outline w-full">
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        </Portal>
      )}
    </header>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: typeof House; label: string }) {
  return (
    <Link href={href} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-ink">
      <Icon className="h-4 w-4 text-stone-500" /> {label}
    </Link>
  );
}

function Avatar({ user, size = "sm" }: { user: NonNullable<NavUser>; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-11 w-11 text-sm" : "h-8 w-8 text-xs";
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt="" className={cn("rounded-full object-cover", dim)} />;
  }
  return (
    <span className={cn("flex items-center justify-center rounded-full bg-forest-100 font-bold text-forest-800", dim)}>
      {initials(user.name)}
    </span>
  );
}

function roleLabel(role: string) {
  return role === "LANDLORD" ? "Landlord / Agent" : role === "ADMIN" ? "Administrator" : "Tenant";
}
