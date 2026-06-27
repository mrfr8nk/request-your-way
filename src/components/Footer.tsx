import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Youtube, ArrowUpRight } from "lucide-react";
import schoolLogo from "@/assets/school-logo.png";

const Footer = () => {
  return (
    <footer className="bg-gradient-footer text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(43_78%_50%/0.05)] rounded-full blur-3xl" aria-hidden />
      <div className="container mx-auto px-6 md:px-10 pt-20 pb-10 relative z-10">
        {/* Top wordmark */}
        <div className="pb-12 border-b border-white/15 grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-7">
            <div className="flex items-center gap-4 mb-6">
              <img src={schoolLogo} alt="St. Mary's" className="h-14 w-14 object-contain" />
              <div className="leading-tight">
                <p className="font-display text-2xl font-semibold">St. Mary's High School</p>
                <p className="font-accent italic text-sm text-white/55">Excellence & Integrity · Est. 1962</p>
              </div>
            </div>
            <p className="headline-editorial text-3xl md:text-4xl max-w-2xl">
              "We Think We Can <em className="italic-accent">and Indeed We Can.</em>"
            </p>
          </div>
          <div className="md:col-span-5 md:text-right">
            <Link
              to="/admissions"
              className="group inline-flex items-center gap-3 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] px-7 py-3.5 font-body text-[12px] tracking-[0.18em] uppercase font-semibold transition-all duration-500 ease-editorial hover:bg-white hover:gap-4"
            >
              Begin admissions
              <ArrowUpRight className="w-4 h-4 transition-transform duration-500 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* Columns */}
        <div className="grid md:grid-cols-12 gap-10 py-14">
          <div className="md:col-span-4">
            <p className="font-body text-[10px] tracking-[0.28em] uppercase text-[hsl(43_78%_65%)] font-semibold mb-5">Visit</p>
            <div className="space-y-3 font-body text-sm text-white/70">
              {[
                { icon: MapPin, text: "Harare, Chitungwiza Zengeza 1" },
                { icon: Phone, text: "+263 719 647 303" },
                { icon: Mail, text: "stmaryssecondary62@gmail.com" },
                { icon: Clock, text: "Mon–Fri: 8:00 AM – 4:00 PM" },
              ].map(({ icon: Icon, text }, i) => (
                <p key={i} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 mt-0.5 text-[hsl(43_78%_65%)] flex-shrink-0" />
                  <span>{text}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="md:col-span-4">
            <p className="font-body text-[10px] tracking-[0.28em] uppercase text-[hsl(43_78%_65%)] font-semibold mb-5">Explore</p>
            <ul className="font-body space-y-2.5 text-sm">
              {[
                { label: "About Us", path: "/about" },
                { label: "Admissions", path: "/admissions" },
                { label: "Our Staff", path: "/staff" },
                { label: "Gallery", path: "/gallery" },
                { label: "News & Events", path: "/news" },
                { label: "Contact", path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/70 hover:text-[hsl(43_78%_70%)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="font-body text-[10px] tracking-[0.28em] uppercase text-[hsl(43_78%_65%)] font-semibold mb-5">Follow</p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-11 h-11 border border-white/20 flex items-center justify-center hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary-foreground))] hover:border-[hsl(var(--secondary))] transition-all duration-500 ease-editorial"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <p className="font-body text-sm text-white/55 mt-6 leading-relaxed">
              Join a community of <em className="font-accent">scholars, mentors,</em> and <em className="font-accent">alumni</em>
              committed to lifelong learning.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/15 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-white/50">© {new Date().getFullYear()} St. Mary's High School. All rights reserved.</p>
          <p className="font-body text-xs text-white/40">
            Crafted with care by{" "}
            <Link to="/credits" className="text-[hsl(43_78%_65%)] hover:underline">Darrell Mucheri</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
