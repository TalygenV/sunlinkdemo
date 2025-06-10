import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { containerVariants } from "../utils/animations";

interface ErrorStateProps {
  error: string | null;
  title?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  error,
  title = "Error",
  onRetry,
}: ErrorStateProps) => (
  <motion.div
    variants={containerVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="flex flex-col items-center justify-center h-[600px] text-center relative"
  >
    <motion.div
      className="absolute -inset-8 rounded-3xl"
      animate={{
        opacity: [0.2, 0.4, 0.4, 0.2],
        scale: [1, 1.015, 1.015, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1],
        times: [0, 0.4, 0.6, 1],
        repeatType: "loop",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-white/10 to-red-500/20 rounded-3xl blur-[60px] opacity-60" />
    </motion.div>

    <div className="relative z-10 bg-black/40 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8 max-w-md">
      <AlertCircle className="w-16 h-16 text-red-400 mb-4 mx-auto icon-glow-red" />
      <h2 className="text-2xl font-light text-white mb-4">{title}</h2>
      <p className="text-gray-400 mb-6">
        {error || "An unexpected error occurred. Please try again later."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white text-sm transition-all duration-300"
        >
          Try Again
        </button>
      )}
    </div>
  </motion.div>
);
