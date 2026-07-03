import { motion } from "framer-motion";
import { Mail, MessageSquare, Clock } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage, type ContactMessagePayload } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
    const { toast } = useToast();
    const [formData, setFormData] = useState<ContactMessagePayload>({
        firstName: "",
        lastName: "",
        email: "",
        subject: "General Inquiry",
        message: "",
    });

    const contactMutation = useMutation({
        mutationFn: submitContactMessage,
        onSuccess: () => {
            toast({
                title: "Message sent",
                description: "Your message has been received. We’ll get back to you shortly.",
                className: "glass-panel bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
            });
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                subject: "General Inquiry",
                message: "",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to send message",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateField = <K extends keyof ContactMessagePayload>(key: K, value: ContactMessagePayload[K]) => {
        setFormData((current: ContactMessagePayload) => ({ ...current, [key]: value }));
    };

    return (
        <div className="min-h-screen abstract-bg font-sans text-foreground overflow-hidden">
            <Navbar />

            <section className="pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-5xl font-display font-black mb-6">Let's Connect</h1>
                            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                                Whether you have a feature suggestion, need help with your account, or want to partner with us, we're all ears.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start gap-5 group">
                                    <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">Email Support</h3>
                                        <p className="text-muted-foreground mb-1">For general inquiries and support:</p>
                                        <a href="mailto:findateammate.ahilight@gmail.com" className="text-primary font-medium hover:underline">findateammate.ahilight@gmail.com</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5 group">
                                    <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">Community</h3>
                                        <p className="text-muted-foreground">Connect with us through social media and community channels (coming soon)</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5 group">
                                    <div className="p-4 rounded-2xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">Response Time</h3>
                                        <p className="text-muted-foreground">We aim to respond to all inquiries within 24-48 hours, Monday through Friday.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="glass-panel p-8 rounded-[2rem] shadow-2xl border-border"
                        >
                            <h2 className="text-2xl font-bold font-display mb-6">Send a Message</h2>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    contactMutation.mutate(formData);
                                }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">First Name</label>
                                        <Input
                                            required
                                            placeholder="John"
                                            className="bg-muted/50 border-input focus-visible:ring-primary"
                                            value={formData.firstName}
                                            onChange={(e) => updateField("firstName", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">Last Name</label>
                                        <Input
                                            required
                                            placeholder="Doe"
                                            className="bg-muted/50 border-input focus-visible:ring-primary"
                                            value={formData.lastName}
                                            onChange={(e) => updateField("lastName", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">Email Address</label>
                                    <Input
                                        required
                                        placeholder="john@example.com"
                                        type="email"
                                        className="bg-muted/50 border-input focus-visible:ring-primary"
                                        value={formData.email}
                                        onChange={(e) => updateField("email", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">Subject</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-primary"
                                        value={formData.subject}
                                        onChange={(e) => updateField("subject", e.target.value as ContactMessagePayload["subject"])}
                                    >
                                        <option value="General Inquiry">General Inquiry</option>
                                        <option value="Technical Support">Technical Support</option>
                                        <option value="Partnership">Partnership</option>
                                        <option value="Feedback">Feedback</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">Message</label>
                                    <Textarea
                                        required
                                        placeholder="How can we help you today?"
                                        className="bg-white/50 dark:bg-black/20 min-h-[150px] focus-visible:ring-primary"
                                        value={formData.message}
                                        onChange={(e) => updateField("message", e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full rounded-xl text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                                    disabled={contactMutation.isPending}
                                >
                                    {contactMutation.isPending ? "Sending..." : "Send Message"}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    By sending this message, you agree to our <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
