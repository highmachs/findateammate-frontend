import { motion } from "framer-motion";
import { ShieldAlert, GitBranch, Coffee, Lock, Key, Copyright, FileSignature, DatabaseBackup, MessageSquare, DollarSign, AlertTriangle, UserX, ArrowRight, Settings } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
export default function Safety() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen abstract-bg font-sans text-foreground overflow-hidden">
            <Navbar />

            <section className="pt-32 pb-10 px-4 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 dark:text-green-400 shadow-xl shadow-green-500/10"
                >
                    <ShieldAlert size={48} />
                </motion.div>
                <h1 className="text-5xl font-display font-black mb-6">Collaboration Safety</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                    Protecting your code, your ideas, and your time is just as important as protecting your personal info. Here is how to collaborate safely.
                </p>
            </section>

            <section className="container mx-auto px-4 pb-32">
                {/* Member Specific Quick Link */}
                {user && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto mb-12"
                    >
                        <Link href="/profile">
                            <div className="glass-panel p-6 rounded-2xl border-primary/20 bg-primary/5 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
                                        <Settings size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Your Privacy Control</h4>
                                        <p className="text-sm text-muted-foreground">Manage what information you share with potential teammates.</p>
                                    </div>
                                </div>
                                <ArrowRight className="text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    {[
                        {
                            icon: <GitBranch size={32} className="text-blue-500" />,
                            title: "Code Review First",
                            desc: "Before granting write access to your main repository, ask to see their previous work or assign a small, isolated 'good first issue' to verify their skills."
                        },
                        {
                            icon: <Copyright size={32} className="text-purple-500" />,
                            title: "Define IP Rights",
                            desc: "If you're working on a startup idea, agree upfront on who owns the code. Use standard licenses (MIT, Apache) or a simple Founder's Agreement."
                        },
                        {
                            icon: <Lock size={32} className="text-pink-500" />,
                            title: "Protect Secrets",
                            desc: "Never commit API keys or environment variables (.env files) to your repository. Use secrets management tools and share credentials securely."
                        },
                        {
                            icon: <Key size={32} className="text-orange-500" />,
                            title: "Access Control",
                            desc: "Start new teammates with 'Collaborator' or 'Read' access. Only grant 'Admin' rights when you have built full trust."
                        },
                        {
                            icon: <Coffee size={32} className="text-green-500" />,
                            title: "Trial Period",
                            desc: "Agree on a 1-week trial sprint before committing to a long-term partnership. It protects both parties if working styles don't align."
                        },
                        {
                            icon: <ShieldAlert size={32} className="text-red-500" />,
                            title: "Avoid Phishing",
                            desc: "Be suspicious of teammates sending strange .exe files or asking you to run unknown scripts on your local machine. Verify everything."
                        },
                        {
                            icon: <FileSignature size={32} className="text-indigo-500" />,
                            title: "Formal Agreements",
                            desc: "If money or equity is involved, get it in writing. A simple contract prevents painful disputes about ownership and compensation later."
                        },
                        {
                            icon: <DatabaseBackup size={32} className="text-cyan-500" />,
                            title: "Keep Backups",
                            desc: "Always maintain your own local backup of the project. If a partnership goes south, you don't want to be locked out of your own hard work."
                        },
                        {
                            icon: <MessageSquare size={32} className="text-yellow-500" />,
                            title: "Professional Channels",
                            desc: "Keep initial communication on professional platforms (Discord, Slack). Avoid sharing personal phone numbers until you've established trust."
                        }
                    ].map((tip, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="glass-card p-8 rounded-[2rem] hover:bg-card/80 transition-all hover:-translate-y-1 hover:shadow-xl bg-card border-border"
                        >
                            <div className="mb-6 bg-muted/50 w-fit p-4 rounded-2xl">{tip.icon}</div>
                            <h3 className="text-xl font-bold font-display mb-3">{tip.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{tip.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Red Flags Section */}
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-display font-bold mb-10 text-center">🚩 Red Flags to Watch For</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                title: "The 'Idea Guy'",
                                desc: "Someone who contributes zero code/work but demands 50% equity just for the 'idea'. Ideas are cheap; execution is everything.",
                                icon: <UserX className="text-destructive" />
                            },
                            {
                                title: "Urgency Pressure",
                                desc: "Users who pressure you to sign immediately or transfer files 'right now'. Scammers often create false urgency.",
                                icon: <AlertTriangle className="text-orange-500" />
                            },
                            {
                                title: "Vague Requirements",
                                desc: "Refusal to define clear project scope or deliverables. This often leads to 'scope creep' and endless unpaid work.",
                                icon: <FileSignature className="text-yellow-500" />
                            },
                            {
                                title: "Pay to Play",
                                desc: "Anyone asking YOU to pay a fee to join their 'exclusive' team or project. Legitimate collaborations don't have entry fees.",
                                icon: <DollarSign className="text-green-500" />
                            }
                        ].map((flag, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="glass-panel p-6 rounded-2xl flex items-start gap-4 border-l-4 border-destructive/50"
                            >
                                <div className="mt-1">{flag.icon}</div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{flag.title}</h3>
                                    <p className="text-muted-foreground text-sm font-medium">{flag.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 p-10 glass-panel rounded-3xl text-center max-w-4xl mx-auto bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-destructive"></div>
                    <h2 className="text-2xl font-bold font-display mb-4 text-destructive">Report Violations</h2>
                    <p className="text-muted-foreground mb-8 text-lg font-medium">
                        If a user violates these safety norms or acts maliciously, let us know immediately.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/report">
                            <button className="px-8 py-4 rounded-full bg-destructive text-destructive-foreground font-bold hover:bg-destructive/90 transition-all shadow-lg hover:shadow-destructive/30 flex items-center gap-2">
                                <ShieldAlert size={20} />
                                Report User
                            </button>
                        </Link>
                        {!user && (
                            <Link href="/register">
                                <button className="px-8 py-4 rounded-full bg-card text-destructive border-2 border-destructive/20 font-bold hover:bg-destructive/5 transition-all flex items-center gap-2">
                                    Join the Movement <ArrowRight size={20} />
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
