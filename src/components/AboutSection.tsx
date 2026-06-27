import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import aboutImg from "@/assets/about-school.jpg";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow, EditorialHeading } from "@/components/motion/Editorial";

const AboutSection = () => {
  return (
    <section id="about" className="relative py-24 md:py-32 bg-editorial">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Image column — tilted, layered */}
          <div className="lg:col-span-7 relative">
            <Reveal y={32} duration={0.8}>
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-32 h-32 border border-[hsl(var(--secondary)/0.5)] hidden md:block" aria-hidden />
                <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-[hsl(var(--secondary)/0.12)] hidden md:block" aria-hidden />
                <div className="relative overflow-hidden editorial-frame">
                  <img
                    src={aboutImg}
                    alt="St. Mary's students"
                    className="w-full h-[420px] md:h-[560px] object-cover transition-transform duration-[1200ms] ease-editorial hover:scale-[1.04]"
                  />
                </div>
                <div className="hidden md:flex absolute -bottom-8 -right-2 bg-[hsl(var(--primary))] text-white px-8 py-6 shadow-tilt items-baseline gap-3">
                  <span className="headline-editorial text-5xl">63</span>
                  <span className="font-accent italic text-lg text-[hsl(43_78%_70%)]">years of legacy</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Text column */}
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow>About Our School</Eyebrow>
              <EditorialHeading as="h2" size="md" className="mt-5">
                A tradition of <em className="italic-accent">scholarship</em> and Ubuntu.
              </EditorialHeading>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-6 rule-hairline" />
              <p className="lead mt-6">
                Founded in 1962 by the Anglican Diocese of Harare, St. Mary's has grown from
                70 boarding pupils into a thriving community of 1,261 students guided by 55 educators.
              </p>
              <p className="lead mt-4">
                We hold to Christian principles and the virtues of <em className="font-accent">Unhu/Ubuntu</em> —
                forming students who are intellectually rigorous, morally grounded, and deeply human.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <Link
                to="/about"
                className="group inline-flex items-center gap-3 mt-10 font-body text-[13px] tracking-[0.16em] uppercase font-semibold text-foreground"
              >
                <span className="link-editorial">Read our full history</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
