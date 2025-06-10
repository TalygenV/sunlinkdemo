import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PanelSelectionButtonsProps {
  panelOptions: Array<{
    brand: string;
    model: string;
    wattage: number;
    efficiency: number;
    warranty: string;
    specs: {
      description: string;
      cellType: string;
      temperatureCoefficient: string;
      frame: string;
      dimensions: string;
    };
    keyFeatures: string[];
  }>;
  activePanel: {
    brand: string;
    model: string;
  };
  onSelectPanel: (panel: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PanelSelectionButtons: React.FC<PanelSelectionButtonsProps> = ({
  panelOptions,
  activePanel,
  onSelectPanel,
  isExpanded,
  onToggleExpand
}) => {
  // Remove the auto-scroll effect completely
  // Remove the panelSectionRef since we don't need it anymore

  useEffect(() => {
    const showcaseContainer = document.querySelector('.solar-panel-showcase');
    if (!showcaseContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only collapse when out of view, don't auto-expand
        if (!entry.isIntersecting && isExpanded) {
          onToggleExpand();
        }
      },
      {
        threshold: 0.1
      }
    );

    observer.observe(showcaseContainer);

    return () => {
      observer.disconnect();
    };
  }, [isExpanded, onToggleExpand]);

  const handlePanelSectionClick = () => {
    const showcaseContainer = document.querySelector('.solar-panel-showcase');
    if (!showcaseContainer) {
      console.error('Showcase container not found');
      return;
    }

    // Add a small delay to ensure the DOM is ready
    setTimeout(() => {
      showcaseContainer.scrollIntoView({ 
        behavior: 'auto', 
        block: 'center'
      });
      onToggleExpand();
    }, 100);
  };

  // Let's also log when the component mounts to verify the container exists
  useEffect(() => {
    const container = document.querySelector('.solar-panel-showcase');
    if (!container) {
      console.error('Showcase container not found on mount');
    }
  }, []);

  return (
    <div className="panel-selection-section">
      {/* Header with toggle */}
      <div 
        className="flex items-center justify-between py-3 px-1 cursor-pointer"
        onClick={handlePanelSectionClick}
      >
        <motion.div  className="flex justify-between items-center relative">
            <div className="relative">
              {/* Top left corner border */}
              
              
              <motion.h2 
                className="text-lg text-white font-light pb-1" 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
               Panels
              </motion.h2>
              <motion.p 
                className="text-gray-400 text-xs  pb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Select the panel type for your home
              </motion.p>
            </div>
          </motion.div>
          
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-4 h-4 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.7)]" />
        </motion.div>
      </div>
      
      {/* Panel Selection Buttons */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-full"
          >
            <div className="flex flex-wrap gap-2 mb-4 justify-center ">
              {panelOptions.map((panel, index) => (
                <motion.button
                  key={index}
                  onClick={() => onSelectPanel(panel)}
                  whileHover={activePanel && activePanel.brand === panel.brand && activePanel.model === panel.model ? 
                    { scale: 1.02 } : { scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative overflow-visible`}
                >
                  {activePanel && activePanel.brand === panel.brand && activePanel.model === panel.model && (
                    <>
                      {/* Glow Effect */}
                      <motion.div
                        className="absolute -inset-1 rounded-md z-0"
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
                      >
                       <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-md blur-[20px]" />
                      </motion.div>
                    </>
                  )}
                  
                  {/* Button Core - Now outside the conditional so all buttons show */}
                  <div className={`relative z-10 flex items-center justify-center gap-3 px-6 py-3 text-white rounded-md shadow-xl transition-all duration-500 border border-white/10 w-32 py-4 ${
                    activePanel && activePanel.brand === panel.brand && activePanel.model === panel.model 
                      ? 'bg-black' 
                      : 'bg-black/10 hover:bg-black/5'
                  }`}>
                    <span className="relative font-light text-base tracking-wider whitespace-nowrap text-center">
                      <div className="font-medium truncate">{panel.wattage}W</div>
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};