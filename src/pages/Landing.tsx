import { useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Zap, Globe, Sparkles, Code } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import logo from "@/assets/logo.png";



function Counter({ from, to }: { from: number; to: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration: 2.5,
      ease: "easeOut",
      onUpdate(value: number) {
        node.textContent = Math.round(value).toLocaleString();
      },
    });

    return () => controls.stop();
  }, [from, to]);

  return <span ref={nodeRef} className="tabular-nums" />;
}

export default function Landing() {
  const { user } = useAuth();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  // Simplified scroll transforms for better performance
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.5]);

  useEffect(() => {
    trackEvent("page_view_landing");
  }, []);

  return (
    <div className="min-h-screen abstract-bg font-sans text-foreground overflow-hidden">
      {/* 3D Background Element */}


      {/* Decorative Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -translate-x-1/3 -translate-y-1/3 transform-gpu" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[80px] translate-x-1/4 translate-y-1/4 transform-gpu" />
      </div>

      <div className="relative z-10" ref={targetRef}>
        {/* Navbar for logged-in users visiting the landing page */}
        {user && <Navbar />}

        {/* Custom Header for Landing - Only for unlogged users */}
        {!user && (
          <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center relative z-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={logo} alt="FindATeammate Logo" className="h-8 sm:h-10 lg:h-12 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg sm:text-2xl text-foreground tracking-tight">
                  Find<span className="text-primary">A</span>Teammate
                </span>
                <span className="text-[10px] sm:text-xs font-medium opacity-50 -mt-1">by Ahi<span className="text-primary">X</span>light</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:flex font-bold hover:bg-primary/10 text-foreground">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full font-bold px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">Join Now</Button>
              </Link>
            </div>
          </header>
        )}

        {/* HERO SECTION */}
        <main className="container mx-auto px-4 pt-16 pb-32 text-center lg:text-left lg:flex lg:items-center lg:gap-20">
          <motion.div
            style={{ y, opacity }}
            className="lg:w-1/2 space-y-8 relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/50 border border-border/40 text-sm font-bold text-primary mb-8 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>The #1 Networking Site for Builders</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black leading-[1.05] mb-6 sm:mb-8 tracking-tight text-foreground">
                Build your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer bg-[length:300%_auto]">dream team</span>.
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Stop building alone. Connect with developers, designers, and visionaries for hackathons, startups, and side projects at ease.
              </p>
            </motion.div>


            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  onClick={() => trackEvent("hero_click_browse")}
                  className="rounded-full text-lg h-16 px-10 shadow-xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 border-none"
                >
                  Start Browsing <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            {/* LIVE COUNT UP STATS */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="pt-12 flex items-center gap-12 justify-center lg:justify-start"
            >
              <div className="flex flex-col min-w-[100px]">
                <span className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent flex items-center">
                  <Counter from={0} to={2500} />+
                </span>
                <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Builders</span>
              </div>
              <div className="w-px h-12 bg-border/50" />
              <div className="flex flex-col min-w-[100px]">
                <span className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent flex items-center">
                  <Counter from={0} to={850} />+
                </span>
                <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Projects</span>
              </div>
              <div className="w-px h-12 bg-border/50" />
          </motion.div>
        </motion.div>

          {/* RIGHT SIDE FLOATING CARDS */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="hidden lg:block lg:w-1/2 relative h-[600px]"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-full blur-[60px]" />

            {/* Main Profile Card */}
            <div
              className="absolute top-10 left-10 w-[400px] glass-panel p-8 rounded-[2.5rem] border-border/60 shadow-xl z-20 overflow-hidden"
            >
              {/* Dynamic Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/5 to-accent/20 animate-shimmer bg-[length:400%_400%] pointer-events-none opacity-50" />

              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-8 border-b border-border/10 pb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">JD</div>
                  <div>
                    <div className="font-display font-bold text-xl text-foreground">John Dev</div>
                    <div className="text-sm text-muted-foreground font-medium">Fullstack Engineer</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Open
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-sm font-bold border border-blue-500/20">React</span>
                    <span className="px-3 py-1 bg-orange-500/10 text-orange-600 rounded-lg text-sm font-bold border border-orange-500/20">Rust</span>
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-lg text-sm font-bold border border-yellow-500/20">PostgreSQL</span>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                    Looking for a UI designer for a SaaS project in the fintech space. I have the backend ready!
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-background bg-muted" />
                    <div className="w-10 h-10 rounded-full border-2 border-background bg-muted/80" />
                    <div className="w-10 h-10 rounded-full border-2 border-background bg-muted/60" />
                  </div>
                  <Button size="sm" className="rounded-full px-6 font-bold bg-foreground text-background hover:bg-foreground/80">Connect</Button>
                </div>
              </div>
            </div>

            {/* Floating Notification Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute bottom-32 -left-4 glass-panel px-6 py-4 rounded-[2rem] flex items-center gap-4 shadow-xl border-border/60 z-30 max-w-[280px]"
            >
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-2xl text-green-600 dark:text-green-400 shadow-sm"><Zap size={20} fill="currentColor" /></div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">New Match</div>
                <div className="font-display font-bold text-sm text-foreground leading-tight">Sarah (Designer) wants to join your team!</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 2 }}
              className="absolute -top-10 left-[320px] glass-panel px-6 py-4 rounded-[2rem] flex items-center gap-4 shadow-xl border-border/60 z-30 max-w-[250px]"
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm"><Globe size={20} /></div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Hackathon</div>
                <div className="font-display font-bold text-sm text-foreground leading-tight">Global AI Sprint starts in 2 days</div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative py-32 bg-secondary/5 dark:bg-black/20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-bold uppercase tracking-widest"
            >
              Streamlined Team Building
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-display font-black mb-6 text-foreground">From Idea to MVP in 3 Steps</h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              We removed the friction of finding partners so you can focus on what matters: building the next unicorn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 -translate-y-[80px] -z-10" />

            {[
              {
                step: "01",
                title: "Post a Request",
                desc: "Share your vision. Whether it's a hackathon idea or a long-term startup, describe the skills you need.",
                icon: <Sparkles className="w-8 h-8 text-primary-foreground" />,
                color: "bg-primary"
              },
              {
                step: "02",
                title: "Filter Candidates",
                desc: "Use advanced filters to find people by tech stack (React, Rust, etc.), university, or location.",
                icon: <Users className="w-8 h-8 text-primary-foreground" />,
                color: "bg-accent"
              },
              {
                step: "03",
                title: "Collaborate",
                desc: "Connect via chat, share GitHub repos, and start building. Review code and ship faster together.",
                icon: <Code className="w-8 h-8 text-primary-foreground" />,
                color: "bg-orange-600"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative group text-center"
              >
                <div className={`w-24 h-24 mx-auto rounded-3xl ${item.color} shadow-2xl shadow-${item.color}/30 flex items-center justify-center mb-10 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative z-10`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-display font-bold mb-4 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed px-4">{item.desc}</p>

                {/* Step Number Background */}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary/25 via-accent/25 to-primary/25 animate-shimmer bg-[length:200%_auto] -z-10 select-none">
                  {item.step}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* BANNER CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative rounded-[2rem] overflow-hidden p-8 md:p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-90" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-sm bg-primary/20 border border-primary/30 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-200 uppercase">System Online • Powered by AhiLight</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-display font-extrabold text-primary-foreground mb-6 leading-tight tracking-tight">
              Ready to ship your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground via-primary-foreground/90 to-primary-foreground/70">next big idea?</span>
            </h2>

            <p className="text-lg md:text-xl text-primary-foreground/80 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop building in isolation. Find the missing piece of your puzzle today.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
              {[
                { label: "LATENCY", value: "< 24ms", color: "text-emerald-300" },
                { label: "UPTIME", value: "99.9%", color: "text-blue-300" },
                { label: "MEMBERS", value: "2.5k+", color: "text-purple-300" },
                { label: "PROJECTS", value: "850+", color: "text-orange-300" }
              ].map((item) => (
                <div key={item.label} className="bg-muted/30 backdrop-blur-md px-4 py-3 rounded-lg border border-border/50 flex flex-col items-start gap-1 group hover:bg-muted/50 transition-all text-left">
                  <span className="text-[10px] font-mono font-medium text-muted-foreground tracking-wider uppercase">{item.label}</span>
                  <span className={`text-lg font-mono font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <Link href="/register">
              <Button
                size="lg"
                onClick={() => trackEvent("banner_click_signup")}
                className="h-16 px-16 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all font-bold text-xl shadow-2xl shadow-primary/20"
              >
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
