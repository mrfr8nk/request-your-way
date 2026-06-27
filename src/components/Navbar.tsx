import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import schoolLogo from "@/assets/school-logo.png";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "About", path: "/about" },
  { label: "Academics", path: "/admissions" },
  { label: "Staff", path: "/staff" },
  { label: "Gallery", path: "/gallery" },
  { label: "News", path: "/news" },
  { label: "Contact", path: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over-hero transparent state only on home & top of page
  const transparent = isHome && !scrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-editorial",
        transparent
          ? "bg-transparent border-b border-white/10"
          : "bg-[hsl(var(--card)/0.92)] backdrop-blur-md border-b border-[hsl(var(--rule))]",
      )}
    >
      <div className="container mx-auto px-5 md:px-8 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={schoolLogo}
            alt="St. Mary's"
            className="h-11 w-11 object-contain transition-transform duration-500 ease-editorial group-hover:rotate-3"
            fetchPriority="high"
          />
          <div className="leading-tight">
            <span className={cn("block font-display text-lg font-semibold tracking-tight", transparent ? "text-white" : "text-foreground")}>
              St. Mary's
            </span>
            <span className={cn("block font-accent italic text-[11px] tracking-wider", transparent ? "text-white/60" : "text-muted-foreground")}>
              High School · Est. 1962
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative font-body text-[13px] tracking-[0.12em] uppercase font-medium transition-colors duration-300",
                  transparent ? "text-white/85 hover:text-white" : "text-foreground/80 hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute left-0 -bottom-1.5 h-px bg-[hsl(var(--secondary))] transition-transform duration-500 ease-editorial origin-left",
                    active ? "w-full scale-x-100" : "w-full scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/login"
            className={cn(
              "font-body text-[13px] tracking-[0.12em] uppercase font-medium px-4 py-2 transition-colors",
              transparent ? "text-white/85 hover:text-white" : "text-foreground/80 hover:text-foreground",
            )}
          >
            Portal
          </Link>
          <Link
            to="/admissions"
            className="group inline-flex items-center gap-2 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] px-5 py-2.5 font-body text-[13px] tracking-[0.12em] uppercase font-semibold transition-all duration-500 ease-editorial hover:gap-3 hover:bg-white"
          >
            Apply
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 ease-editorial group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn("lg:hidden", transparent ? "text-white" : "text-foreground")}
          aria-label="Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <nav className="lg:hidden bg-[hsl(var(--card))] border-t border-[hsl(var(--rule))] animate-fade-in">
          <div className="container mx-auto px-5 py-6 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "font-body py-3 border-b border-[hsl(var(--rule))] text-base tracking-wide",
                  location.pathname === item.path ? "text-[hsl(var(--secondary))]" : "text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="font-body py-3 border-b border-[hsl(var(--rule))] text-base tracking-wide text-foreground"
            >
              Portal Login
            </Link>
            <Link
              to="/admissions"
              onClick={() => setIsOpen(false)}
              className="mt-4 inline-flex items-center justify-center gap-2 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] px-5 py-3.5 font-body text-[13px] tracking-[0.12em] uppercase font-semibold"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
