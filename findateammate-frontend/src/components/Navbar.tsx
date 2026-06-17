import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { markTourComplete } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";
import { Menu, User, Settings, LogOut, Plus, MessageSquare, Bell, Home, Calendar, Inbox } from "lucide-react";
import { useState } from "react";
import { OnboardingTour } from "@/components/OnboardingTour";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import logo from "@/assets/logo.png";

export function Navbar() {
    const TOUR_KEY = "findateammate_tour_completed_v1";
    const TOUR_DISMISSED_KEY = "findateammate_tour_dismissed_v1";
    const OPEN_TOUR_EVENT = "findateammate:open-tour";
    const { user, logoutMutation } = useAuth();
    const [location, setLocation] = useLocation();
    const { unreadCount, fetchNotifications } = useStore();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isTourOpen, setIsTourOpen] = useState(false);

    useEffect(() => {
        if (user) {
            // Initial fetch
            fetchNotifications();

            // Refetch when window regains focus (smart fetch)
            const handleFocus = () => {
                fetchNotifications();
            };
            window.addEventListener("focus", handleFocus);
            return () => window.removeEventListener("focus", handleFocus);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        let ticking = false;
        let rafId: number | null = null;
        const handleScroll = () => {
            if (!ticking) {
                rafId = window.requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 20);
                    ticking = false;
                    rafId = null;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        const localTourCompleted = localStorage.getItem(TOUR_KEY) === "true";
        const localTourDismissed = localStorage.getItem(TOUR_DISMISSED_KEY) === "true";
        if (localTourCompleted || localTourDismissed || user.tourCompleted) {
            return;
        }
        
        // Only show tour to new users created on or after rollout date
        const TOUR_ROLLOUT_DATE = new Date("2026-03-11"); // Today
        const userCreatedDate = new Date(user.createdAt);
        const isNewUser = userCreatedDate >= TOUR_ROLLOUT_DATE;
        
        // Auto-show only if user is new AND hasn't completed tour in DB
        if (isNewUser && !user.tourCompleted) {
            setIsTourOpen(true);
        }
    }, [user]);

    useEffect(() => {
        const handleOpenTour = () => {
            setIsTourOpen(true);
        };

        window.addEventListener(OPEN_TOUR_EVENT, handleOpenTour);
        return () => {
            window.removeEventListener(OPEN_TOUR_EVENT, handleOpenTour);
        };
    }, []);

    const handleTourOpenChange = (open: boolean) => {
        if (!open) {
            const localTourCompleted = localStorage.getItem(TOUR_KEY) === "true";
            if (!localTourCompleted && !user?.tourCompleted) {
                localStorage.setItem(TOUR_DISMISSED_KEY, "true");
            }
        }
        setIsTourOpen(open);
    };

    const handleTourComplete = async () => {
        try {
            if (user?.id) {
                await markTourComplete(user.id);
            }
        } catch (err) {
            console.error("Failed to mark tour as complete:", err);
        }
        
        localStorage.setItem(TOUR_KEY, "true");
        localStorage.removeItem(TOUR_DISMISSED_KEY);
        setIsTourOpen(false);
        setLocation("/");
    };

    const handleLogout = async () => {
        setMobileOpen(false);
        await logoutMutation.mutateAsync();
        setLocation("/");
    };

    const handleMobileNav = (href: string) => {
        setMobileOpen(false);
        setLocation(href);
    };

    const NavButton = ({ href, icon: Icon, label, isActive }: { href: string; icon: any; label: string; isActive: boolean }) => (
        <Link href={href}>
            <Button 
                variant="ghost"
                size="lg"
                className={`flex flex-col lg:flex-row items-center gap-1.5 lg:gap-2.5 font-bold text-base lg:text-lg px-3 lg:px-6 py-2 lg:py-6 h-auto transition-all duration-300 relative group
                    ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
            >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10' : 'group-hover:bg-primary/10'}`}>
                    <Icon size={isActive ? 24 : 22} />
                </div>
                <span className="text-[14px] lg:text-[17px] tracking-tight">{label}</span>
            </Button>
        </Link>
    );

    return (
        <>
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'
        }`}>
            <div className="container mx-auto px-3 sm:px-4 lg:px-6">
                <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
                    {/* Logo Area */}
                    <Link href="/">
                        <a className="flex items-center gap-2 sm:gap-3 group shrink-0">
                            <img src={logo} alt="FindATeammate Logo" className="h-8 sm:h-10 lg:h-12 w-auto object-contain" />
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-lg sm:text-xl lg:text-2xl tracking-tight text-foreground">
                                    Find<span className="text-primary">A</span>Teammate
                                </span>
                                <span className="text-[10px] sm:text-xs font-medium opacity-50 -mt-1">by AhiLight</span>
                            </div>
                        </a>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center justify-center flex-1 gap-1 lg:gap-3 px-2">
                         {user && (
                            <div className="flex items-center gap-1 lg:gap-2">
                                <NavButton href="/teammates" icon={Home} label="Teammates" isActive={location === '/teammates'} />
                                <NavButton href="/events" icon={Calendar} label="Events" isActive={location === '/events'} />
                                <NavButton href="/create-post" icon={Plus} label="Create" isActive={location === '/create-post' || location.startsWith('/create-post/')} />
                                <NavButton href="/requests" icon={Inbox} label="Requests" isActive={location === '/requests'} />
                            </div>
                        )}
                    </div>

                    {/* Desktop Right Side */}
                    {user ? (
                        <div className="hidden md:flex items-center gap-1">
                            {/* Connections link removed as per user request */}
                            <Link href="/chat">
                                <Button variant="ghost" size="icon" className={`h-9 w-9 lg:h-10 lg:w-10 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors ${location.startsWith('/chat') ? 'bg-muted text-primary' : ''}`}>
                                    <MessageSquare size={20} />
                                </Button>
                            </Link>
                            <Link href="/notifications">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-9 w-9 lg:h-10 lg:w-10 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors ${location === '/notifications' ? 'bg-muted text-primary' : ''}`}
                                    aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
                                >
                                    <div className="relative">
                                        <Bell size={20} />
                                        {unreadCount > 0 && (
                                            <span 
                                                className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-background animate-pulse"
                                                aria-live="polite"
                                                aria-label={`${unreadCount} unread notifications`}
                                            ></span>
                                        )}
                                    </div>
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-11 w-11 lg:h-14 lg:w-14 rounded-2xl ring-2 ring-primary/10 hover:ring-primary/40 hover:bg-primary/5 transition-all p-0 overflow-hidden shadow-sm active:scale-95">
                                        <Avatar className="h-full w-full">
                                            <AvatarImage src={getAssetUrl(user.avatar)} alt={user.name} className="object-cover" />
                                            <AvatarFallback className="text-lg lg:text-xl font-black bg-primary/5 text-primary">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 p-2 rounded-2xl" align="end" forceMount>
                                    <div className="px-3 py-3 mb-2 border-b border-border/10">
                                        <p className="text-sm font-black text-foreground">{user.name}</p>
                                        <p className="text-xs font-medium text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    <DropdownMenuItem onClick={() => setLocation("/profile")} className="rounded-xl py-2 cursor-pointer">
                                        <User className="mr-3 h-4 w-4" /><span className="font-bold">Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLocation("/my-posts")} className="rounded-xl py-2 cursor-pointer">
                                        <Settings className="mr-3 h-4 w-4" /><span className="font-bold">My Posts</span>
                                    </DropdownMenuItem>
                                    {user.isAdmin && (
                                        <DropdownMenuItem onClick={() => setLocation("/admin")} className="rounded-xl py-2 cursor-pointer">
                                            <Settings className="mr-3 h-4 w-4" /><span className="font-bold">Admin Dashboard</span>
                                        </DropdownMenuItem>
                                    )}
                                    {(user.isOrganiser || user.isAdmin) && (
                                        <DropdownMenuItem onClick={() => setLocation("/organizer")} className="rounded-xl py-2 cursor-pointer">
                                            <Calendar className="mr-3 h-4 w-4" /><span className="font-bold">Organizer Dashboard</span>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="my-2" />
                                    <DropdownMenuItem onClick={handleLogout} className="rounded-xl py-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <LogOut className="mr-3 h-4 w-4" /><span className="font-bold">Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-3">
                            <Link href="/login"><Button variant="ghost" className="font-bold text-[17px] px-6">Login</Button></Link>
                            <Link href="/register"><Button size="lg" className="rounded-2xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 px-8">Sign Up</Button></Link>
                        </div>
                    )}

                    {/* Mobile Menu - Controlled Sheet that closes on navigation */}
                    <div className="md:hidden">
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                                    <Menu size={24} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[280px] sm:w-[340px] p-0">
                                <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/10">
                                    <SheetTitle className="text-left">
                                        <span className="font-display font-bold text-xl">Find<span className="text-primary">A</span>Teammate</span>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col overflow-y-auto max-h-[calc(100vh-80px)]">
                                    {user ? (
                                        <>
                                            {/* User Info */}
                                            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/10">
                                                <Avatar className="h-10 w-10 shrink-0">
                                                    <AvatarImage src={getAssetUrl(user.avatar)} alt={user.name} />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>

                                            {/* Primary Nav */}
                                            <div className="py-1">
                                                <button onClick={() => handleMobileNav("/teammates")} className={`flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors ${location === '/teammates' ? 'bg-primary/5 text-primary' : ''}`}>
                                                    <Home size={20} className={location === '/teammates' ? 'text-primary' : 'text-muted-foreground'} />
                                                    <span className="font-semibold text-[15px]">Teammates</span>
                                                </button>
                                                <button onClick={() => handleMobileNav("/events")} className={`flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors ${location === '/events' ? 'bg-primary/5 text-primary' : ''}`}>
                                                    <Calendar size={20} className={location === '/events' ? 'text-primary' : 'text-muted-foreground'} />
                                                    <span className="font-semibold text-[15px]">Events</span>
                                                </button>
                                                <button onClick={() => handleMobileNav("/create-post")} className={`flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-primary/5 active:bg-primary/10 transition-colors ${location === '/create-post' || location.startsWith('/create-post/') ? 'bg-primary/5 text-primary' : 'text-primary'}`}>
                                                    <Plus size={20} />
                                                    <span className="font-bold text-[15px]">Create Post</span>
                                                </button>
                                                <button onClick={() => handleMobileNav("/requests")} className={`flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors ${location === '/requests' ? 'bg-primary/5 text-primary' : ''}`}>
                                                    <Inbox size={20} className={location === '/requests' ? 'text-primary' : 'text-muted-foreground'} />
                                                    <span className="font-semibold text-[15px]">Requests</span>
                                                </button>
                                                <button onClick={() => handleMobileNav("/chat")} className={`flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors ${location.startsWith('/chat') ? 'bg-primary/5 text-primary' : ''}`}>
                                                    <MessageSquare size={20} className={location.startsWith('/chat') ? 'text-primary' : 'text-muted-foreground'} />
                                                    <span className="font-semibold text-[15px]">Chats</span>
                                                </button>
                                                <button onClick={() => handleMobileNav("/notifications")} className={`flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors ${location === '/notifications' ? 'bg-primary/5 text-primary' : ''}`} aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}>
                                                    <Bell size={20} className={location === '/notifications' ? 'text-primary' : 'text-muted-foreground'} />
                                                    <span className="font-semibold text-[15px]">Notifications</span>
                                                    {unreadCount > 0 && (
                                                        <span className="ml-auto bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-xs font-bold" aria-label={`${unreadCount} unread`}>{unreadCount}</span>
                                                    )}
                                                </button>
                                            </div>

                                            <div className="border-t border-border/10 mx-5" />

                                            {/* Secondary Nav */}
                                            <div className="py-1">
                                                <button onClick={() => handleMobileNav("/profile")} className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors">
                                                    <User size={20} className="text-muted-foreground" />
                                                    <span className="font-semibold text-[15px]">Profile</span>
                                                </button>
                                                <button onClick={() => handleMobileNav("/my-posts")} className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors">
                                                    <Settings size={20} className="text-muted-foreground" />
                                                    <span className="font-semibold text-[15px]">My Posts</span>
                                                </button>

                                                {user.isAdmin && (
                                                    <button onClick={() => handleMobileNav("/admin")} className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors">
                                                        <Settings size={20} className="text-muted-foreground" />
                                                        <span className="font-semibold text-[15px]">Admin Dashboard</span>
                                                    </button>
                                                )}
                                                
                                                {(user.isOrganiser || user.isAdmin) && (
                                                    <button onClick={() => handleMobileNav("/organizer")} className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors">
                                                        <Calendar size={20} className="text-muted-foreground" />
                                                        <span className="font-semibold text-[15px]">Organizer Dashboard</span>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="border-t border-border/10 mx-5" />

                                            <div className="py-1">
                                                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-destructive/10 active:bg-destructive/20 transition-colors text-destructive">
                                                    <LogOut size={20} />
                                                    <span className="font-semibold text-[15px]">Log out</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-3 px-5 py-6">
                                            <button onClick={() => handleMobileNav("/login")} className="w-full">
                                                <Button variant="outline" className="w-full font-bold text-base py-5 rounded-xl">Login</Button>
                                            </button>
                                            <button onClick={() => handleMobileNav("/register")} className="w-full">
                                                <Button className="w-full font-bold text-base py-5 rounded-xl bg-primary">Sign Up</Button>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@700&display=swap');
                
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .animate-logo {
                    animation: gradient 3s ease infinite;
                    display: inline-block;
                }
            `}</style>
        </nav>
        <OnboardingTour
            open={isTourOpen}
            onOpenChange={handleTourOpenChange}
            onComplete={handleTourComplete}
        />
        </>
    );
}
