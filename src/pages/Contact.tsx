import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import EditorialPageHero from "@/components/EditorialPageHero";
import { Reveal } from "@/components/motion/Reveal";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent!", description: "We'll get back to you soon." });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <EditorialPageHero
        eyebrow="Get in Touch"
        title="Contact"
        italic="Us"
        subtitle="We'd love to hear from you — reach out with questions, inquiries, or to schedule a visit."
      />

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto">
            {/* Contact Info */}
            <Reveal>
              <div>
                <p className="eyebrow mb-3">Reach Us</p>
                <h2 className="font-display text-3xl font-semibold text-foreground mb-8">
                  Get <span className="font-accent italic text-[hsl(43_78%_55%)]">In Touch</span>
                </h2>
                <div className="space-y-6">
                  {[
                    { icon: MapPin, label: "Address", value: "Harare, Chitungwiza Zengeza 1, Zimbabwe" },
                    { icon: Phone, label: "Phone", value: "+263 719 647 303" },
                    { icon: Mail, label: "Email", value: "info@stmaryshs.edu" },
                    { icon: Clock, label: "Office Hours", value: "Mon-Fri: 8:00 AM - 4:30 PM" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-body font-semibold text-foreground">{label}</p>
                        <p className="font-body text-muted-foreground">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Contact Form */}
            <Reveal delay={0.1}>
              <div>
                <p className="eyebrow mb-3">Write to Us</p>
                <h2 className="font-display text-3xl font-semibold text-foreground mb-8">
                  Send a <span className="font-accent italic text-[hsl(43_78%_55%)]">Message</span>
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <textarea
                    placeholder="Your Message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-body font-semibold hover:opacity-90 transition-opacity"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
