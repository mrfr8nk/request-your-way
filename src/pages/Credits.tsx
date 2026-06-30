import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Github, MessageCircle, MapPin, Code2, Globe, GraduationCap,
  Heart, ExternalLink, Mail, Calendar, Star, Zap, Cpu, Database, Palette,
  Shield, Smartphone, Server, Sparkles, Award, Rocket, Coffee, Users,
} from "lucide-react";
import developerImg from "@/assets/developer-darrell.jpg";
import Reveal from "@/components/motion/Reveal";

const skills = [
  { name: "React / TypeScript", icon: Code2, level: 95 },
  { name: "Tailwind CSS", icon: Palette, level: 97 },
  { name: "Supabase / PostgreSQL", icon: Database, level: 92 },
  { name: "Edge Functions / Deno", icon: Server, level: 88 },
  { name: "UI / UX Design", icon: Smartphone, level: 93 },
  { name: "Cybersecurity", icon: Shield, level: 84 },
  { name: "AI Integration", icon: Cpu, level: 90 },
  { name: "Full-Stack Architecture", icon: Zap, level: 92 },
];

const timeline = [
  { year: "2024 · Jan", event: "Founded the St. Mary's School Management vision", icon: Sparkles },
  { year: "2024 · Q2", event: "Shipped grades, attendance, and fee management modules", icon: Rocket },
  { year: "2024 · Q4", event: "AI Study Pal, smart search, biometric passkeys live", icon: Cpu },
  { year: "2025", event: "Real-time messaging, parent portal, WhatsApp bot", icon: MessageCircle },
  { year: "2026", event: "Editorial redesign, Google OAuth, broadcast pipeline", icon: Award },
];

const projectStats = [
  { label: "Lines of Code", value: "45k+", icon: Code2 },
  { label: "Database Tables", value: "40+", icon: Database },
  { label: "Edge Functions", value: "16", icon: Server },
  { label: "User Portals", value: "4", icon: Users },
];

const philosophy = [
  { title: "Build for real users", body: "Every screen ships with the parent, teacher, or student on the other end in mind — never the developer." },
  { title: "Security first", body: "RLS on every table. Passkeys. Audit trails. Privileged actions logged and attributed." },
  { title: "African-context UX", body: "Phone-first onboarding (+263 default), USD/ZiG dual currency, low-bandwidth assets." },
];

