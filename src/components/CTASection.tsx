import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/motion/Editorial";

const CTASection = () => {
  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-cta" />
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <Eyebrow center className="!text-[hsl(43_78%_65%)]">Admissions Open</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="headline-editorial text-white text-5xl md:text-7xl lg:text-8xl mt-8 mb-8">
              Begin your <em className="italic-accent">St. Mary's</em> story.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="font-body text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Applications for the 2025–2026 academic year are now being accepted.
              We welcome scholars of all backgrounds who are ready to be challenged and changed.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <Link
                to="/admissions"
                className="group inline-flex items-center justify-center gap-3 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] px-9 py-4 font-body text-[13px] tracking-[0.16em] uppercase font-semibold transition-all duration-500 ease-editorial hover:bg-white hover:gap-4"
              >
                Apply Now
                <ArrowRight className="w-4 h-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
              </Link>
              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-3 border border-white/30 text-white px-9 py-4 font-body text-[13px] tracking-[0.16em] uppercase font-medium transition-all duration-500 ease-editorial hover:border-white/70 hover:bg-white/5"
              >
                Schedule a visit
                <ArrowRight className="w-4 h-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
