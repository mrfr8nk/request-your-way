import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, ArrowRight, ChevronDown } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const reduce = useReducedMotion();

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  const stats = [
    { value: "63", suffix: "yrs", label: "Of excellence" },
    { value: "1,261", label: "Students" },
    { value: "55", label: "Faculty" },
    { value: "98%", label: "Pass rate" },
  ];

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-[hsl(215_60%_8%)]">
      {/* Full-bleed Ken Burns image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="St. Mary's High School campus"
          className={`w-full h-full object-cover ${reduce ? "" : "ken-burns"}`}
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-10 pb-16 md:pb-24 pt-32">
        <div className="max-w-4xl">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <span className="eyebrow" style={{ color: "hsl(43 78% 65%)" }}>
              <span style={{ background: "hsl(43 78% 65%)" }} />
              Founded 1962 · Anglican Diocese of Harare
            </span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="headline-editorial text-white text-5xl sm:text-6xl md:text-7xl lg:text-[88px] mb-6"
          >
            An education
            <br />
            for <span className="italic-accent">life</span>.
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="font-body text-white/85 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
          >
            For sixty-three years, St. Mary's has shaped scholars, leaders, and people of conscience —
            rooted in Christian values and the spirit of <em className="font-accent text-[hsl(43_78%_70%)]">Ubuntu</em>.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/admissions"
              className="group inline-flex items-center justify-center gap-3 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] px-8 py-4 font-body font-semibold text-base tracking-wide transition-all duration-500 ease-editorial hover:bg-white hover:gap-4"
            >
              <FileText className="w-4 h-4" />
              Begin admissions
              <ArrowRight className="w-4 h-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="group inline-flex items-center justify-center gap-3 border border-white/30 text-white px-8 py-4 font-body font-medium text-base tracking-wide transition-all duration-500 ease-editorial hover:bg-white/10 hover:border-white/60"
            >
              Discover our story
              <ArrowRight className="w-4 h-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Stat strip — Juniper-style band */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/15 border-t border-b border-white/15"
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-[hsl(215_60%_8%/0.5)] backdrop-blur-sm px-5 py-6 md:px-7 md:py-8">
              <p className="headline-editorial text-white text-3xl md:text-5xl">
                {s.value}
                {s.suffix && <span className="font-accent italic text-xl md:text-2xl text-[hsl(43_78%_65%)] ml-1">{s.suffix}</span>}
              </p>
              <p className="font-body text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-white/60 mt-2">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <button
        onClick={scrollToAbout}
        aria-label="Scroll to next section"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-[hsl(43_78%_65%)] transition-colors animate-bounce"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </section>
  );
};

export default HeroSection;
