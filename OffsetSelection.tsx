import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OffsetSelectionProps {
  annualUsage: number;
  sortedPanelEfficiencies: number[]; // Replace energyPerPanel with sortedPanelEfficiencies
  currentPanelCount: number;
  totalPanels: number;
  onUpdatePanelCount: (newCount: number) => void;
  totalManualPanels?: number;     // New prop for manual panel count
  manualPanelEnergy?: number;     // New prop for manual panel energy
}

export const OffsetSelection: React.FC<OffsetSelectionProps> = ({
  annualUsage,
  sortedPanelEfficiencies,
  currentPanelCount,
  totalPanels,
  onUpdatePanelCount,
  totalManualPanels = 0,
  manualPanelEnergy = 0,
}) => {
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const lastCalculatedPanelCount = useRef<number | null>(null);
  
  // Track the last panel count set by the offset selection
  useEffect(() => {
    // If panel count changed externally and we have a selected offset
    if (lastCalculatedPanelCount.current !== null && 
        currentPanelCount !== lastCalculatedPanelCount.current &&
        selectedOffset !== null) {
      // Unselect the offset button
      setSelectedOffset(null);
      lastCalculatedPanelCount.current = null;
    }
  }, [currentPanelCount, selectedOffset]);

  // Auto-select 100% offset when component mounts with no panels
  useEffect(() => {
    // Only run on initial mount when no panels are active
    if (currentPanelCount === 0 && selectedOffset === null && annualUsage !== 12000) {
      // Set 100% offset
     
      handleOffsetSelection(100);
    }
  }, [annualUsage]);
  
  // Calculate the current offset percentage based on the current panel count
  const calculateCurrentOffset = (): number => {
    // Calculate total energy from the most efficient panels up to the current panel count
    let totalEnergyDcKwh = 0;
    for (let i = 0; i < Math.min(currentPanelCount, sortedPanelEfficiencies.length); i++) {
      totalEnergyDcKwh += sortedPanelEfficiencies[i];
    }
    
    // Add manual panel energy if manual panels exist
    if (totalManualPanels > 0 && manualPanelEnergy > 0) {
      totalEnergyDcKwh += totalManualPanels * 390;
    }
    
    return Math.max(0, ((totalEnergyDcKwh - annualUsage) / annualUsage + 1) * 100);
  };
  
  // Calculate how many panels are needed for a given offset percentage
  const calculatePanelsForOffset = (offsetPercentage: number): number => {
    // Calculate target energy production
    const targetEnergy = annualUsage * (offsetPercentage / 100);
    
    // First, subtract manual panel energy if manual panels exist
    let remainingTargetEnergy = targetEnergy;
    if (totalManualPanels > 0 && manualPanelEnergy > 0) {
      remainingTargetEnergy = Math.max(0, targetEnergy - totalManualPanels * 390);
    }
    
    // For the 150% case specifically, we add a small adjustment to prevent
    // the need for double-clicking
    let adjustedTarget = remainingTargetEnergy;
    if (offsetPercentage === 150) {
      // Add a tiny boost (0.5%) to the target energy for 150% to push it over the threshold
      adjustedTarget = remainingTargetEnergy * 1.005;
    }
    
    // Implement greedy algorithm
    let cumulativeEnergy = 0;
    let panelsNeeded = 0;
    
    // Add panels one by one in order of efficiency
    for (let i = 0; i < sortedPanelEfficiencies.length; i++) {
      const panelEnergy = sortedPanelEfficiencies[i];
      if (cumulativeEnergy < adjustedTarget && panelsNeeded < totalPanels) {
        cumulativeEnergy += panelEnergy;
        panelsNeeded++;
      } else {
        break;
      }
    }
    
    return panelsNeeded;
  };
  
  // Handle offset selection
  const handleOffsetSelection = (offset: number) => {
    // If clicking the already selected button, deselect it
    if (selectedOffset === offset) {
      setSelectedOffset(null);
      return;
    }
    
    // Set the selected offset
    setSelectedOffset(offset);
  
    // Calculate the new panel count
    const newPanelCount = calculatePanelsForOffset(offset);
    
    // Update the panel count and store the value
    lastCalculatedPanelCount.current = newPanelCount;
    onUpdatePanelCount(newPanelCount);
  };
  
  // Available offset options
  const offsetOptions = [60, 100, 120, 150];
  
  return (
 
     
      <div className="flex gap-1  justify-center items-center h-full">
        {offsetOptions.map((offset) => (
          <motion.button
            key={offset}
            onClick={() => handleOffsetSelection(offset)}
            whileHover={selectedOffset === offset ? { scale: 1.02 } : { scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-visible"
          >
            {selectedOffset === offset && (
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
            
            {/* Button Core */}
            <div className={`relative z-10 flex items-center justify-center px-2 py-1 text-white rounded-md shadow-xl transition-all duration-500 border border-white/10 w-16 ${
              selectedOffset === offset 
                ? 'bg-black' 
                : 'bg-black/10 hover:bg-black/5'
            }`}>
              <span className="text-sm ">{offset}%</span>
            </div>
          </motion.button>
        ))}
      </div>
   
  );
};