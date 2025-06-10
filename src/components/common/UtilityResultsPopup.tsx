import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface UtilityResultsPopupProps {
  genabilityData: {
    utilityName: string;
    pricePerKwh: number;
    estimatedMonthlyKwh: number;
    recommendedSizeKw: number;
    estimatedAnnualSavings: number;
  };
  onClose: () => void;
}

const popupVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const UtilityResultsPopup: React.FC<UtilityResultsPopupProps> = ({
  genabilityData,
  onClose,
}) => {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
      variants={popupVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative max-w-lg w-full mx-4 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8"
        animate={{
          boxShadow: [
            "0 0 20px 0 rgba(255,255,255,0.1)",
            "0 0 25px 2px rgba(255,255,255,0.12)",
            "0 0 25px 2px rgba(255,255,255,0.12)",
            "0 0 20px 0 rgba(255,255,255,0.1)",
          ],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
          times: [0, 0.4, 0.6, 1],
          repeatType: "loop",
        }}
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/20 to-blue-500/20 rounded-3xl blur-[60px] opacity-60" />
        </motion.div>

        <div className="relative z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-300"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl md:text-3xl font-light text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80 mb-6 text-center">
            Your Solar Savings Estimate
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-gray-400 text-sm uppercase tracking-wide">
                Utility Provider
              </span>
              <span className="text-white font-medium">
                {genabilityData.utilityName}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-gray-400 text-sm uppercase tracking-wide">
                Price per kWh
              </span>
              <span className="text-white font-medium">
                ${genabilityData.pricePerKwh.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-gray-400 text-sm uppercase tracking-wide">
                Estimated Monthly Usage
              </span>
              <span className="text-white font-medium">
                {Math.round(genabilityData.estimatedMonthlyKwh)} kWh
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-gray-400 text-sm uppercase tracking-wide">
                Recommended System Size
              </span>
              <span className="text-white font-medium">
                {genabilityData.recommendedSizeKw.toFixed(1)} kW
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm uppercase tracking-wide">
                Estimated Annual Savings
              </span>
              <span className="text-white font-medium">
                ${Math.round(genabilityData.estimatedAnnualSavings)}
              </span>
            </div>
          </div>

          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 w-full h-[52px] flex items-center justify-center px-8 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium tracking-wider"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UtilityResultsPopup;
