import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/queryClient";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, startTransition } from "react";

export default function Register() {
    const { user, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    // FIX: Use window.location.href to prevent React Error 310 during Suspense/lazy route transitions
    useEffect(() => {
        if (user) {
            window.location.href = "/";
        }
    }, [user]);

    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden py-12">
            {isLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-full border border-border/60 bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                    Checking session...
                </div>
            )}
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

            <Link href="/">
                <Button variant="ghost" className="absolute top-8 left-8 gap-2 z-10">
                    <ArrowLeft size={16} /> Back to Home
                </Button>
            </Link>

            <Card className="w-full max-w-lg mx-auto glass-card border-border shadow-xl relative z-20">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Create Account
                    </CardTitle>
                    <CardDescription>
                        Join the community of builders and find your perfect team
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button 
                        variant="default" 
                        className="w-full h-12 gap-2 font-semibold text-base"
                        onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                        </svg>
                        Sign up with Google
                    </Button>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                        <p className="font-semibold mb-1">🚀 Easy Onboarding</p>
                        <p>Sign up with your Google account, and we'll create your profile instantly. Your email is already verified!</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login">
                            <a className="font-bold text-primary hover:underline">Log in</a>
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
