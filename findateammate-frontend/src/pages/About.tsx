import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Users, Zap, Globe } from "lucide-react";

export default function About() {
    return (
        <div className="min-h-screen abstract-bg font-sans text-foreground overflow-hidden">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-display font-black mb-6"
                    >
                        Built for Builders, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">by Builders.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
                    >
                        We believe that the best ideas shouldn't die because you couldn't find a co-founder.
                        AhiLight created FindATeammate to bridge the gap between visionaries and creators.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {[
                        {
                            icon: <Users className="w-8 h-8 text-primary" />,
                            title: "Community First",
                            desc: "We prioritize genuine connections over transaction. This is a network, not a marketplace."
                        },
                        {
                            icon: <Zap className="w-8 h-8 text-yellow-500" />,
                            title: "Speed to Ship",
                            desc: "Our goal is to get you from 'idea' to 'MVP' as fast as possible by finding the right skills."
                        },
                        {
                            icon: <Globe className="w-8 h-8 text-blue-500" />,
                            title: "Global Reach",
                            desc: " Talent is everywhere. We connect you with builders from around the world."
                        }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="glass-panel p-8 rounded-3xl"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold font-display mb-3">{item.title}</h3>
                            <p className="text-muted-foreground">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-display font-bold">Our Story</h2>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                It started with a simple problem: <strong>Hackathons are hard when you're solo.</strong>
                            </p>
                            <p>
                                The AhiLight team realized that thousands of brilliant developers were missing out on opportunities simply because they lacked a team. Discord servers were chaotic, LinkedIn was too formal, and Reddit was... Reddit.
                            </p>
                            <p>
                                We built FindATeammate to be the solution we wished we had. A dedicated space where skill meets vision, and where strangers become co-founders.
                            </p>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass-panel p-8 rounded-3xl border-accent/20 bg-accent/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-accent mb-4">No More Solo.</div>
                            <p className="text-lg font-bold mb-4 text-foreground">Countless solo devs struggle to find the right people to work with.</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                It shouldn't be this hard. Come here to finally find the one teammate you've been looking for.
                            </p>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="glass-panel p-12 rounded-[3rem] text-center max-w-3xl mx-auto border-primary/20"
                >
                    <h2 className="text-3xl font-display font-bold mb-6">Our Mission</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                        "To democratize software building by ensuring no one has to build alone.
                        Whether you're a student at a hackathon or a seasoned engineer starting a company,
                        you deserve a team that shares your passion."
                    </p>
                    <div className="font-bold text-foreground">- The AhiLight Team</div>
                </motion.div>
            </div>
        </div>
    );
}
