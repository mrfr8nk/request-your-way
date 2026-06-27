import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, X } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Eyebrow, EditorialHeading } from "@/components/motion/Editorial";

const GallerySection = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("staff_gallery")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .order("created_at")
      .limit(6)
      .then(({ data }) => setStaff(data || []));
  }, []);

  const hasStaff = staff.length > 0;
  if (!hasStaff) return null;

  // Slight tilt for each card — Juniper-style
  const tilts = ["-1deg", "1.5deg", "-2deg", "1deg", "-1.5deg", "2deg"];

  return (
    <section className="py-24 md:py-32 bg-[hsl(var(--muted))]">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <Reveal className="lg:col-span-6">
            <Eyebrow>Our Faculty</Eyebrow>
            <EditorialHeading as="h2" size="lg" className="mt-5">
              People who shape <em className="italic-accent">people</em>.
            </EditorialHeading>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8 flex items-end">
            <p className="lead">
              Meet a few of the dedicated educators who carry the St. Mary's tradition forward each day.
            </p>
          </Reveal>
        </div>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {staff.map((member, i) => (
            <StaggerItem key={member.id}>
              <button
                onClick={() => member.bio && setSelectedStaff(member)}
                className="group block w-full text-left tilt-card bg-[hsl(var(--card))]"
                style={{ transform: `rotate(${tilts[i % tilts.length]})` }}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--muted))]">
                  {member.category === "admin" && (
                    <span className="absolute top-4 left-4 z-10 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] px-3 py-1 font-body text-[10px] tracking-[0.18em] uppercase font-semibold">
                      {member.position}
                    </span>
                  )}
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-[1200ms] ease-editorial group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[hsl(215_60%_8%/0.85)] to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h3 className="font-display text-xl font-semibold">{member.name}</h3>
                    <p className="font-accent italic text-sm text-[hsl(43_78%_75%)] mt-0.5">{member.position}</p>
                    {(member.subject || member.department) && (
                      <p className="font-body text-xs text-white/70 mt-1 tracking-wide">{member.subject || member.department}</p>
                    )}
                  </div>
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Modal */}
      {selectedStaff && (
        <div
          className="fixed inset-0 z-[100] bg-[hsl(215_60%_8%/0.85)] backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedStaff(null)}
        >
          <div
            className="bg-[hsl(var(--card))] max-w-2xl w-full max-h-[90vh] overflow-y-auto editorial-frame animate-scale-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedStaff(null)}
              className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 md:p-10">
              <div className="flex items-start gap-6 mb-6 flex-col sm:flex-row">
                {selectedStaff.image_url ? (
                  <img src={selectedStaff.image_url} alt={selectedStaff.name} className="w-28 h-28 object-cover" />
                ) : (
                  <div className="w-28 h-28 bg-[hsl(var(--muted))] flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Eyebrow>{selectedStaff.department || "Faculty"}</Eyebrow>
                  <h3 className="headline-editorial text-3xl text-foreground mt-3">{selectedStaff.name}</h3>
                  <p className="font-accent italic text-lg text-[hsl(var(--secondary))]">{selectedStaff.position}</p>
                </div>
              </div>
              {selectedStaff.bio && <p className="font-body text-muted-foreground leading-relaxed">{selectedStaff.bio}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