const Credits = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--paper))]">
      {/* Editorial Hero */}
      <div className="relative bg-gradient-to-br from-primary via-primary to-[hsl(215_60%_18%)] text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_30%,rgba(255,215,0,0.6),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,215,0,0.3),transparent_60%)]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" /%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\" opacity=\"0.4\"/%3E%3C/svg%3E')" }} />

        <div className="container mx-auto px-6 py-10 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors mb-12 text-sm tracking-wide">
            <ArrowLeft className="w-4 h-4" /> Back to website
          </Link>

          <div className="grid md:grid-cols-[auto_1fr] gap-10 md:gap-14 items-center pb-10">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative group mx-auto md:mx-0">
              <div className="absolute -inset-2 bg-gradient-to-r from-secondary via-accent to-secondary rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
              <img
                src={developerImg}
                alt="Darrell Mucheri"
                className="relative w-48 h-48 md:w-56 md:h-56 rounded-full object-cover border-[3px] border-secondary shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-primary flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="text-center md:text-left">
              <p className="font-accent italic text-secondary text-lg md:text-xl mb-2 tracking-wide">designed & engineered by</p>
              <h1 className="font-display text-5xl md:text-7xl font-bold mb-3 leading-[0.95]">Darrell <em className="font-accent text-secondary not-italic md:italic">Mucheri</em></h1>
              <p className="text-lg md:text-xl text-primary-foreground/85 mb-5 max-w-2xl">A Full-Stack Developer & 18-year-old student innovator from Zimbabwe, rebuilding how African schools meet the web.</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1"><GraduationCap className="w-3.5 h-3.5" /> Upper 6 Science</Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1"><MapPin className="w-3.5 h-3.5" /> Zimbabwe 🇿🇼</Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1"><Calendar className="w-3.5 h-3.5" /> Age 18</Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1"><Coffee className="w-3.5 h-3.5" /> Caffeine-driven</Badge>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <a href="https://github.com/mrfr8nk" target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="gap-2"><Github className="w-4 h-4" /> mrfr8nk</Button>
                </a>
                <a href="https://wa.me/263719647303" target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="gap-2 bg-green-500 hover:bg-green-600 text-white border-0"><MessageCircle className="w-4 h-4" /> WhatsApp</Button>
                </a>
                <a href="mailto:darrellmucheri@gmail.com">
                  <Button variant="outline" className="gap-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"><Mail className="w-4 h-4" /> Email</Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats band */}
        <div className="relative z-10 border-t border-primary-foreground/15 bg-black/15 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {projectStats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }} className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-secondary mb-1">
                  <s.icon className="w-4 h-4" />
                  <span className="text-xs font-accent italic tracking-wider opacity-80">{s.label}</span>
                </div>
                <p className="font-display text-3xl md:text-4xl font-bold">{s.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16 space-y-20 max-w-6xl">
        {/* About */}
        <Reveal>
          <section>
            <p className="eyebrow text-secondary mb-3">About</p>
            <h2 className="headline-editorial text-4xl md:text-5xl mb-6">A <em className="font-accent text-secondary">student</em> building software for students.</h2>
            <div className="grid md:grid-cols-2 gap-10 text-lg leading-relaxed text-muted-foreground">
              <p>
                I'm Darrell Mucheri, an 18-year-old Upper 6 Science student from Chitungwiza, Zimbabwe. I designed and engineered the entire <strong className="text-foreground">St. Mary's School Management System</strong> from the ground up — every database table, every edge function, every pixel.
              </p>
              <p>
                What started as a school project became a full platform: grades, attendance, fees, AI study tools, real-time messaging, parent portal, WhatsApp bot, biometric passkeys, and more. My mission is to give African schools world-class software they actually own.
              </p>
            </div>
          </section>
        </Reveal>

        {/* Philosophy */}
        <Reveal>
          <section>
            <p className="eyebrow text-secondary mb-3">Philosophy</p>
            <h2 className="headline-editorial text-3xl md:text-4xl mb-8">Three principles, every line.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {philosophy.map((p) => (
                <Card key={p.title} className="bg-card">
                  <CardContent className="p-7">
                    <h3 className="font-display text-xl font-semibold mb-3">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Skills */}
        <Reveal>
          <section>
            <p className="eyebrow text-secondary mb-3">Craft</p>
            <h2 className="headline-editorial text-3xl md:text-4xl mb-8 flex items-center gap-3">
              <Code2 className="w-8 h-8 text-primary" /> Technical Skills
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {skills.map((skill, i) => (
                <motion.div key={skill.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <skill.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground text-sm">{skill.name}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }} whileInView={{ width: `${skill.level}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.1 + i * 0.05, ease: [0.2, 0.65, 0.3, 0.9] }}
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                        />
                      </div>
                      <p className="text-right text-xs text-muted-foreground mt-1.5 font-mono">{skill.level}%</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* GitHub */}
        <Reveal>
          <section>
            <p className="eyebrow text-secondary mb-3">Output</p>
            <h2 className="headline-editorial text-3xl md:text-4xl mb-6 flex items-center gap-3"><Github className="w-8 h-8" /> GitHub Activity</h2>
            <Card>
              <CardContent className="p-6">
                <div className="rounded-xl overflow-hidden border border-border bg-card">
                  <img src="https://ghchart.rshah.org/003366/mrfr8nk" alt="Darrell Mucheri's GitHub Contribution Chart" className="w-full" />
                </div>
                <div className="mt-5">
                  <a href="https://github.com/mrfr8nk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                    <ExternalLink className="w-4 h-4" /> View Full Profile on GitHub
                  </a>
                </div>
              </CardContent>
            </Card>
          </section>
        </Reveal>

        {/* Timeline */}
        <Reveal>
          <section>
            <p className="eyebrow text-secondary mb-3">Journey</p>
            <h2 className="headline-editorial text-3xl md:text-4xl mb-8 flex items-center gap-3"><Calendar className="w-8 h-8 text-accent" /> Development Timeline</h2>
            <div className="relative pl-8 space-y-7 border-l-2 border-border">
              {timeline.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative">
                  <div className="absolute -left-[42px] w-9 h-9 rounded-full bg-primary border-4 border-background flex items-center justify-center shadow-md">
                    <item.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <Badge variant="outline" className="mb-2 font-mono text-xs">{item.year}</Badge>
                  <p className="text-foreground text-lg">{item.event}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Stack */}
        <Reveal>
          <Card>
            <CardContent className="p-8">
              <p className="eyebrow text-secondary mb-3">Built With</p>
              <h2 className="font-display text-2xl font-bold text-foreground mb-5 flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" /> Technology Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {["React 18", "TypeScript", "Tailwind CSS", "Vite", "Supabase", "PostgreSQL", "Deno Edge Functions", "Lovable AI", "pdf-lib", "Recharts", "React Router", "Tanstack Query", "Framer Motion", "shadcn/ui", "Google OAuth", "WhatsApp Cloud API", "Resend", "Capacitor"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-sm py-1.5 px-3 font-medium">{tech}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Copyright */}
        <Reveal>
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
            <CardContent className="p-8">
              <h2 className="font-display text-2xl font-bold text-foreground mb-5 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" /> Copyright & Legal
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>© {new Date().getFullYear()} <strong className="text-foreground">Darrell Mucheri</strong>. All rights reserved.</p>
                <p>
                  The <strong className="text-foreground">St. Mary's School Management System</strong> is proprietary software designed and developed by Darrell Mucheri. Unauthorized copying, distribution, modification, reverse-engineering, or rebranding of this software is strictly prohibited.
                </p>
                <p className="text-sm">
                  This software is provided "as-is" without warranty of any kind, express or implied. The developer is not liable for any damages arising from the use of this software.
                </p>
                <div className="pt-3 flex flex-wrap gap-4 text-sm border-t border-border mt-4">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Chitungwiza, Zimbabwe 🇿🇼</span>
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-primary" /> darrellmucheri@gmail.com</span>
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-primary" /> +263 719 647 303</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-lg">
            Made with <Heart className="w-5 h-5 text-destructive fill-destructive" /> in Zimbabwe by <strong className="text-foreground">Darrell Mucheri</strong>
          </p>
          <Link to="/" className="text-primary hover:underline mt-3 inline-block">← Back to St. Mary's</Link>
        </div>
      </div>
    </div>
  );
};

export default Credits;
