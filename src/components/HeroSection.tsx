import { Link } from "react-router-dom";
import { FileText, GraduationCap, ChevronDown, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import schoolLogo from "@/assets/school-logo.png";
import { useParallax } from "@/hooks/useParallax";

const HeroSection = () => {
  const bgRef = useParallax<HTMLDivElement>(0.25);

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax Background */}
      <div ref={bgRef} className="absolute inset-0 parallax-bg">
        <img
          src={heroBg}
          alt="St. Mary's Campus"
          className="w-full h-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(212,100%,10%/0.92)] via-[hsl(212,100%,10%/0.78)] to-[hsl(212,100%,15%/0.92)]" />
        {/* Glowing orbs inside hero */}
        <div className="orb orb-gold w-[360px] h-[360px] top-1/4 -left-20 opacity-40" />
        <div className="orb orb-sky w-[320px] h-[320px] bottom-10 -right-16 opacity-40 animate-float-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
        {/* Motto pill */}
        <div className="mb-6 flex justify-center animate-fade-in-up">
          <span className="glass-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[hsl(47,100%,75%)] text-xs tracking-[3px] uppercase font-body font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Excellence & Integrity
          </span>
        </div>

        {/* Logo */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <img
            src={schoolLogo}
            alt="St. Mary's High School Crest"
            className="h-28 md:h-36 mx-auto drop-shadow-2xl"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          St. Mary's <span className="text-sheen">High School</span>
        </h1>

        <p className="font-display text-lg md:text-xl text-[hsl(47,100%,75%)] italic mb-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          "We Think We Can and Indeed We Can"
        </p>

        <p className="font-body text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in-up leading-relaxed drop-shadow-lg" style={{ animationDelay: "0.4s" }}>
          Founded in 1962, St. Mary's provides a transformative educational experience rooted in Christian values, academic excellence, and the spirit of Ubuntu.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.55s" }}>
          <Link
            to="/admissions"
            className="glass-shine bg-[hsl(47,100%,50%)] text-[hsl(212,100%,15%)] px-8 py-4 rounded-xl font-body font-bold text-lg hover:bg-[hsl(47,100%,58%)] transition-all hover:-translate-y-1 shadow-[0_10px_40px_-10px_hsl(47_100%_50%/0.6)] flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Apply Now
          </Link>
          <Link
            to="/about"
            className="glass-dark glass-shine text-white px-8 py-4 rounded-xl font-body font-bold text-lg hover:bg-white/15 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-5 h-5" />
            Learn More
          </Link>
        </div>

        {/* Glass stat cards */}
        <div className="mt-14 grid grid-cols-3 gap-3 md:gap-5 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
          {[
            { value: "63+", label: "Years" },
            { value: "1,261", label: "Students" },
            { value: "55", label: "Teachers" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="glass-dark glass-shine rounded-2xl px-3 py-4 md:px-5 md:py-5 hover:-translate-y-1 transition-transform duration-300"
              style={{ animationDelay: `${0.75 + i * 0.08}s` }}
            >
              <p className="font-display text-2xl md:text-3xl font-bold text-sheen">{s.value}</p>
              <p className="font-body text-[10px] md:text-xs text-white/70 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToAbout}
        aria-label="Scroll to next section"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 animate-bounce cursor-pointer hover:text-[hsl(47,100%,60%)] transition-colors"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
};

export default HeroSection;
