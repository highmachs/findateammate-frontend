import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Ghost, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen abstract-bg flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="text-center relative z-10 max-w-lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-40 h-40 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20 shadow-2xl relative"
        >
          <Ghost size={80} className="text-primary opacity-80" />

          {/* Animated Question Marks */}
          <motion.span
            animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-4 -right-4 text-4xl font-black text-accent"
          >?</motion.span>
          <motion.span
            animate={{ y: [0, -15, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
            className="absolute -top-8 left-0 text-3xl font-black text-secondary"
          >?</motion.span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-8xl font-display font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
        >
          404
        </motion.h1>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-6 text-foreground"
        >
          Teammate Not Found
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-10 text-lg leading-relaxed"
        >
          The page you are looking for has disconnected from the server. It might have been deleted or never existed.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link href="/">
            <Button size="lg" className="rounded-full h-14 px-8 font-bold shadow-lg shadow-primary/20">
              <Home className="mr-2" size={18} /> Return Home
            </Button>
          </Link>
          <Link href="/teammates">
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 font-bold bg-white/50 hover:bg-white/80 border-white/40">
              <ArrowLeft className="mr-2" size={18} /> Browse Projects
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
