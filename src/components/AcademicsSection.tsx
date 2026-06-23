import { FlaskConical, Paintbrush, TrendingUp } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const programs = [
  {
    icon: FlaskConical,
    title: "Science",
    description: "Our STEM programs prepare students for careers in science, technology, engineering, and mathematics with state-of-the-art labs.",
  },
  {
    icon: Paintbrush,
    title: "Arts & Humanities",
    description: "From visual arts to performing arts and literature, our comprehensive humanities program fosters creativity and critical thinking.",
  },
  {
    icon: TrendingUp,
    title: "Commercial Sciences",
    description: "Our Commercial Sciences program follows the ZIMSEC curriculum, preparing students for careers in business, accounting, and economics.",
  },
];

const AcademicsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center mb-14 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="glass-pill inline-block px-4 py-1.5 rounded-full text-xs uppercase tracking-[3px] font-semibold text-primary mb-4">Academics</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">Our Programs</h2>
          <div className="w-16 h-1 bg-secondary mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {programs.map((program, i) => (
            <div
              key={program.title}
              className={`glass-card glass-shine p-8 group transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
              style={{ transitionDelay: isVisible ? `${200 + i * 150}ms` : "0ms" }}
            >
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(47,100%,55%)] to-[hsl(43,96%,65%)] flex items-center justify-center mb-6 shadow-[0_8px_24px_-6px_hsl(47_100%_50%/0.5)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <program.icon className="w-8 h-8 text-[hsl(212,100%,15%)]" />
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-3">{program.title}</h3>
              <p className="font-body text-muted-foreground leading-relaxed">{program.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AcademicsSection;
