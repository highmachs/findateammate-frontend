import { motion } from "framer-motion";
import { MessageCircle, XCircle, Zap, Shield, Sparkles, Users, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { duration: 0.8, ease: "easeOut" }
    }
} as const;

export default function Guidelines() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen abstract-bg font-sans text-foreground overflow-hidden">
            <Navbar />

            <section className="container mx-auto px-4 pt-32 pb-20">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="lg:w-1/2"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold mb-6">
                            <Users size={16} />
                            <span>{user ? "Member Benefits" : "AhiLight Community Standards"}</span>
                        </div>
                        <h1 className="text-6xl font-display font-black mb-6 leading-tight">
                            {user ? "Safe" : "Community"} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Guidelines</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-loose">
                            {user
                                ? "Glad to have you with us! As a member, you play a key role in keeping FindATeammate a safe and productive space for all builders."
                                : "FindATeammate (by AhiLight) is built on trust, respect, and collaboration. To keep this community thriving, we expect every member to uphold these core values."
                            }
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="lg:w-1/2 relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-[100px] opacity-20 rounded-full animate-pulse" />
                        <div className="relative glass-panel p-10 rounded-[3rem] rotate-3 hover:rotate-0 transition-transform duration-500 border-border shadow-2xl">
                            <Sparkles className="text-yellow-500 mb-4" size={32} />
                            <h3 className="text-2xl font-bold mb-4 font-display">The Golden Rule</h3>
                            <p className="text-xl font-medium italic text-muted-foreground">
                                "Treat every developer, designer, and creator with the same respect, patience, and encouragement that you would want for yourself."
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="container mx-auto px-4 pb-32">
                <h2 className="text-3xl font-display font-bold mb-12 text-center uppercase tracking-widest text-primary/80">Code of Conduct</h2>
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-10%" }}
                    className="space-y-8 max-w-4xl mx-auto mb-20"
                >
                    {[
                        {
                            title: "No Harassment or Trolling",
                            desc: "Harassment, bullying, doxxing, or hate speech will result in an immediate ban. Constructive disagreement is fine; toxicity is not.",
                            icon: <Shield className="text-emerald-500" size={24} />,
                            color: "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/5"
                        },
                        {
                            title: "No Spamming",
                            desc: "Do not spam connection requests to everyone. Do not post unrelated ads, crypto schemes, or self-promotion in unauthorized channels. Quality over quantity.",
                            icon: <XCircle className="text-red-500" size={24} />,
                            color: "border-red-500/30 bg-red-500/5 shadow-red-500/5"
                        },
                        {
                            title: "Professional Communication",
                            desc: "State your skills effectively. If you commit to a team, follow through. If you need to leave, communicate it clearly. Don't ghost your teammates.",
                            icon: <MessageCircle className="text-blue-500" size={24} />,
                            color: "border-blue-500/30 bg-blue-500/5 shadow-blue-500/5"
                        },
                        {
                            title: "Intellectual Property",
                            desc: "Respect the work of others. Do not claim credit for code you didn't write. Do not steal project ideas discussed in confidence.",
                            icon: <Zap className="text-yellow-500" size={24} />,
                            color: "border-yellow-500/30 bg-yellow-500/5 shadow-yellow-500/5"
                        }
                    ].map((rule, i) => (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            className={`rule-card glass-card p-8 rounded-3xl border-l-4 flex flex-col sm:flex-row items-start sm:items-center gap-6 ${rule.color} hover:bg-muted transition-all duration-300 shadow-lg hover:shadow-xl`}
                        >
                            <div className="p-4 rounded-full bg-muted/50 backdrop-blur-sm shadow-inner shrink-0">
                                {rule.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-display font-bold mb-2">{rule.title}</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium">{rule.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {!user && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-panel p-12 rounded-[3rem] text-center max-w-3xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5"
                    >
                        <h2 className="text-3xl font-display font-black mb-6">Ready to join the community?</h2>
                        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                            Start connecting with thousands of builders who share your values. Create your profile in seconds.
                        </p>
                        <Link href="/register">
                            <Button size="lg" className="rounded-full h-16 px-12 text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-accent border-none text-primary-foreground hover:scale-105 transition-all">
                                Get Started <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </section>
        </div>
    );
}
