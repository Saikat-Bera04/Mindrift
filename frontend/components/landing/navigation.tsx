"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { notifyAuthChanged } from "@/lib/jwt-auth";
import Link from "next/link";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Process", href: "#how-it-works" },
  { name: "Metrics", href: "#metrics" },
];

export function Navigation() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isLoading, isAuthenticated } = useConvexAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      notifyAuthChanged();
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false);
    }
  };

  const showSignedOutCtas = !isLoading && !isAuthenticated;
  const showSignedInCtas = !isLoading && isAuthenticated;

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          <a href="#" className="flex items-center gap-2 group">
            <span
              className={`font-display tracking-tight transition-all duration-500 ${
                isScrolled ? "text-xl text-white" : "text-2xl text-white"
              }`}
            >
              Santulan
            </span>
            <span
              className={`font-mono transition-all duration-500 ${
                isScrolled ? "text-[10px] mt-0.5 text-white/50" : "text-xs mt-1 text-white/60"
              }`}
            >
              TM
            </span>
          </a>

          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm transition-colors duration-300 relative group text-white/70 hover:text-white"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full bg-white" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {showSignedOutCtas && (
              <>
                <Link href="/sign-in" className="transition-all duration-500 text-sm text-white/70 hover:text-white">
                  Sign in
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="rounded-full transition-all duration-500 bg-white hover:bg-white/90 text-black px-6"
                  >
                    Join Santulan
                  </Button>
                </Link>
              </>
            )}
            {showSignedInCtas && (
              <>
                <Link href="/dashboard" className="text-sm text-white/70 hover:text-white mr-2 transition-colors">
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="text-sm text-white/70 hover:text-white transition-colors disabled:opacity-60"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 transition-colors duration-500 text-white"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 bg-black z-40 transition-all duration-500 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8">
          <div className="flex-1 flex flex-col justify-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-5xl font-display text-white hover:text-white/70 transition-all duration-500 ${
                  isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div
            className={`flex gap-4 pt-8 border-t border-white/10 transition-all duration-500 ${
              isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            {showSignedOutCtas && (
              <>
                <Link href="/sign-in" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full rounded-full h-14 text-base bg-transparent text-white border-white hover:bg-white/10 hover:text-white"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-white text-black hover:bg-white/90 rounded-full h-14 text-base">
                    Join Santulan
                  </Button>
                </Link>
              </>
            )}
            {showSignedInCtas && (
              <>
                <Link href="/dashboard" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-white text-black hover:bg-white/90 rounded-full h-14 text-base">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-full h-14 text-base bg-white/15 text-white hover:bg-white/20"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
