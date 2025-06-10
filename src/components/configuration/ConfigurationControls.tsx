import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { itemVariants } from '../utils/animations';

interface ConfigurationControlsProps {
  currentConfigIndex: number;
  panelsCount: number;
  totalConfigs: number;
  onPrevConfig: () => void;
  onNextConfig: () => void;
}

export const ConfigurationControls = ({
  currentConfigIndex,
  panelsCount,
  totalConfigs,
  onPrevConfig,
  onNextConfig
}: ConfigurationControlsProps) => (
  <motion.div
    variants={itemVariants}
    transition={{ delay: 0.1 }}
    className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 glass-morphism-premium rounded-full px-4 sm:px-6 py-2 sm:py-3 text-white w-fit mx-auto shadow-premium-sm border border-white/10 animate-soft-glow"
  >
    <motion.button
      onClick={onPrevConfig}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="p-2 hover:bg-white/10 rounded-full transition-all-bounce text-yellow-300"
      disabled={currentConfigIndex === 0}
    >
      <ChevronLeft className="w-5 h-5 icon-glow-accent" />
    </motion.button>
    
    <div className="text-center min-w-[120px] px-2 py-1 bg-black/20 backdrop-blur-sm rounded-xl border border-white/5">
      <div className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 text-glow-subtle">Configuration {currentConfigIndex + 1}</div>
      <div className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center"
        >
          <span className="text-yellow-400">{panelsCount}</span> 
          <span> Panels</span>
        </motion.div>
      </div>
    </div>
    
    <motion.button
      onClick={onNextConfig}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="p-2 hover:bg-white/10 rounded-full transition-all-bounce text-yellow-300"
      disabled={currentConfigIndex === totalConfigs - 1}
    >
      <ChevronRight className="w-5 h-5 icon-glow-accent" />
    </motion.button>
  </motion.div>
);