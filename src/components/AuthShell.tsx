import { ReactNode } from "react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import schoolLogo from "@/assets/school-logo.png";
import { ArrowLeft } from "lucide-react";

interface AuthShellProps {
  children: ReactNode;
  quote?: string;
  attribution?: string;
}

const AuthShell = ({ children, quote, attribution }: AuthShellProps) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[hsl(var(--background))]">
      {/* Left — editorial image */}
      <div className="relative hidden lg:block overflow-hidden bg-[hsl(215_60%_8%)]">
        <img src={heroBg} alt="St. Mary's campus" className="absolute inset-0 w-full h-full object-cover ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(215_60%_8%/0.4)] via-[hsl(215_60%_8%/0.55)] to-[hsl(215_60%_8%/0.92)]" />
        <div className="relative z-10 h-full flex flex-col justify-between p-10 xl:p-14 text-white">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img src={schoolLogo} alt="St. Mary's" className="h-11 w-11 object-contain" />
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold">St. Mary's</p>
              <p className="font-accent italic text-xs text-white/60">High School · Est. 1962</p>
            </div>
          </Link>

          <div className="max-w-md">
            <span className="font-accent italic text-[120px] leading-none text-[hsl(43_78%_55%/0.4)] select-none">"</span>
            <p className="font-accent italic text-2xl xl:text-3xl text-white/95 leading-[1.4] -mt-10">
              {quote || "We think we can, and indeed we can."}
            </p>
            <p className="font-body text-xs tracking-[0.22em] uppercase text-[hsl(43_78%_70%)] mt-6">
              {attribution || "— School Motto"}
            </p>
          </div>

          <Link to="/" className="inline-flex items-center gap-2 font-body text-[12px] tracking-[0.18em] uppercase text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to website
          </Link>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 md:p-10 lg:p-14">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthShell;
