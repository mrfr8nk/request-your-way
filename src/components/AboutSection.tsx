import { Link } from "react-router-dom";
import aboutImg from "@/assets/about-school.jpg";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const AboutSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="about" className="relative py-24">
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="glass-pill inline-block px-4 py-1.5 rounded-full text-xs uppercase tracking-[3px] font-semibold text-primary mb-4">About</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">Our Story</h2>
          <div className="w-16 h-1 bg-secondary mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div
            className={`glass-card glass-shine overflow-hidden p-2 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            <img
              src={aboutImg}
              alt="St. Mary's students"
              className="w-full h-80 object-cover rounded-xl"
            />
          </div>

          <div
            className={`glass-card p-8 md:p-10 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <h3 className="font-display text-2xl md:text-3xl font-bold text-primary mb-4">
              63 Years of <span className="text-sheen">Excellence</span> & Ubuntu
            </h3>
            <p className="font-body text-muted-foreground mb-4 leading-relaxed">
              Founded in 1962 by the Anglican Diocese of Harare (C.P.C.A), St. Mary's High School has been a beacon of academic excellence for 63 years. From humble beginnings with 70 male boarding students and 3 teachers, we have grown into a thriving institution serving 1,261 students with a dedicated staff of 55 teachers.
            </p>
            <p className="font-body text-muted-foreground mb-6 leading-relaxed">
              Our school was founded on solid Christian principles, striving to produce highly intellectual, God-fearing, and morally upright students guided by the virtues of Unhu/Ubuntu.
            </p>
            <Link
              to="/about"
              className="glass-shine inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-body font-semibold hover:opacity-95 transition-all hover:-translate-y-0.5"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
