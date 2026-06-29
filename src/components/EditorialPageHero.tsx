import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  italic?: string;
  image?: string;
}

const EditorialPageHero = ({ eyebrow, title, subtitle, italic, image }: Props) => (
  <section className="relative pt-16">
    <div className="relative h-[55vh] min-h-[420px] overflow-hidden bg-[hsl(215_60%_8%)]">
      <img src={image || heroBg} alt="" className="absolute inset-0 w-full h-full object-cover ken-burns" />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(215_60%_8%/0.55)] via-[hsl(215_60%_8%/0.4)] to-[hsl(215_60%_8%/0.85)]" />
      <div className="relative z-10 h-full flex items-end pb-16 md:pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl text-white"
          >
            {eyebrow && (
              <p className="font-body text-[11px] tracking-[0.32em] uppercase text-[hsl(43_78%_70%)] mb-5">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.05] mb-4">
              {title}
              {italic && (
                <span className="font-accent italic font-normal text-[hsl(43_78%_70%)]"> {italic}</span>
              )}
            </h1>
            {subtitle && (
              <p className="font-body text-lg md:text-xl text-white/75 max-w-2xl leading-relaxed mt-4">
                {subtitle}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);

export default EditorialPageHero;
