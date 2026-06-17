import { motion, easeOut } from "framer-motion";
import { FileText } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const revealVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { duration: 0.6, ease: easeOut }
    }
};

export default function Terms() {
    return (
        <div className="min-h-screen abstract-bg font-sans text-foreground overflow-hidden">
            <Navbar />

            <section className="pt-32 pb-16 px-4">
                <div className="container mx-auto text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", duration: 1 }}
                        className="inline-block p-4 rounded-full bg-accent/10 mb-8"
                    >
                        <FileText size={48} className="text-accent" />
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-display font-black mb-6 text-foreground">Terms of Service</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Please read these terms carefully. By using FindATeammate, you agree to these rules which ensure a safe and productive environment for everyone.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold mt-6">
                        <span>Effective Date: February 20, 2026</span>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 pb-32 max-w-4xl">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="space-y-12"
                >
                    {/* Section 1 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using FindATeammate at findateammate.online (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please discontinue use of the Platform.
                        </p>
                    </motion.div>

                    {/* Section 2 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">2. Eligibility</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You must be at least 13 years old (or 16 in applicable jurisdictions) to use the Platform. By registering, you confirm that you meet this requirement. We reserve the right to terminate accounts that violate this condition.
                        </p>
                    </motion.div>

                    {/* Section 3 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">3. Account Registration</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree to provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us immediately at support@findateammate.online if you suspect unauthorized access.
                        </p>
                    </motion.div>

                    {/* Section 4 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">4. Use of the Platform</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            You agree to use the Platform only for lawful purposes. You must not:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Post false, misleading, or fraudulent content</li>
                            <li>Harass, threaten, or abuse other users</li>
                            <li>Spam users with unsolicited messages or promotions</li>
                            <li>Attempt to scrape, reverse-engineer, or disrupt the Platform</li>
                            <li>Impersonate another person or organization</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            We reserve the right to suspend or terminate accounts that violate these rules.
                        </p>
                    </motion.div>

                    {/* Section 5 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">5. User-Generated Content</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            You retain ownership of the content you post (profiles, project listings, messages, etc.). By posting content, you grant FindATeammate a non-exclusive, royalty-free license to display and distribute that content as necessary to operate the Platform.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            You are solely responsible for the content you submit. We do not endorse any user-posted content and are not liable for it.
                        </p>
                    </motion.div>

                    {/* Section 6 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">6. Events Board</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Events and opportunities listed on the Platform may be submitted by users or sourced from public information. We do not organize, endorse, or guarantee any listed event. Always verify details directly with the organizer before participating.
                        </p>
                    </motion.div>

                    {/* Section 7 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">7. Intellectual Property</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            All Platform content, design, and code created by FindATeammate is our property and protected by applicable intellectual property laws. You may not copy, reproduce, or distribute it without our written permission.
                        </p>
                    </motion.div>

                    {/* Section 8 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">8. Disclaimers</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Platform is provided "as is" without warranties of any kind. We do not guarantee that the Platform will be uninterrupted, error-free, or that connections made through it will lead to successful collaborations or outcomes.
                        </p>
                    </motion.div>

                    {/* Section 9 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">9. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To the fullest extent permitted by law, FindATeammate shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform, including any interactions or agreements made with other users.
                        </p>
                    </motion.div>

                    {/* Section 10 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">10. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may also delete your account at any time. Upon termination, your right to use the Platform ceases immediately.
                        </p>
                    </motion.div>

                    {/* Section 11 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">11. Changes to These Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update these Terms from time to time. When we do, we will revise the "Last Updated" date below. Continued use of the Platform after changes are posted constitutes your acceptance of the revised Terms.
                        </p>
                    </motion.div>

                    {/* Section 12 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">12. Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts located in India.
                        </p>
                    </motion.div>

                    {/* Section 13 */}
                    <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
                        <h2 className="text-3xl font-display font-bold mb-4 text-primary">13. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            If you have any questions about these Terms, please contact us:
                        </p>
                        <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 space-y-2">
                            <p className="text-foreground"><strong>Company:</strong> FindATeammate</p>
                            <p className="text-foreground"><strong>Email:</strong> findateammate.ahilight@gmail.com</p>
                            <p className="text-foreground"><strong>Website:</strong> https://findateammate.online</p>
                        </div>
                    </motion.div>

                    {/* Footer */}
                    <motion.div variants={revealVariants} className="text-center pt-8">
                        <p className="text-sm text-muted-foreground">
                            © 2026 FindATeammate. All rights reserved. | findateammate.online
                        </p>
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
}
