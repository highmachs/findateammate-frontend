import { Link } from "wouter";
import { Globe, Linkedin, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.png";

export function Footer() {
    const { user } = useAuth();
    const isLoggedIn = !!user;

    return (
        <footer className="relative bg-card border-t border-border pt-12 pb-8 overflow-hidden">
            {/* Background Accent */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/">
                            <div className="flex items-center gap-3 mb-6 cursor-pointer">
                                <img src={logo} alt="FindATeammate Logo" className="h-10 sm:h-12 w-auto object-contain" />
                                <div className="flex flex-col">
                                    <span className="font-display font-bold text-lg sm:text-2xl text-foreground tracking-tight">
                                        Find<span className="text-primary">A</span>Teammate
                                    </span>
                                    <span className="text-xs font-medium opacity-50 -mt-1">by Ahi<span className="text-primary">X</span>light</span>
                                </div>
                            </div>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                            Empowering builders to find the perfect teammates for hackathons, startups, and side projects. Built by builders, for builders.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://ahilight.vercel.app" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all" aria-label="Website">
                                <Globe size={18} />
                            </a>
                            <a href="https://www.linkedin.com/company/findateammate/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all" aria-label="LinkedIn">
                                <Linkedin size={18} />
                            </a>
                            <a href="mailto:findateammate.ahilight@gmail.com" className="p-2 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all" aria-label="Email">
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">Platform</h4>
                        <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                            {isLoggedIn ? (
                                <>
                                    <li><Link href="/teammates" className="hover:text-primary transition-colors">Browse Teams</Link></li>
                                    <li><Link href="/events" className="hover:text-primary transition-colors">Find Events</Link></li>
                                    <li><Link href="/create-post" className="hover:text-primary transition-colors">Create Post</Link></li>
                                    <li><Link href="/my-posts" className="hover:text-primary transition-colors">Manage Posts</Link></li>
                                </>
                            ) : (
                                <>

                                    <li><Link href="/register" className="hover:text-primary transition-colors">Join the Movement</Link></li>
                                    <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                                    <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Community */}
                    <div>
                        <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">Community</h4>
                        <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                            <li><Link href="/guidelines" className="hover:text-primary transition-colors">
                                {isLoggedIn ? "Member Guidelines" : "Community Guidelines"}
                            </Link></li>
                            <li><Link href="/safety" className="hover:text-primary transition-colors">Safety Center</Link></li>
                            <li><Link href="/report" className="hover:text-primary transition-colors">Report Abuse</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Support</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">Legal</h4>
                        <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>

                        </ul>
                    </div>
                </div>

                <div className="border-t border-border/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground font-medium">
                        © 2026 FindATeammate (by <strong>AhiLight</strong>). All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
