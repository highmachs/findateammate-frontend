import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function FAQ() {
    const { user } = useAuth();
    
    const faqs = [
        ...(user ? [
            {
                question: "How do I make my profile stand out?",
                answer: "The most successful members have a complete profile with a clear bio, links to their best work (GitHub/Portfolio), and a profile picture. Be specific about what you're looking for in a teammate!"
            },
            {
                question: "Can I edit my posts after publishing?",
                answer: "Yes! You can manage all your posts from the 'My Posts' section. You can update the description, skills required, or even mark it as 'Found Teammate' to stop receiving requests."
            },
            {
                question: "How do I change my privacy settings?",
                answer: "Go to your Profile page and click on 'Edit Profile'. At the bottom, you'll find privacy toggles to hide/show your email, university, and other sensitive details on your public profile."
            }
        ] : []),
        {
            question: "Is FindATeammate free to use?",
            answer: "Yes! FindATeammate is completely free for individual builders. You can create a profile, browse posts, and connect with other developers at no cost."
        },
        {
            question: "How do I verify my skills?",
            answer: "Currently, we rely on community trust and your portfolio links (GitHub, LinkedIn). We encourage you to fill out your profile completely to increase your chances of finding a great match."
        },
        {
            question: "Can I find teammates for hackathons?",
            answer: "Absolutely! Many of our users are specifically looking for teammates for upcoming hackathons like ETHGlobal, HackMIT, and others. Use the 'Hackathon' tag when searching."
        },
        {
            question: "How do I contact a potential teammate?",
            answer: "Once you find a post you're interested in, simply click the 'Connect' button. This will open a direct chat with the project owner."
        },
        {
            question: "Is my data safe?",
            answer: "We take privacy seriously. We only show the information you choose to display on your public profile. Your email is kept private unless you choose to share it."
        },
        {
            question: "Can I delete my account?",
            answer: "Yes, you have full control over your data. You can delete your account permanently from the Settings page. This action is irreversible."
        },
        {
            question: "What if someone is spamming me?",
            answer: "We have a zero-tolerance policy for harassment and spam. You can report any user directly from the chat window or their profile page, and our moderation team will investigate."
        },
        {
            question: "Do I need to be a student?",
            answer: "No! While we are popular among university students, FindATeammate is open to everyone—professionals, hobbyists, and dreamers of all ages."
        },
        {
            question: "Does FindATeammate take equity?",
            answer: "Never. We are a matching platform, not an incubator. Any project you build, any company you start, is 100% yours."
        },
        {
            question: "How do you protect my IP?",
            answer: "We advise you only to share high-level ideas on public posts. Save the confidential details for private chats once you've vetted a potential teammate."
        }
    ];

    return (
        <div className="min-h-screen abstract-bg font-sans text-foreground overflow-hidden">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-display font-black mb-6">Frequently Asked Questions</h1>
                    <p className="text-xl text-muted-foreground font-medium">Everything you need to know about the platform.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-8 rounded-3xl"
                >
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border-b-border/50 last:border-0 hover:bg-muted/50 transition-colors px-4 rounded-xl">
                                <AccordionTrigger className="text-lg font-bold hover:text-primary transition-colors text-left no-underline py-6">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
                
                {!user && (
                    <div className="mt-16 text-center">
                        <p className="text-muted-foreground mb-6 font-medium">Still have questions?</p>
                        <Link href="/contact">
                            <Button variant="outline" className="rounded-full px-8 py-6 text-lg font-bold glass-panel hover:bg-muted transition-all">
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
