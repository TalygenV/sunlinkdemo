import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, Trash2, PlusCircle, RefreshCw, Layers } from 'lucide-react';
import { controlButtonVariants } from '../utils/animations';

interface Region {
  id: number;
  panelCount: number;
  calculatedPanelCount?: number;
  solarPanelData?: any;
  features?: any[];
  selectedIds?: any[];
}

interface ManualPanelControlsProps {
  totalManualPanels: number;
  onResetManualPanels?: () => void;
  onDeleteRegion?: () => void;
  onEnableDrawMode?: () => void;
  onRotationChange?: (rotation: number) => void;
  currentRotation: number;
  regions?: Region[];
  selectedRegionId?: number | null;
  onRegionSelect?: (regionId: number) => void;
  obstructedPanelIds?: Set<string>;
}

export const ManualPanelControls: React.FC<ManualPanelControlsProps> = ({
  totalManualPanels,
  onResetManualPanels,
  onDeleteRegion,
  onEnableDrawMode,
  onRotationChange,
  currentRotation,
  regions = [],
  selectedRegionId = null,
  onRegionSelect,
  obstructedPanelIds = new Set<string>()
}) => {
  // Simple indicator for showing "Calculating..." text
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // Helper function to get the best panel count for a region
  const getRegionPanelCount = (region: Region): number => {
    // Try to directly count the solar panel features as this is most accurate post-rotation
    if (region.solarPanelData?.features?.length) {
      // Filter out obstructed panels using the passed in obstructedPanelIds
      const nonObstructedPanels = region.solarPanelData.features.filter(
        (feature: any) => 
          !obstructedPanelIds.has(feature.properties.id) && // Check against obstructedPanelIds
          !feature.properties.isObstructed && 
          feature.properties.selected !== false
      );
      return nonObstructedPanels.length;
    }
    
    // Next try calculatedPanelCount which should be more accurate during rotation
    if (typeof region.calculatedPanelCount === 'number' && region.calculatedPanelCount > 0) {
      return region.calculatedPanelCount;
    }
    
    // Next check standard panelCount 
    if (typeof region.panelCount === 'number' && region.panelCount > 0) {
      return region.panelCount;
    }
    
    // Try to calculate from other sources
    if (region.features?.length) {
      return region.features.length;
    }
    
    // Calculate from selectedIds if available
    if (region.selectedIds?.length) {
      const selected = region.selectedIds.filter((item: any) => item.selected !== false).length;
      return selected > 0 ? selected : region.selectedIds.length;
    }
    
    // Fallback to 0 if we can't determine
    return 0;
  };

  // Handle rotation change - directly update parent
  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRotation = parseInt(e.target.value);
    
    // Start showing calculating indicator
    setIsRotating(true);
    
    // Call parent immediately to show visual rotation
    if (onRotationChange) {
      onRotationChange(newRotation);
    }
    
    // Clear the indicator after a delay
    setTimeout(() => {
      setIsRotating(false);
    }, 500);
  };
  
  return (
    <div className="manual-panel-controls ">
     

      {/* Region Selection */}
      {regions.length > 0 && (
        <div className="mb-4">
       
          <div   className="flex overflow-x-auto gap-2 pb-2 thin-scrollbar"
  style={{ 
    msOverflowStyle: 'none',
    scrollbarWidth: '3px',
    cursor: 'pointer',
   
  }}
>
            {regions.map((region, index) => (
              <motion.button
                key={`region-${region.id}`}
      
             
                onClick={() => onRegionSelect?.(region.id)}
                className="group relative overflow-visible flex-shrink-0 "
              >
                {selectedRegionId === region.id && (
                  <>
                    {/* Glow Effect */}
                    <motion.div
                      className="absolute -inset-1 rounded-md z-0"
                      animate={{ 
                        opacity: [0.4, 0.6, 0.4],
                  
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
                <div className={`relative z-10 py-1 px-2 rounded-md text-xs text-center transition-all duration-500 ${
                  selectedRegionId === region.id
                    ? 'bg-black text-white border border-white/10'
                    : 'bg-black/40 text-white/90 border border-white/10 hover:bg-black/60'
                }`}>
                  <div className="flex  items-center justify-center pb-1  border-b border-white/5 ">
                    Section {index + 1}
                  </div>
                
                  <div className="text-[10px] ">
                    {isRotating && region.id === selectedRegionId ? (
                      <span className="inline-flex items-center">
                        <RefreshCw className="w-2 h-2 mr-1 animate-spin" />
                    
                      </span>
                    ) : (
                      `${getRegionPanelCount(region)} panels`
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Buttons Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <motion.button
          variants={controlButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => {
       
            setTimeout(() => {
              if (onEnableDrawMode) {
                onEnableDrawMode();
              }
            }, 200);
          }}
          className="flex flex-col items-center justify-center py-3 px-2 rounded-md bg-black/40 border border-white/10 hover:bg-black/60 transition-colors text-white/90"
        >
          <PlusCircle className="w-5 h-5 mb-1" />
          <span className="text-xs">Draw Section</span>
        </motion.button>
        
        <motion.button
          variants={controlButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={onDeleteRegion}
          className="flex flex-col items-center justify-center py-3 px-2 rounded-md bg-black/40 border border-white/10 hover:bg-black/60 transition-colors text-white/90"
        >
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-xs">Delete Section</span>
        </motion.button>
        
        <motion.button
          variants={controlButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={onResetManualPanels}
          className="flex flex-col items-center justify-center py-3 px-2 rounded-md bg-black/40 border border-white/10 hover:bg-black/60 transition-colors text-white/90"
        >
          <RefreshCw className="w-5 h-5 mb-1" />
          <span className="text-xs">Reset All</span>
        </motion.button>
      </div>

      {/* Rotation Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-gray-400 text-sm">
            {selectedRegionId !== null 
              ? `Section ${regions.findIndex(r => r.id === selectedRegionId) + 1} Rotation` 
              : 'Section Rotation'}
          </div>
          <div className="text-white text-sm">{currentRotation}°</div>
        </div>
        <input
          type="range"
          min="0"
          max="359"
          value={currentRotation}
          onChange={handleRotationChange}
          className="w-full h-2 bg-orange-700 rounded-full appearance-none cursor-pointer 
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
          [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none"
        />
      </div>
    </div>
  );
};

export default ManualPanelControls; 