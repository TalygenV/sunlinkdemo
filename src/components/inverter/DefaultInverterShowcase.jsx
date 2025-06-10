import React, { useState, useEffect, lazy, Suspense, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronRight, ChevronLeft } from 'lucide-react';

// Lazy load the 3D viewer component
const InverterViewer = lazy(() => import('./InverterViewer'));

const DefaultInverterShowcase = () => {
  // Check if we're on mobile immediately
  const initialIsMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // State initialization
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
  
  // Inverter data
  const inverterData = {
    type: "Microinverter",
    inputVoltage: "16-60V DC",
    outputVoltage: "240V AC",
    efficiency: 97.5,
    monitoringLevel: "Per Panel",
    installLocation: "Under Each Panel",
    warranty: "25 years",
    specs: {
      description: "Advanced microinverter technology for optimal energy conversion",
      features: [
        "Individual panel optimization for maximum energy harvest",
        "No single point of failure - one microinverter fails, others keep working",
        "Better performance in partial shade conditions",
        "Panel-level monitoring for detailed performance tracking"
      ],
      recommendedFor: [
        "Roofs with partial shading",
        "Systems requiring panel-level monitoring",
        "Installations valuing longer warranty coverage",
        "Systems planned for future expansion"
      ]
    }
  };
  
  // Toggle specs expanded state
  const toggleSpecsExpanded = () => {
    setIsSpecsExpanded(!isSpecsExpanded);
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
  
  // Value change animation variants
  const valueChangeVariants = {
    initial: { opacity: 0, y: 0 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -0 }
  };
  
  // Handle toggle expand click
  const handleToggleClick = () => {
    toggleSpecsExpanded();
  };
  
  return (
    <div className="relative">
      <motion.div
        className={`absolute -inset-1 rounded-2xl z-0 ${isSpecsExpanded ? 'w-full' : isMobile ? 'w-full' : 'w-1/2'} rounded-xl`}
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
        <div />
      </motion.div>
      
      {/* 3D Viewer */}
      <motion.div 
        variants={itemVariants}
        className="rounded-xl"
        layoutId="inverterViewer"
        style={{
          overflowY: "visible",
          position: isMobile ? "absolute" : "absolute",
          top: isMobile ? "24%" : 0,
          right: isMobile ? "8%" : 0,
          width: isSpecsExpanded ? "0%" : isMobile ? "100%" : "40%",
          height: isMobile ? "300px" : "100%",
          zIndex: 40,
          opacity: isSpecsExpanded ? 0 : 1,
          marginTop: isMobile ? "16px" : 0,
          transition: "width 0.5s ease-out, opacity 0.3s ease-out, height 0.5s ease-out"
        }}
      >
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-white">Loading 3D Viewer...</div>}>
          <InverterViewer
            key={viewerKey}
            containerHeight={isMobile ? 300 : 450}
            isMobile={isMobile}
          />
        </Suspense>
      </motion.div>
      
      {/* Main content container with backdrop blur */}
      <motion.div 
        className={`relative z-10 ${!isMobile ? 'border border-white/10' : ''} rounded-3xl overflow-visible`}
        animate={{ 
          width: isSpecsExpanded ? "100%" : isMobile ? "100%" : "60%"
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="p-8 inverter-showcase"
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
                layoutId="inverter-header-container"
                transition={{ 
                  layout: { duration: 0.3, ease: "easeOut" }
                }}
              >
                {/* Top left corner border */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white/30 font-light"></div>
                <div className={`absolute -bottom-1 ${isMobile ? '-right-0' : '-right-8'}  w-6 h-6 border-b-2 border-r-2 border-white/30 `}></div>
                
                <motion.h2 
                  className="text-4xl text-white px-4 pt-2 font-light tracking-wide text-left" 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Intelligent Power Conversion
                </motion.h2>
                
                <motion.div 
                  className="text-gray-400 text-lg px-4 py-2 pb-2 min-h-[24px] w-[full]"
                  layout
                >
                  <AnimatePresence mode="wait">
                    <motion.div 
                      className="flex items-center"
                      key="inverter-spec"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="tabular-nums">
                        Advanced microinverter technology with panel-level optimization
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Main content - modified to single column */}
            <div className="grid grid-cols-1 gap-6">
              {/* Inverter Specs - taking full container on mobile when expanded */}
              <motion.div 
                variants={itemVariants}
                className="col-span-1"
                layoutId="inverterSpecsContainer"
                animate={{
                  marginTop: isMobile && isSpecsExpanded ? -60 : 0, // Move up to replace header on mobile
                  height: isMobile && isSpecsExpanded ? 'calc(100% + 60px)' : 'auto' // Fill the space of the header too
                }}
                style={isMobile && {opacity: 0}}
                transition={{ duration: 0.4 }}
              >
                <InverterSpecsView
                  inverter={inverterData}
                  valueChangeVariants={valueChangeVariants}
                  isExpanded={isSpecsExpanded}
                  onToggleExpand={handleToggleClick}
                  isMobile={isMobile}
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Inverter specs view for individual inverter details
const InverterSpecsView = ({ 
  inverter, 
  valueChangeVariants,
  isExpanded,
  onToggleExpand,
  isMobile
}) => {
  const [animatedValues, setAnimatedValues] = useState({
    efficiency: 0
  });
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  
  // Set up animation when inverter changes
  useEffect(() => {
    if (!inverter) return;
    
    // Reset animation state
    setAnimationComplete(false);
    
    // Animation setup
    const duration = 1000; // 1 second animation
    const startTime = Date.now();
    const startValues = {
      efficiency: animatedValues.efficiency
    };
    const targetValues = {
      efficiency: inverter.efficiency
    };
    const diffs = {
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
  }, [inverter?.efficiency]);
  
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
  
  if (!inverter) return (
    <motion.div 
      className="h-full flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl border border-white/10"
      animate={{ opacity: [0.5, 1], y: [10, 0] }}
      transition={{ duration: 0.5 }}
      layoutId="emptyInverterState"
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
        Loading inverter details...
      </motion.p>
    </motion.div>
  );
  
  // Calculate efficiency class
  const getEfficiencyClass = (efficiency) => {
    if (efficiency >= 97.5) return {
      label: "Excellent",
      color: "text-green-500",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
      glowClass: "text-glow-green"
    };
    if (efficiency >= 96) return {
      label: "Very Good",
      color: "text-green-500",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
      glowClass: "text-glow-green"
    };
    if (efficiency >= 94) return {
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
  
  const efficiencyClass = getEfficiencyClass(inverter.efficiency);

  // Special case for mobile expanded view - render a completely different layout
  if (isMobile && isExpanded) {
    return (
      <motion.div 
        className="h-full overflow-visible p-2 pt-0 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ height: '100%', paddingBottom: '100px' }}
      >
        <div className="h-full flex flex-col">
          {/* Full-width header with back button for mobile expanded view */}
          <motion.div 
            className="flex justify-between items-center pt-[50px] mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <h2 className="text-3xl text-white font-light">Inverter Details</h2>
            <motion.button
              className="p-2 text-gray-300 hover:text-white rounded-full bg-white/5 backdrop-blur-sm"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleClick}
            >
              <ChevronLeft size={24} />
            </motion.button>
          </motion.div>
          
          {/* Inverter stats in horizontal layout */}
          <motion.div 
            className="grid grid-cols-3 gap-3 mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg flex flex-col justify-center items-center">
              <div className="text-gray-500 uppercase tracking-widest text-xs text-center">Type</div>
              <div className="text-white text-xl font-light tabular-nums text-center">Micro</div>
            </div>
            
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg flex flex-col justify-center items-center">
              <div className="text-gray-500 uppercase tracking-widest text-xs text-center">Efficiency</div>
              <div className="text-white text-xl font-light tabular-nums text-center">{inverter.efficiency}%</div>
            </div>
            
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg flex flex-col justify-center items-center">
              <div className="text-gray-500 uppercase tracking-widest text-xs text-center">Warranty</div>
              <div className="text-white text-xl font-light text-center">25y</div>
            </div>
          </motion.div>
          
          {/* Detailed content */}
          <motion.div 
            className="flex-1 overflow-auto text-gray-300 space-y-4 text-med pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <p className="text-white/90 leading-relaxed">
              {inverter.specs.description}. Microinverters convert DC electricity from solar panels to AC electricity at the panel level, 
              maximizing energy production and providing greater system reliability.
            </p>
            
            <div className="space-y-2">
              <ul className="list-disc list-inside space-y-1 pl-2">
                {inverter.specs.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
                <li>Input Voltage Range: {inverter.inputVoltage}</li>
                <li>Output Voltage: {inverter.outputVoltage}</li>
                <li>Monitoring Level: {inverter.monitoringLevel}</li>
                <li>Installation Location: {inverter.installLocation}</li>
              </ul>
            </div>
            
            <div className="pt-4">
              <p className="text-gray-400">
                Microinverters offer better long-term performance
                especially in challenging installation conditions.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

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
        {/* Left column - inverter specs cards - no layoutId to prevent animation */}
        <motion.div 
          className={`transition-all duration-300 ease-out ${isExpanded ? 'w-1/3' : 'w-full'}`}
          animate={{ 
            width: isExpanded ? '33.333%' : '100%',
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3 h-full mt-1 flex items-center justify-center">
            {isMobile && <div className="flex items-center justify-end absolute top-[-100%] right-0">
              <motion.button
                className="relative  text-gray-500 rounded-r-md z-9999 flex items-center mr-[-10px] mt-4"
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleClick}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-med uppercase tracking-widest mr-1 z-50">Details</span>
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
                    <div className="text-med text-gray-500 uppercase tracking-widest">Type</div>
                    <div 
                      className="text-white text-2xl font-light tabular-nums"
                    >
                      {inverter.type}
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
                      {inverter.warranty}
                    </div>
                  </div>
                </div>
              </span>
              
              {!isMobile && <div className="flex items-center justify-end absolute bottom-[-3%] right-0">
                <motion.button
                  className="relative backdrop-blur-md text-gray-500 rounded-r-md z-9999 flex items-center mr-[-10px] mt-4"
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleClick}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-med uppercase tracking-widest mr-1 z-50">Details</span>
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
                      {inverter.specs.description}. Microinverters convert DC electricity from solar panels to AC electricity at the panel level, 
                      maximizing energy production and providing greater system reliability.
                    </p>
                    
                    <div className="space-y-2 text-left">
                      <ul className="list-disc list-inside space-y-1 pl-2 text-left">
                        {inverter.specs.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                        <li>Input Voltage Range: {inverter.inputVoltage}</li>
                        <li>Output Voltage: {inverter.outputVoltage}</li>
                        <li>Monitoring Level: {inverter.monitoringLevel}</li>
                        <li>Installation Location: {inverter.installLocation}</li>
                      </ul>
                    </div>
                    
                    <div className="pt-4 text-left">
                      <p className="text-gray-400 text-left">
                        Microinverters offer better long-term performance
                        especially in challenging installation conditions.
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

export default DefaultInverterShowcase;