import React, { useState, useEffect, lazy, Suspense, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronRight, ChevronLeft } from 'lucide-react';
import TechnicalSpecsModal from '../ui/modals/TechnicalSpecsModal';
// Import the panel data directly
import panelOptionsData from '../../products/panels/panel_options.json';

// Lazy load the 3D viewer component
const SolarPanelViewer = lazy(() => import('./SolarPanelViewer'));

const SolarPanelShowcase = () => {
  // Find the 400W panel from the imported data
  const panel400W = panelOptionsData.solarPanels.find(panel => panel.wattage === 400);
  
  // Check if we're on mobile immediately
  const initialIsMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // State initialization with the 400W panel
  const [selectedPanel, setSelectedPanel] = useState(panel400W || null);
  const [savedPanels, setSavedPanels] = useState([]);
  const [highlightedPanel, setHighlightedPanel] = useState(null);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [viewerKey, setViewerKey] = useState(0); // Add a key to force re-render
  
  // Check if we're on mobile
  useLayoutEffect(() => {
    const checkIfMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        // Force re-render of viewer component when switching modes
        setViewerKey(prevKey => prevKey + 1);
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [isMobile]);
  
  // Trigger a global resize event when isMobile changes to force WebGL resize
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isMobile, viewerKey]);
  
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
  
  // Toggle specs expanded state
  const toggleSpecsExpanded = () => {
    setIsSpecsExpanded(!isSpecsExpanded);
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
  
  // Handle view models click (stub function since we removed the prop)
  const handleViewModels = () => {
    console.log("View models clicked");
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
        className={`absolute -inset-1 rounded-3xl z-0 ${isSpecsExpanded ? 'w-full' : isMobile ? 'w-full' : 'w-1/2'} rounded-xl`}
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
        <div  />
      </motion.div>
         {/* 3D Viewer */}
         <motion.div 
        variants={itemVariants}
        className="rounded-xl"
        layoutId="panelViewer"
        style={{
          overflowY: "visible",
          position: isMobile ? "absolute" : "absolute",
          top: isMobile ? "39%" : 0,
          right: isMobile ? "0%" : 0,
          width: isSpecsExpanded ? "0%" : isMobile ? "100%" : "40%",
          height: isMobile ? "300px" : "100%",
          zIndex: 40,
          opacity: isSpecsExpanded ? 0 : 1,
          marginTop: isMobile ? "16px" : 0,
          transition: "width 0.5s ease-out, opacity 0.3s ease-out, height 0.5s ease-out"
        }}
      >
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-white">Loading 3D Viewer...</div>}>
          <SolarPanelViewer
            key={viewerKey}
            selectedPanel={selectedPanel}
            panelOptions={[selectedPanel]} // Only pass the 400W panel
            containerHeight={isMobile ? 300 : 450}
            isMobile={isMobile}
          />
        </Suspense>
      </motion.div>
      {/* Main content container with backdrop blur */}
      <motion.div 
        className={`relative z-10  ${!isMobile ? 'border border-white/10' : ''} rounded-3xl overflow-visible`}
        animate={{ 
          width: isSpecsExpanded ? "100%" : isMobile ? "100%" : "60%"
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="p-8 solar-panel-showcase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-3"
        >
          {/* Header - hidden on mobile when expanded */}
          <motion.div 
            variants={itemVariants} 
            className="flex justify-between items-center relative"
            animate={{ 
              opacity: isMobile && isSpecsExpanded ? 0 : 1,
              height: isMobile && isSpecsExpanded ? 0 : 'auto',
              marginBottom: isMobile && isSpecsExpanded ? 0 : undefined,
              pointerEvents: isMobile && isSpecsExpanded ? 'none' : 'auto'
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="relative"
              layout
              layoutId="panel-header-container"
              transition={{ 
                layout: { duration: 0.3, ease: "easeOut" }
              }}
            >
              {/* Top left corner border */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white/30 font-light"></div>
              <div className={`absolute -bottom-1 ${isMobile ? '-right-0' : '-right-8'}  w-6 h-6 border-b-2 border-r-2 border-white/30 `}></div>
              
              <motion.h2 
                className="text-5xl md:text-5xl text-white px-4 pt-2 font-light tracking-wide text-left" 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                >
                Power Meets Elegance
              </motion.h2>
              
              <motion.div 
                className="text-gray-400 text-xl px-4 py-3 pb-2 min-h-[24px] md:w-[400px]"
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
                      <span className="tabular-nums">
                        Say hello to Tier 1 black-on-black panels
                      </span>
                    </motion.div>
                  </AnimatePresence>
                ) : 'No panel selected'}
              </motion.div>
              
              {/* Information icon with text */}
            </motion.div>
          </motion.div>
          
          {/* Main content - modified to single column */}
          <div className="grid grid-cols-1 gap-6">
            {/* Panel Specs - taking full container on mobile when expanded */}
            <motion.div 
              variants={itemVariants}
              className="col-span-1"
              layoutId="panelSpecsContainer"
              animate={{
                marginTop: isMobile && isSpecsExpanded ? -60 : 0, // Move up to replace header on mobile
                height: isMobile && isSpecsExpanded ? 'calc(100% + 60px)' : 'auto' // Fill the space of the header too
              }}
              style={isMobile && {opacity: 0}}
              transition={{ duration: 0.4 }}
            >
              <PanelSpecsView
                panel={selectedPanel}
                onSavePanel={handleSavePanel}
                isSaved={savedPanels.some(
                  p => selectedPanel && p.brand === selectedPanel.brand && p.model === selectedPanel.model
                )}
                onRemoveSavedPanel={handleRemoveSavedPanel}
                valueChangeVariants={valueChangeVariants}
                isExpanded={isSpecsExpanded}
                onToggleExpand={toggleSpecsExpanded}
              
                isMobile={isMobile}
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
                        <div className="text-gray-400 text-md">{panel.wattage}W, {panel.efficiency}% efficiency</div>
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
  valueChangeVariants,
  isExpanded,
  onToggleExpand,
  isMobile
}) => {
  const [animatedValues, setAnimatedValues] = useState({
    wattage: 0,
    efficiency: 0
  });
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  
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
  
  // Add an effect to manage content visibility based on expansion state
  useEffect(() => {
    if (isExpanded) {
      // When expanding, make the container expand first, then show content
      const timer = setTimeout(() => {
        setIsContentVisible(true);
      }, 300); // Start showing content after container has expanded
      return () => clearTimeout(timer);
    } else {
      // When collapsing, hide content first
      setIsContentVisible(false);
    }
  }, [isExpanded]);
  
  // Add another effect to handle the toggle expand click
  const handleToggleClick = () => {
    if (isExpanded) {
      // First hide content, then collapse container after delay
      setIsContentVisible(false);
      setTimeout(() => {
        onToggleExpand();
      }, 300); // Wait for content to fade out before toggling expand state
    } else {
      // Just expand container immediately
      onToggleExpand();
    }
  };
  
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
        delay: custom * 1,
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

  // Special case for mobile expanded view - render a completely different layout
  if (isMobile && isExpanded) {
    return (
      <motion.div 
        className="h-full p-2 pt-0 relative "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex-1 flex flex-col min-h-0 pb-[200px]">
          {/* Full-width header with back button for mobile expanded view */}
          <motion.div 
            className="flex justify-between items-center mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <h2 className="text-3xl text-white font-light">Panel Details</h2>
            <motion.button
              className="p-2 text-gray-300 hover:text-white rounded-full bg-white/5 backdrop-blur-sm"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleClick}
            >
              <ChevronLeft size={24} />
            </motion.button>
          </motion.div>
          
          {/* Panel stats in horizontal layout */}
          <motion.div 
            className="grid grid-cols-3 gap-3 mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg flex flex-col justify-center items-center">
              <div className="text-gray-500 uppercase tracking-widest text-xs text-center">Wattage</div>
              <div className="text-white text-xl font-light tabular-nums text-center">{panel.wattage}W</div>
            </div>
            
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg flex flex-col justify-center items-center">
              <div className="text-gray-500 uppercase tracking-widest text-xs text-center">Efficiency</div>
              <div className="text-white text-xl font-light tabular-nums text-center">{panel.efficiency}%</div>
            </div>
            
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg flex flex-col justify-center items-center">
              <div className="text-gray-500 uppercase tracking-widest text-xs text-center">Warranty</div>
              <div className="text-white text-xl font-light text-center">25y</div>
            </div>
          </motion.div>
          
          {/* Detailed content */}
          <motion.div 
            className="flex-1 overflow-y-auto min-h-0 text-gray-300 space-y-4 text-med pt-2 "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <p className="text-white/90 leading-relaxed">
              High-efficiency, premium modules designed for a sleek, modern look while delivering top-tier performance. 
            </p>
            
            <div className="space-y-2">
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>High Efficiency (20%-22%) – Delivers maximum power output with advanced monocrystalline cell technology.</li>
                <li>Sleek All-Black Design – Blends seamlessly with rooftops for a modern, uniform appearance.</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-white font-light text-md tracking-wide">Recommended For</h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Homeowners prioritizing aesthetics without sacrificing performance</li>
                <li>HOAs or areas with strict design guidelines</li>
                <li>High-end residential and commercial projects</li>
              </ul>
            </div>
            
           
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Regular desktop/mobile collapsed view
  return (
    <motion.div 
      className="h-full overflow-visible p-4 relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{ 
        height: isMobile ? '30dvh' : '40dvh', 
        opacity: isMobile ? 0 : 1 
      }} // Adjusted height for mobile and hiding on mobile
    >
      <div className="h-full flex">
        {/* Left column - panel specs cards - no layoutId to prevent animation */}
        <motion.div 
          className={`transition-all duration-300 ease-out ${isExpanded ? 'w-1/3' : 'w-full'}`}
          animate={{ 
            width: isExpanded ? '33.333%' : '100%',
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3 h-full mt-1 flex items-center justify-center">
          {isMobile &&   <div className="flex items-center justify-end absolute top-[-105%] right-0">
        <motion.button
          className="relative text-gray-500 rounded-r-md z-9999 flex items-center mr-[-10px] mt-4"
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleClick}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          
        >
          <span className="text-med c uppercase tracking-widest mr-1 z-50 " >Details</span>
          {isExpanded ? <ChevronLeft size={20} /> : null}
        </motion.button>
      </div>}
            <div className="flex flex-col space-y-4 w-full">
              <span style={isMobile ? {opacity: 0} : {}}>
              <div 
                className="p-3 border-b border-white/10"
                style={{ 
                  transition: 'border-color 0.3s ease',
                  borderColor: "rgba(255, 255, 255, 0.1)" 
                  
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-med text-gray-500 uppercase tracking-widest">Wattage</div>
                  <div 
                    className="text-white text-2xl font-light tabular-nums"
                  >
                    {animatedValues.wattage}W
                  </div>
                </div>
              </div>
              
              <div 
                className="p-4 border-b border-white/10"
                style={{ 
                  transition: 'border-color 0.3s ease',
                  borderColor: "rgba(255, 255, 255, 0.1)" 
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-med text-gray-500 uppercase tracking-widest">Efficiency</div>
                  <div className="flex items-center gap-2">
                  
                    <div 
                      className="text-white text-2xl font-light tabular-nums"
                    >
                      {animatedValues.efficiency}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div 
                className="p-4 border-b border-white/10"
                style={{ 
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                  borderColor: "rgba(255, 255, 255, 0.1)" 
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-med text-gray-500 uppercase tracking-widest">Warranty</div>
                  <div 
                    className="text-white text-2xl font-light"
                  >
                    {panel.warranty}
                  </div>
                </div>
                
                </div></span>
            
              
           {!isMobile &&   <div className="flex items-center justify-end absolute bottom-[-3%] right-0">
        <motion.button
          className="relative backdrop-blur-md text-gray-500 rounded-r-md z-9999 flex items-center mr-[-10px] mt-4"
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleClick}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          
        >
          <span className="text-med c uppercase tracking-widest mr-1 z-50 " >Details</span>
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </motion.button>
      </div>}
            </div>
          </div>
         
        </motion.div>
        
        {/* Right column - detailed description */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="border-l border-white/10 h-full overflow-hidden ml-2"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "66.666667%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%' }}
            >
              <AnimatePresence>
                {isContentVisible && (
                  <motion.div 
                    className="pl-6 text-gray-300 space-y-4 text-med text-left pt-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: 0.2 }}
                  >                    
                    <p className="text-white/90 leading-relaxed text-left">
                      High-efficiency, premium modules designed for a sleek, modern look while delivering top-tier performance. 
                      These panels feature all-black cells, a black backsheet, and a black anodized aluminum frame, making them 
                      ideal for homeowners and projects that prioritize aesthetics.
                    </p>
                    
                    <div className="space-y-2 text-left">
                      <ul className="list-disc list-inside space-y-1 pl-2 text-left">
                        <li>High Efficiency (20%-22%) – Delivers maximum power output with advanced monocrystalline cell technology.</li>
                        <li>Sleek All-Black Design – Blends seamlessly with rooftops for a modern, uniform appearance.</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2 text-left">
                      <h3 className="text-white font-light text-md tracking-wide text-left">Recommended For</h3>
                      <ul className="list-disc list-inside space-y-1 pl-2 text-left">
                        <li>Homeowners prioritizing aesthetics without sacrificing performance</li>
                        <li>HOAs or areas with strict design guidelines</li>
                        <li>High-end residential and commercial projects</li>
                      </ul>
                    </div>
                    
                    <div className=" pt-4 text-left">
                      <p className="text-gray-400 text-left">
                        Common Tier 1 manufacturers include REC, Q CELLS, JinkoSolar, LONGi, Trina Solar, and Canadian Solar.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SolarPanelShowcase;
