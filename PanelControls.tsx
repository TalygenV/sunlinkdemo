import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, HelpCircle } from 'lucide-react';
import { itemVariants, controlButtonVariants } from '../utils/animations';

interface PanelControlsProps {
  activePanels: number;
  totalPanels: number;
  onDecreasePanels: () => void;
  onIncreasePanels: () => void;
}

export const PanelControls = ({
  activePanels,
  totalPanels,
  onDecreasePanels,
  onIncreasePanels
}: PanelControlsProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [buttonLastClicked, setButtonLastClicked] = useState<'plus' | 'minus' | null>(null);
  
  // Calculate percentage of active panels for the progress bar
  const activePercentage = totalPanels > 0 ? (activePanels / totalPanels) * 100 : 0;
  
  // Handle decrease button click
  const handleDecrease = () => {
    if (activePanels > 0) {
      setButtonLastClicked('minus');
      onDecreasePanels();
    }
  };
  
  // Handle increase button click
  const handleIncrease = () => {
    if (activePanels < totalPanels) {
      setButtonLastClicked('plus');
      onIncreasePanels();
    }
  };
  
  return (
    <motion.div
      variants={itemVariants}
      className="relative flex flex-col items-center"
    >
      {/* Main control panel */}
      <motion.div
        className="flex items-center gap-1 px-4 py-2 text-white select-none"
      >
        {/* Decrease button */}
        <motion.button
          variants={controlButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={handleDecrease}
          className={`relative w-9 h-9 flex items-center justify-center rounded-full ${
            activePanels === 0
              ? 'bg-white/5 text-gray-500 cursor-not-allowed'
              : ' text-white  border border-white/20'
          } transition-colors`}
          disabled={activePanels === 0}
        >
          <Minus className="w-4 h-4" />
        </motion.button>
        
        {/* Panel count display */}
        {/* <motion.div
            className="absolute -right-7 top-1/2 -translate-y-1/2 cursor-help"
            onHoverStart={() => setShowTooltip(true)}
            onHoverEnd={() => setShowTooltip(false)}
          >
            <HelpCircle className="w-3 h-3 text-gray-500" />
          </motion.div> */}
        <div className="relative text-center min-w-[60px] group">
          <div className="flex flex-col">
            <motion.div
              key={activePanels}
              initial={{ opacity: 0, y: buttonLastClicked === 'plus' ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-light tracking-wide"
            >
              <span className="text-white text-2xl font-lg">{activePanels}</span>
         
            </motion.div>
            
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">{activePanels === 1 ? 'Panel' : 'Panels'}</div>
          </div>
          
          {/* Help icon */}
      
          
          {/* Panel percentage progress bar */}
       
        </div>
        
        {/* Increase button */}
        <motion.button
          variants={controlButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={handleIncrease}
          className="group relative w-9 h-9 overflow-visible"
          disabled={activePanels === totalPanels}
        >
          {/* Glow Effect */}
          <motion.div
            className="absolute -inset-1 rounded-full z-0"
            animate={{ 
              opacity: [0.4, 0.6, 0.4],
              scale: [1, 1.03, 1]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
            style={{
              opacity: activePanels === totalPanels ? 0 : 1
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[20px]" />
          </motion.div>

          {/* Button Core */}
          <div 
            className={`btn-sheen relative z-10 flex items-center justify-center w-full h-full rounded-full shadow-xl transition-all duration-500 border border-white/10 ${
              activePanels === totalPanels
                ? 'text-gray-500 cursor-not-allowed bg-white/5'
                : 'text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
          </div>
        </motion.button>
      </motion.div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -bottom-16 bg-black/90 backdrop-blur-xl text-white text-xs px-3 py-2 rounded-lg border border-white/10 shadow-xl z-10 w-48"
          >
            Adjust the number of active solar panels in your configuration
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-black/90 border-t border-l border-white/10"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};