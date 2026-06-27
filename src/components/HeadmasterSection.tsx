import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultHeadmasterImg from "@/assets/headmaster.jpg";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/motion/Editorial";

const HeadmasterSection = () => {
  const [headmaster, setHeadmaster] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("staff_gallery")
      .select("*")
      .eq("is_active", true)
      .or("position.ilike.%head master%,position.ilike.%headmaster%,position.ilike.%head%master%")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setHeadmaster(data); });
  }, []);

  const imgSrc = headmaster?.image_url || defaultHeadmasterImg;
  const name = headmaster?.name || "Mr. Nyabako";
  const title = headmaster?.position || "Head Master";

  return (
    <section className="py-24 md:py-32 bg-juniper-depth relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(43_78%_50%/0.06)] rounded-full blur-3xl" aria-hidden />
      <div className="container mx-auto px-6 md:px-10 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <Reveal className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 border border-[hsl(43_78%_55%/0.3)] hidden md:block" aria-hidden />
              <img
                src={imgSrc}
                alt={`${name} — ${title}`}
                className="relative w-full h-[480px] md:h-[600px] object-cover grayscale-[20%] shadow-editorial"
              />
              <div className="absolute -bottom-4 -right-4 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] px-5 py-3 hidden md:block">
                <p className="font-body text-[11px] tracking-[0.2em] uppercase font-semibold">{title}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-7 text-white">
            <Eyebrow className="!text-[hsl(43_78%_65%)]">A Message From The Head</Eyebrow>

            <div className="mt-8 relative">
              <span className="font-accent italic text-[140px] leading-none text-[hsl(43_78%_55%/0.25)] absolute -top-12 -left-4 select-none">"</span>
              <blockquote className="relative font-accent italic text-2xl md:text-3xl lg:text-4xl leading-[1.35] text-white/95 max-w-2xl">
                {headmaster?.bio
                  ? headmaster.bio.split("\n").filter(Boolean)[0]
                  : "St. Mary's has been and will remain a fountain of wisdom — and it is the wise who will drink from it."}
              </blockquote>
            </div>

            {headmaster?.bio && headmaster.bio.split("\n").filter(Boolean).slice(1, 3).map((p: string, i: number) => (
              <p key={i} className="font-body text-white/70 leading-relaxed mt-5 max-w-2xl">{p}</p>
            ))}

            {!headmaster?.bio && (
              <>
                <p className="font-body text-white/70 leading-relaxed mt-6 max-w-2xl">
                  Our success is rooted in an ever-deepening culture of industry and a hard-working
                  team of tried and tested professionals.
                </p>
                <p className="font-body text-white/70 leading-relaxed mt-4 max-w-2xl">
                  Guided by our motto — <em className="font-accent text-[hsl(43_78%_70%)]">"We Think We Can and Indeed We Can"</em> —
                  I invite you to join a community where excellence is a way of life.
                </p>
              </>
            )}

            <div className="mt-10 pt-6 border-t border-white/15 max-w-md">
              <p className="font-display text-xl text-white">{name}</p>
              <p className="font-body text-sm text-white/55 tracking-wide mt-1">{title} · St. Mary's High School</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default HeadmasterSection;
