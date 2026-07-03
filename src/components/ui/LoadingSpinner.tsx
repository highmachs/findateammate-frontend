import { motion } from "framer-motion";

export const LoadingSpinner = () => {
    return (
        <div className="h-screen w-full flex items-center justify-center abstract-bg fixed inset-0 z-50">
            <div className="relative">
                {/* Outer Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-4 border-t-primary border-r-accent border-b-secondary border-l-transparent blur-[1px]"
                />

                {/* Inner Ring */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full border-4 border-t-accent border-r-transparent border-b-primary border-l-transparent opacity-80"
                />

                {/* Center Pulse */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                />
            </div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute mt-32 text-lg font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
            >
                Loading Experience...
            </motion.p>
        </div>
    );
};
