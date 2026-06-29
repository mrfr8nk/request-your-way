import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EditorialPageHero from "@/components/EditorialPageHero";
import { Reveal } from "@/components/motion/Reveal";

const News = () => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("homepage_updates")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUpdates(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      <EditorialPageHero
        eyebrow="Latest Stories"
        title="News"
        italic="& Events"
        subtitle="Stay informed with the latest happenings, achievements, and announcements from St. Mary's."
      />

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : updates.length === 0 ? (
            <Reveal>
              <div className="text-center py-20 text-muted-foreground">
                <p className="font-body text-lg">No news updates yet. Check back soon!</p>
              </div>
            </Reveal>
          ) : (
            <div className="space-y-8">
              {updates.map((item, idx) => (
                <Reveal key={item.id} delay={idx * 0.05}>
                  <article className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border group">
                    {item.image_url && (
                      <div className="h-56 overflow-hidden">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-8">
                      <p className="font-body text-xs tracking-[0.28em] uppercase text-[hsl(43_78%_55%)] mb-3">
                        {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <h2 className="font-display text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">{item.title}</h2>
                      <p className="font-body text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default News;
