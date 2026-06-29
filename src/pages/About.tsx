import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import aboutImg from "@/assets/about-school.jpg";
import EditorialPageHero from "@/components/EditorialPageHero";
import { Reveal } from "@/components/motion/Reveal";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <EditorialPageHero
        eyebrow="Our Heritage"
        title="About St. Mary's"
        italic="High School"
        subtitle="A beacon of academic excellence, faith, and wholesome character since 1962."
      />

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-4xl">
          <Reveal>
            <div className="mb-14">
              <img src={aboutImg} alt="Students" className="w-full h-72 object-cover rounded-2xl shadow-card-hover mb-10" />
              <p className="eyebrow mb-3">Our Story</p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-6">
                Our <span className="font-accent italic text-[hsl(43_78%_55%)]">History</span>
              </h2>
              <div className="font-body text-muted-foreground space-y-4 leading-relaxed">
                <p>
                  Founded in 1962 by the Anglican Diocese of Harare (C.P.C.A), St. Mary's High School has been a beacon of academic excellence for over 63 years. From humble beginnings with 70 male boarding students and 3 teachers including our founder Principal Mr. WF Hall, we have grown into a thriving institution serving 1,261 students (607 male, 654 female) with a dedicated staff of 55 teachers.
                </p>
                <p>
                  Our school was founded on solid Christian principles with no prejudice intended against non-Christians, striving to produce highly intellectual, God-fearing, and morally upright students who have love, respect, and endeavor to work hard at all times. We are guided by the virtues of Unhu/Ubuntu, producing wholesome and useful citizens of Zimbabwe.
                </p>
                <p>
                  St. Mary's provides an all-round education through academic, sporting, and cultural activities, enabling each student to achieve their full potential. In line with Education 5.0, we emphasize practical subjects and life skills while involving parents and guardians in the learning process.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { stat: "1,261", label: "Students" },
                { stat: "55", label: "Dedicated Teachers" },
                { stat: "63+", label: "Years of Excellence" },
              ].map((item) => (
                <div key={item.label} className="bg-primary text-center py-10 px-4 rounded-2xl">
                  <p className="font-display text-4xl font-semibold text-primary-foreground mb-2">{item.stat}</p>
                  <p className="font-body text-primary-foreground/80">{item.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
