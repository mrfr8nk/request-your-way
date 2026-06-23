import { Link } from "react-router-dom";
import { FileText, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useParallax } from "@/hooks/useParallax";

const CTASection = () => {
  const { ref, isVisible } = useScrollReveal();
  const bgRef = useParallax<HTMLDivElement>(0.2);

  return (
    <section className="relative py-28 overflow-hidden">
      <div ref={bgRef} className="absolute inset-0 parallax-bg">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-cta" />
      </div>

      <div className="relative z-10 container mx-auto px-4" ref={ref}>
        <div
          className={`glass-dark mx-auto max-w-3xl rounded-3xl p-8 md:p-14 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
          }`}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-5">
            Ready to Join the <span className="text-sheen">St. Mary's Family?</span>
          </h2>
          <p className="font-body text-base md:text-lg text-white/80 max-w-xl mx-auto mb-10">
            Applications for the 2025–2026 school year are now being accepted.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/admissions"
              className="glass-shine bg-secondary text-secondary-foreground px-8 py-4 rounded-xl font-body font-bold text-lg hover:opacity-95 transition-all hover:-translate-y-1 shadow-[0_10px_40px_-10px_hsl(47_100%_50%/0.6)] flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Apply Now
            </Link>
            <Link
              to="/admissions#pass-rates"
              className="glass-shine bg-white/10 text-white border border-white/30 px-8 py-4 rounded-xl font-body font-bold text-lg hover:bg-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              View Pass Rates
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
