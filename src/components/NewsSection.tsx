import { useEffect, useState } from "react";
import { ArrowRight, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Eyebrow, EditorialHeading } from "@/components/motion/Editorial";

const NewsSection = () => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("homepage_updates")
          .select("*")
          .eq("is_active", true)
          .order("display_order")
          .order("created_at", { ascending: false })
          .limit(6);
        if (err) setError(true);
        else setUpdates(data || []);
      } catch { setError(true); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-editorial">
        <div className="container mx-auto px-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--secondary))] mx-auto" />
        </div>
      </section>
    );
  }

  if (error || updates.length === 0) return null;

  const [feature, ...rest] = updates;

  return (
    <section className="py-24 md:py-32 bg-editorial">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <Reveal>
            <Eyebrow>From The School</Eyebrow>
            <EditorialHeading as="h2" size="lg" className="mt-5">
              Latest <em className="italic-accent">news</em> & updates.
            </EditorialHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              to="/news"
              className="group inline-flex items-center gap-2 font-body text-[12px] tracking-[0.18em] uppercase font-semibold text-foreground"
            >
              <span className="link-editorial">View all stories</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Featured */}
          <Reveal className="lg:col-span-7">
            <Link to="/news" className="group block">
              {feature.image_url ? (
                <div className="aspect-[16/10] overflow-hidden bg-[hsl(var(--muted))] mb-6">
                  <img
                    src={feature.image_url}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-juniper-depth mb-6" />
              )}
              <div className="flex items-center gap-3 text-muted-foreground mb-3">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-body text-[11px] tracking-[0.2em] uppercase">
                  {new Date(feature.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <h3 className="headline-editorial text-3xl md:text-4xl text-foreground mb-3 transition-colors group-hover:text-[hsl(var(--primary))]">
                {feature.title}
              </h3>
              <p className="lead line-clamp-3">{feature.description}</p>
            </Link>
          </Reveal>

          {/* List */}
          <Stagger className="lg:col-span-5 flex flex-col divide-y divide-[hsl(var(--rule))]">
            {rest.slice(0, 4).map((item) => (
              <StaggerItem key={item.id}>
                <Link to="/news" className="group block py-6 first:pt-0">
                  <div className="flex items-center gap-3 text-muted-foreground mb-2">
                    <Calendar className="w-3 h-3" />
                    <span className="font-body text-[10px] tracking-[0.2em] uppercase">
                      {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-semibold text-foreground transition-colors group-hover:text-[hsl(var(--primary))]">
                    {item.title}
                  </h4>
                  <p className="font-body text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
