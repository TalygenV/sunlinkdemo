import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SolarPanelViewer } from '../solar';
import { Info } from 'lucide-react';
import { TechnicalSpecsModal } from '../ui/modals';

const SolarPanelShowcase = ({ panelData, selectedPanel: externalSelectedPanel, onSelectPanel: externalSelectPanel, onViewModels }) => {
  const [internalSelectedPanel, setInternalSelectedPanel] = useState(null);
  const [savedPanels, setSavedPanels] = useState([]);
  const [highlightedPanel, setHighlightedPanel] = useState(null);
  
  // Use external selected panel if provided, otherwise use internal state
  const selectedPanel = externalSelectedPanel || internalSelectedPanel;
  
  // Default to first panel if none selected
  useEffect(() => {
    if (panelData?.solarPanels?.length > 0 && !selectedPanel) {
      setInternalSelectedPanel(panelData.solarPanels[0]);
      if (externalSelectPanel) externalSelectPanel(panelData.solarPanels[0]);
    }
  }, [panelData, selectedPanel, externalSelectPanel]);
  
  // Handle internal panel selection and notify parent component
  const handleSelectPanel = (panel) => {
    setInternalSelectedPanel(panel);
    if (externalSelectPanel) externalSelectPanel(panel);
  };
  
  // Save panel to project configuration
  const handleSavePanel = (panel) => {
    if (!savedPanels.some(p => p.brand === panel.brand && p.model === panel.model)) {
      setSavedPanels([...savedPanels, panel]);
    }
  };
  
  // Remove panel from saved panels
  const handleRemoveSavedPanel = (panel) => {
    setSavedPanels(savedPanels.filter(
      p => !(p.brand === panel.brand && p.model === panel.model)
    ));
  };
  
  // Calculate total estimated system price
  const calculateTotalPrice = (panels) => {
    return panels.reduce((total, panel) => {
      const basePrice = 0.75; // $0.75 per watt baseline
      let pricePerWatt;
      
      if (panel.wattage >= 430) {
        pricePerWatt = basePrice * 1.2; // Premium for high wattage
      } else if (panel.wattage >= 415) {
        pricePerWatt = basePrice * 1.1; // Slight premium
      } else {
        pricePerWatt = basePrice;
      }
      
      return total + (pricePerWatt * panel.wattage);
    }, 0).toFixed(2);
  };
  
  // Calculate system power in kW
  const calculateSystemPower = (panels) => {
    const totalWatts = panels.reduce((sum, panel) => sum + panel.wattage, 0);
    return (totalWatts / 1000).toFixed(2);
  };
  
  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
        duration: 0.4
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    },
    exit: {
      y: -10,
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.3
      }
    },
    hover: {
      y: -5,
      scale: 1.02,
      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.4)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };
  
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.95,
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15
      }
    }
  };

  // Value change animation variants
  const valueChangeVariants = {
    initial: { opacity: 0, y: 0 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -0 }
  };
  
  return (
    <div className="relative">
      <motion.div
        className="absolute -inset-1 rounded-2xl z-0"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-2xl blur-xl" />
      </motion.div>
      
      {/* Main content container with backdrop blur */}
      <div className="relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10">
        <motion.div
          className="p-10 solar-panel-showcase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex justify-between items-center relative">
              <motion.div 
                className="relative"
                layout
                layoutId="panel-header-container"
                transition={{ 
                  layout: { duration: 0.3, ease: "easeOut" }
                }}
              >
                {/* Top left corner border */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white/30 rounded-tl-md font-light"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-white/30 rounded-br-md"></div>
                {/* Top right corner border */}
                
                <motion.h2 
                  className="text-3xl text-white px-4 pt-2 font-light" 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                 Panels
                </motion.h2>
                
                <motion.div 
                  className="text-gray-400 text-sm px-4 py-2 pb-2 min-h-[24px] w-[280px]"
                  layout
                >
                  {selectedPanel ? (
                    <AnimatePresence mode="wait">
                      <motion.div 
                        className="flex items-center"
                        key={`panel-spec-${selectedPanel.wattage}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="tabular-nums">You've selected {selectedPanel.wattage}</span>
                        <span >W panels</span>
                      </motion.div>
                    </AnimatePresence>
                  ) : 'No panel selected'}
                </motion.div>
                
                {/* Information icon with text */}
              </motion.div>
            </motion.div>
            
            {/* Main content */}
            <div className="grid lg:grid-cols-1 gap-6">
              {/* Right Panel: Panel Specs */}
              <motion.div 
                variants={itemVariants}
                className="lg:col-span-1"
                layoutId="panelSpecsContainer"
              >
                <PanelSpecsView
                  panel={selectedPanel}
                  onSavePanel={handleSavePanel}
                  isSaved={savedPanels.some(
                    p => selectedPanel && p.brand === selectedPanel.brand && p.model === selectedPanel.model
                  )}
                  onRemoveSavedPanel={handleRemoveSavedPanel}
                  valueChangeVariants={valueChangeVariants}
                />
              </motion.div>
            </div>
            
            {/* Saved Configuration Section */}
            <AnimatePresence>
              {savedPanels.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mt-8 p-4 backdrop-blur-xl bg-black/60 rounded-xl border border-white/10"
                >
                  <motion.h3 
                    className="text-lg font-medium text-white mb-4 text-glow-accent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Your Saved Configuration
                  </motion.h3>
                  
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {savedPanels.map((panel, idx) => (
                      <motion.div 
                        key={`saved-panel-${idx}`}
                        className="bg-white/5 backdrop-blur-sm p-3 rounded-lg flex justify-between items-center border border-white/10"
                        variants={itemVariants}
                        whileHover={{
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          y: -3,
                          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.4)",
                          transition: { type: "spring", stiffness: 300, damping: 15 }
                        }}
                        onHoverStart={() => setHighlightedPanel(panel)}
                        onHoverEnd={() => setHighlightedPanel(null)}
                      >
                        <div>
                          <div className="text-white">{panel.brand} {panel.model}</div>
                          <div className="text-gray-400 text-sm">{panel.wattage}W, {panel.efficiency}% efficiency</div>
                        </div>
                        <motion.button
                          onClick={() => handleRemoveSavedPanel(panel)}
                          className="p-1 text-gray-400 hover:text-white rounded-full"
                          whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  <motion.div 
                    className="mt-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-800/40"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    whileHover={{
                      backgroundColor: "rgba(79, 70, 229, 0.2)",
                      borderColor: "rgba(99, 102, 241, 0.5)",
                      boxShadow: "0 0 20px rgba(79, 70, 229, 0.2)",
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-gray-300">System Size: <span className="text-white font-medium">{calculateSystemPower(savedPanels)} kW</span></div>
                        <div className="text-gray-300">Estimated Cost: <span className="text-white font-medium">${calculateTotalPrice(savedPanels)}</span></div>
                      </div>
                      <motion.button 
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        Finalize Design
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
      
      {/* 3D Viewer - placed OUTSIDE the main container */}
      <motion.div 
        variants={itemVariants}
        className="rounded-xl"
        layoutId="panelViewer"
        style={{
          overflow: "visible",
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          zIndex: 20
        }}
      >
        <SolarPanelViewer
          selectedPanel={selectedPanel}
          panelOptions={panelData?.solarPanels || []}
          onSelectPanel={handleSelectPanel}
          containerHeight={450}
        />
      </motion.div>
    </div>
  );
};

// Panel specs view for individual panel details
const PanelSpecsView = ({ 
  panel, 
  onSavePanel, 
  isSaved,
  onRemoveSavedPanel,
  valueChangeVariants
}) => {
  const [animatedValues, setAnimatedValues] = useState({
    wattage: 0,
    efficiency: 0
  });
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Set up animation when panel changes
  useEffect(() => {
    if (!panel) return;
    
    // Reset animation state when panel changes
    setAnimationComplete(false);
    
    // Animation setup
    const duration = 1000; // 1 second animation
    const startTime = Date.now();
    const startValues = {
      wattage: animatedValues.wattage,
      efficiency: animatedValues.efficiency
    };
    const targetValues = {
      wattage: panel.wattage,
      efficiency: panel.efficiency
    };
    const diffs = {
      wattage: targetValues.wattage - startValues.wattage,
      efficiency: targetValues.efficiency - startValues.efficiency
    };
    
    // Ease-out function for smoother animation
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      
      setAnimatedValues({
        wattage: Math.round(startValues.wattage + diffs.wattage * easedProgress),
        efficiency: parseFloat((startValues.efficiency + diffs.efficiency * easedProgress).toFixed(1))
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation is complete
        setAnimationComplete(true);
      }
    };
    
    requestAnimationFrame(animate);
  }, [panel?.wattage, panel?.efficiency]);
  
  if (!panel) return (
    <motion.div 
      className="h-full flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl border border-white/10"
      animate={{ opacity: [0.5, 1], y: [10, 0] }}
      transition={{ duration: 0.5 }}
      layoutId="emptyPanelState"
    >
      <motion.p 
        className="text-gray-400"
        animate={{ 
          opacity: [0.7, 1, 0.7], 
          scale: [0.98, 1, 0.98] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2 
        }}
      >
        Select a panel to view details
      </motion.p>
    </motion.div>
  );
  
  // Calculate efficiency class
  const getEfficiencyClass = (efficiency) => {
    if (efficiency >= 22) return {
      label: "Excellent",
      color: "text-green-500",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
      glowClass: "text-glow-green"
    };
    if (efficiency >= 21) return {
      label: "Very Good",
      color: "text-green-500",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
      glowClass: "text-glow-green"
    };
    if (efficiency >= 20) return {
      label: "Good",
      color: "text-green-500",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
      glowClass: "text-glow-green"
    };
    return {
      label: "Standard",
      color: "text-green-500",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
      glowClass: "text-glow-green"
    };
  };
  
  const efficiencyClass = getEfficiencyClass(panel.efficiency);
  
  // Estimate price based on wattage
  const estimatePrice = (wattage) => {
    const basePrice = 0.75; // $0.75 per watt baseline
    let pricePerWatt;
    
    if (wattage >= 430) {
      pricePerWatt = basePrice * 1.2; // Premium for high wattage
    } else if (wattage >= 415) {
      pricePerWatt = basePrice * 1.1; // Slight premium
    } else {
      pricePerWatt = basePrice;
    }
    
    return (pricePerWatt * wattage).toFixed(2);
  };
  
  // Animation variants for list items
  const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: custom => ({
      opacity: 1,
      x: 0,
      transition: { 
        delay: custom * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    }),
    hover: {
   
      x: 5,
      transition: { 
        duration: 0.2, 
        ease: "easeOut" 
      }
    }
  };
  
  return (
    <motion.div 
      className="h-full overflow-auto  p-4 "
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
   
      whileHover={{
      
        y: -3,
        transition: { duration: 0.3 }
      }}
    >
      <div className="grid grid-cols-1 gap-6">
        {/* Main Content Section */}
        <div className="p-3">
          {/* Panel Header */}
          <div className="mb-8">
            <div className="flex flex-col space-y-4 mt-4">
              <motion.div 
                className="p-4 border-b border-white/10"
                whileHover={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                }}
                layoutId="wattageCard"
              >
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 uppercase tracking-widest">Wattage</div>
                  <motion.div 
                    key={`wattage-${panel.wattage}`}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: animationComplete ? 1 : 0.5 }}
                    transition={{ duration: 0.3 }}
                    className="text-white text-xl font-light tabular-nums"
                  >
                    {animatedValues.wattage}W
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div 
                className="p-4 border-b border-white/10"
                whileHover={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                }}
                layoutId="efficiencyCard"
              >
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 uppercase tracking-widest">Efficiency</div>
                  <div className="flex items-center gap-2">
                    <motion.div 
                      key={`efficiency-label-${panel.efficiency}`}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: animationComplete ? 1 : 0.5 }}
                      transition={{ duration: 0.3 }}
                      className={`${efficiencyClass.color} ${efficiencyClass.glowClass} text-xs font-medium py-0.5 px-2`}
                    >
                      {efficiencyClass.label}
                    </motion.div>
                    <motion.div 
                      key={`efficiency-${panel.efficiency}`}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: animationComplete ? 1 : 0.5 }}
                      transition={{ duration: 0.3 }}
                      className="text-white text-xl font-light tabular-nums"
                    >
                      {animatedValues.efficiency}%
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="p-4"
                whileHover={{
                  y: -3,
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                }}
                layoutId="warrantyCard"
              >
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 uppercase tracking-widest">Warranty</div>
                  <AnimatePresence mode="popLayout">
                    <motion.div 
                      key={`warranty-${panel.warranty}`}
                      className="text-white text-xl font-light"
                      initial={valueChangeVariants.initial}
                      animate={valueChangeVariants.animate}
                      exit={valueChangeVariants.exit}
                      transition={{ duration: 0.3 }}
                    >
                      {panel.warranty}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Specifications */}
     
        </div>
      </div>
    </motion.div>
  );
};

export default SolarPanelShowcase;
