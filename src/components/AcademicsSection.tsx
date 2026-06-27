import { Link } from "react-router-dom";
import { FlaskConical, Paintbrush, TrendingUp, ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Eyebrow, EditorialHeading } from "@/components/motion/Editorial";

const programs = [
  {
    icon: FlaskConical,
    no: "01",
    title: "Sciences",
    description: "Rigorous STEM grounding — biology, chemistry, physics, and computer studies — taught in modern, well-equipped laboratories.",
  },
  {
    icon: Paintbrush,
    no: "02",
    title: "Arts & Humanities",
    description: "Literature, history, religious studies and the creative arts — a curriculum that cultivates imagination and conscience.",
  },
  {
    icon: TrendingUp,
    no: "03",
    title: "Commercials",
    description: "Accounts, business studies, and economics. Preparing tomorrow's analysts, founders, and stewards of public life.",
  },
];

const AcademicsSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-[hsl(var(--background))]">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <Reveal className="lg:col-span-5">
            <Eyebrow>Academic Programs</Eyebrow>
            <EditorialHeading as="h2" size="lg" className="mt-5">
              Three paths.
              <br />
              One <em className="italic-accent">standard</em>.
            </EditorialHeading>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7 flex items-end">
            <p className="lead">
              From ZJC through A-Level, our ZIMSEC-aligned curriculum prepares pupils for
              university and the world beyond — without ever losing the human touch.
            </p>
          </Reveal>
        </div>

        <Stagger className="grid md:grid-cols-3 gap-px bg-[hsl(var(--rule))] border-y border-[hsl(var(--rule))]">
          {programs.map((p) => (
            <StaggerItem key={p.title} className="group bg-[hsl(var(--card))] p-8 md:p-10 transition-colors duration-500 hover:bg-[hsl(var(--muted))]">
              <div className="flex items-baseline justify-between mb-10">
                <span className="font-accent italic text-2xl text-[hsl(var(--secondary))]">— {p.no}</span>
                <p.icon className="w-5 h-5 text-foreground/40 transition-transform duration-500 ease-editorial group-hover:rotate-12 group-hover:text-[hsl(var(--secondary))]" />
              </div>
              <h3 className="headline-editorial text-3xl md:text-4xl text-foreground mb-4">{p.title}</h3>
              <p className="font-body text-muted-foreground leading-relaxed mb-8">{p.description}</p>
              <Link
                to="/admissions"
                className="inline-flex items-center gap-2 font-body text-[12px] tracking-[0.18em] uppercase font-semibold text-foreground"
              >
                <span className="link-editorial">Explore</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-500 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
};

export default AcademicsSection;
