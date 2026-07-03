import { motion, easeOut } from "framer-motion";
import { Shield } from "lucide-react";
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

export default function Privacy() {
  return (
    <div className="min-h-screen abstract-bg font-sans text-foreground overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto text-center z-10 relative"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold mb-6">
            <Shield size={16} />
            <span>Last Updated: February 20, 2026</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black mb-6 text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your privacy is non-negotiable. Here is a transparent breakdown of how we collect, use, and protect your data.
          </p>
        </motion.div>

        {/* Floating Blobs */}
        <div className="fixed top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="fixed bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-32 max-w-4xl">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-12"
        >
          {/* Section 1 - Introduction */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to FindATeammate ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit and use our platform at findateammate.online (the "Site" or "Platform").
              <br /><br />
              Please read this policy carefully. If you disagree with its terms, please discontinue use of the Platform.
            </p>
          </motion.div>

          {/* Section 2 - Information Collection */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-6 text-primary">2. Information We Collect</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3 text-accent">Information You Provide Directly</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Account Information:</strong> Name, email address, username, and password when you register.</li>
                  <li><strong>Profile Information:</strong> Skills, interests, project preferences, bio, portfolio links, location, and availability.</li>
                  <li><strong>Communications:</strong> Messages you send to other users through our platform.</li>
                  <li><strong>User-Generated Content:</strong> Posts, project listings, team listings, comments, or any other content you submit.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-accent">Information Collected Automatically</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Platform, and interactions.</li>
                  <li><strong>Device & Log Data:</strong> IP address, browser type, operating system, referring URLs, and timestamps.</li>
                  <li><strong>Cookies & Tracking:</strong> We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-accent">Information from Third Parties</h3>
                <p className="text-muted-foreground">
                  If you sign in using a third-party service (e.g., Google), we may receive basic profile information such as your name, email, and profile picture, subject to your permissions.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Section 3 - How We Use */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Create and manage your account</li>
              <li>Display your profile to other users for team matching</li>
              <li>Facilitate communication and collaboration</li>
              <li>Match you with relevant teammates and projects</li>
              <li>Send notifications, updates, and service-related emails</li>
              <li>Improve and personalize our Platform</li>
              <li>Monitor usage and analyze trends</li>
              <li>Detect, prevent, and address fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </motion.div>

          {/* Section 4 - How We Share */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">4. How We Share Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We do not sell your personal information. We may share information in these circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>With Other Users:</strong> Your public profile is visible to other users - this is core to our service.</li>
              <li><strong>Service Providers:</strong> We share data with trusted vendors bound by confidentiality agreements.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or court order.</li>
              <li><strong>Business Transfers:</strong> Your information may be transferred during merger, acquisition, or asset sale.</li>
              <li><strong>With Your Consent:</strong> We may share information for other purposes with your explicit consent.</li>
            </ul>
          </motion.div>

          {/* Section 5 - Public Information */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">5. User Profiles and Public Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              FindATeammate is a social discovery platform. Certain profile information — such as your name, skills, and bio — is publicly visible by default. Please be mindful of what you share. You may be able to control visibility through your account settings.
            </p>
          </motion.div>

          {/* Section 6 - Data Retention */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your data within a reasonable timeframe, unless we must retain it for legal purposes.
            </p>
          </motion.div>

          {/* Section 7 - Security */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your information. However, no method of transmission is 100% secure, and we cannot guarantee absolute security.
            </p>
          </motion.div>

          {/* Section 8 - Cookies */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">8. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We use cookies to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Understand how you use the Platform</li>
              <li>Improve our services</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              You can control cookies through your browser settings. Disabling cookies may affect certain features.
            </p>
          </motion.div>

          {/* Section 9 - Third Party Links */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">9. Third-Party Links and Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Platform may contain links to third-party websites. We are not responsible for their privacy practices and encourage you to review their policies.
            </p>
          </motion.div>

          {/* Section 10 - Children's Privacy */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              FindATeammate is not intended for children under 13 (or 16 in applicable jurisdictions). We do not knowingly collect information from children. If we learn we have collected data from a child, we will delete it promptly.
            </p>
          </motion.div>

          {/* Section 11 - Your Rights */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">11. Your Rights and Choices</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You may have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li><strong>Access:</strong> Request a copy of the data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
              <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten").</li>
              <li><strong>Portability:</strong> Request your data in a portable format.</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails anytime.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where applicable.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              To exercise these rights, please contact us at the email below.
            </p>
          </motion.div>

          {/* Section 12 - International Users */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">12. International Users</h2>
            <p className="text-muted-foreground leading-relaxed">
              FindATeammate is operated from India. If you access from outside India, your information may be transferred to and processed in India or other countries. By using the Platform, you consent to such transfer.
            </p>
          </motion.div>

          {/* Section 13 - Changes */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">13. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page. Continued use after changes indicates your acceptance of the revised policy.
            </p>
          </motion.div>

          {/* Section 14 - Contact Us */}
          <motion.div variants={revealVariants} className="glass-panel p-8 lg:p-12 rounded-3xl border border-border/50">
            <h2 className="text-3xl font-display font-bold mb-4 text-primary">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions regarding this Privacy Policy, please contact us:
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
