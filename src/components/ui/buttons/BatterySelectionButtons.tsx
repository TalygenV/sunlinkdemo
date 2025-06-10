import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BatterySelectionButtonsProps {
  batteryOptions: Array<{
    name: string;
    capacity: number;
    unit: string;
    warranty: number;
    warrantyUnit: string;
    price: number;
    currency: string;
    specifications: {
      roundTripEfficiency: number;
      depthOfDischarge: number;
      cycleLife: number;
      operatingTemperature: {
        min: number;
        max: number;
        unit: string;
      };
    };
    features: string[];
  }>;
  activeBattery: {
    name: string;
    capacity: number;
  };
  onSelectBattery: (battery: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const BatterySelectionButtons: React.FC<BatterySelectionButtonsProps> = ({
  batteryOptions,
  activeBattery,
  onSelectBattery,
  isExpanded,
  onToggleExpand
}) => {
  useEffect(() => {
    const showcaseContainer = document.querySelector('.battery-showcase');
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

  const handleBatterySectionClick = () => {
    const showcaseContainer = document.querySelector('.battery-showcase');
    if (!showcaseContainer) {
      console.error('Battery showcase container not found');
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
    const container = document.querySelector('.battery-showcase');
    if (!container) {
      console.error('Battery showcase container not found on mount');
    }
  }, []);

  return (
    <div className="battery-selection-section">
      {/* Header with toggle */}
      <div 
        className="flex items-center justify-between py-3 px-1 cursor-pointer"
        onClick={handleBatterySectionClick}
      >
            
        <motion.div  className="flex justify-between items-center relative">
            <div className="relative">
              {/* Top left corner border */}
              
              
              <motion.h2 
                className="text-lg text-white font-light pb-1 tracking-wide" 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
               Batteries
              </motion.h2>
              <motion.p 
                className="text-gray-400 text-xs  pb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Add batteries to your cart
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
      
      {/* Battery Selection Buttons */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-full"
          >
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {batteryOptions.map((battery, index) => (
                <motion.button
                  key={index}
                  onClick={() => onSelectBattery(battery)}
                  whileHover={activeBattery && activeBattery.name === battery.name ? 
                    { scale: 1.02 } : { scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative overflow-visible`}
                >
                  {activeBattery && activeBattery.name === battery.name && (
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
                    activeBattery && activeBattery.name === battery.name 
                      ? 'bg-black' 
                      : 'bg-black/10 hover:bg-black/5'
                  }`}>
                    <span className="relative font-light text-base tracking-wide whitespace-nowrap text-center">
                      <div className="font-medium truncate">{battery.capacity}{battery.unit}</div>
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="w-full md:w-auto flex justify-center pt-3 pb-4">
                    <motion.button
                      key="cta-button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative w-full md:w-auto overflow-visible mx-auto"
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
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[20px]" />
                      </motion.div>

                      {/* Button Core */}
                      <div className="btn-sheen relative z-10 flex items-center justify-center gap-3 px-8 py-4 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10">
                        {/* Text Content */}
                        <span className="relative font-light text-sm tracking-wider">
                          Add To Cart
                        </span>
                        
                        {/* Arrow with Enhanced Animation */}
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          
                        </motion.div>
                      </div>
                    </motion.button>
                  </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};