import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
    Github,
    Globe,
    Mail,
    MapPin,
    ArrowLeft,
    MessageSquare,
    ExternalLink,
    Shield
} from "lucide-react";
import { SafeExternalLink } from "@/components/SafeExternalLink";
import { getAssetUrl } from "@/lib/utils";

export default function PublicProfile() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { fetchPublicUser } = useStore();

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return;
            try {
                const data = await fetchPublicUser(id);
                if (data) {
                    setUser(data);
                } else {
                    toast({ title: "User not found", variant: "destructive" });
                    setLocation("/teammates");
                }
            } catch (e) {
                toast({ title: "Error fetching user", variant: "destructive" });
                setLocation("/teammates");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [id, setLocation, toast, fetchPublicUser]);

    // Removed duplicate getGradient (now using shared/lib/utils implicit or explicitly if needed)
    // Actually, let's keep it simple and just import it if it exists, or improve this one.
    // Since I can't easily see lib/utils right now without another tool call, I will make this local one safer and cleaner.
    const getGradient = (name: string | null | undefined) => {
        const colors = [
            'from-blue-500 to-cyan-500',
            'from-purple-500 to-pink-500',
            'from-green-500 to-teal-500',
            'from-orange-500 to-rose-500',
            'from-indigo-500 to-blue-500'
        ];
        if (!name) return colors[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (isLoading) {
        return (
            <div className="min-h-screen abstract-bg flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    const skills = user.skills || [];

    return (
        <div className="min-h-screen abstract-bg pb-20 pt-24">
            <Navbar />
            <main className="container mx-auto px-4 lg:px-8 max-w-5xl">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setLocation("/teammates")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Browse</span>
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="glass-panel p-8 rounded-[2.5rem] border-border shadow-2xl sticky top-24">
                            <div className="text-center mb-8">
                                <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${getGradient(user.name)} mx-auto mb-6 border-4 border-border flex items-center justify-center text-5xl font-display font-bold text-primary-foreground shadow-2xl overflow-hidden`}>
                                    {user.avatar ? (
                                        <img src={getAssetUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.name.charAt(0)
                                    )}
                                </div>
                                <h1 className="text-3xl font-display font-bold mb-1 text-foreground">{user.name}</h1>
                                <p className="text-muted-foreground font-medium">@{user.username}</p>

                                {user.skillLevel && (
                                    <Badge className="mt-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 h-7 px-4 rounded-full font-bold">
                                        {user.skillLevel}
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-4">
                                {user.email !== "HIDDEN" && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
                                        <Mail size={18} className="text-primary" />
                                        <span className="text-sm font-medium truncate">{user.email}</span>
                                    </div>
                                )}
                                {user.city && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
                                        <MapPin size={18} className="text-primary" />
                                        <span className="text-sm font-medium">{user.city}</span>
                                    </div>
                                )}
                                {user.university && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
                                        <Globe size={18} className="text-primary" />
                                        <span className="text-sm font-medium truncate">{user.university}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-border/10">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Socials</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {user.github && (
                                        <Button variant="outline" className="rounded-2xl h-14 bg-muted/50 border-border hover:bg-muted group" asChild>
                                            <SafeExternalLink href={user.github}>
                                                <Github size={20} />
                                            </SafeExternalLink>
                                        </Button>
                                    )}
                                    {user.portfolio && (
                                        <Button variant="outline" className="rounded-2xl h-14 bg-muted/50 border-border hover:bg-muted group" asChild>
                                            <SafeExternalLink href={user.portfolio}>
                                                <ExternalLink size={20} />
                                            </SafeExternalLink>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Bio & Skills */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel p-8 md:p-12 rounded-[2.5rem] border-border shadow-xl"
                        >
                            <h2 className="text-2xl font-display font-bold mb-6">About Me</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {user.bio || "No biography provided."}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-panel p-8 md:p-12 rounded-[2.5rem] border-border shadow-xl"
                        >
                            <h2 className="text-2xl font-display font-bold mb-8">Technical Arsenals</h2>
                            <div className="flex flex-wrap gap-3">
                                {skills.map((skill: string) => (
                                    <Badge
                                        key={skill}
                                        className="h-12 px-6 text-sm rounded-2xl bg-muted/50 border-border text-foreground font-bold shadow-sm"
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-primary/5 border border-primary/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold">Privacy Conscious</h4>
                                    <p className="text-xs text-muted-foreground">This user has set their profile visibility preferences.</p>
                                </div>
                            </div>
                            <Button
                                className="rounded-full px-8 h-12 font-bold gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                                onClick={() => currentUser?.id === user.id ? setLocation("/profile") : setLocation("/chat")}
                            >
                                <MessageSquare size={18} className="mr-2" />
                                {currentUser?.id === user.id ? "Settings" : "Send Message"}
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
