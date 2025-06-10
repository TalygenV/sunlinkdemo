import React, { useState, useEffect, useRef, forwardRef, lazy, Suspense, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Info, ChevronDown } from 'lucide-react';

import { BatteryCalculator } from '../battery'; // Use barrel import for Calculator
// Import GLB model files for each battery
import teslaModel from '../../products/batteries/model/tesla_battery-opt-opt-opt-compressed.glb?url';
import enphaseModel from '../../products/batteries/model/enphase_battery-opt-opt-opt-compressed.glb?url';
import franklinModel from '../../products/batteries/model/franklin_battery-opt-opt-opt-compressed.glb?url';
import solarEdgeModel from '../../products/batteries/model/solar_edge_battery-opt-opt-opt-compressed.glb?url';

// Lazy load the 3D model component
const BatteryModel = lazy(() => import('./BatteryModel.jsx')); // Correct lazy load path

const BatteryShowcase = ({ updateCurrentBatteryName, selectedBatteryDetails, onContinue }) => {
  // Check if we're on mobile immediately
  const initialIsMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [viewerKey, setViewerKey] = useState(0); // Add a key to force re-render
  const [expandedCardIndex, setExpandedCardIndex] = useState(null); // Track which card is expanded on mobile
  
  // Check if we're on mobile
  useLayoutEffect(() => {
    const checkIfMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        // Force re-render of viewer component when switching modes
        setViewerKey(prevKey => prevKey + 1);
        // Reset expanded card when switching to/from mobile
        setExpandedCardIndex(null);
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

  // Battery data
  const batteryOptions = [
    {
      name: "Tesla Powerwall 3",
      capacity: 13.5,
      warranty: 10,
      warrantyUnit: "years",
      price: 12000,
      shortName: "Tesla",
      modelFile: teslaModel,
      info: "Perfect for homeowners seeking reliability and smart features. Integrates seamlessly with Tesla solar and provides advanced monitoring capabilities."
    },
    {
      name: "Enphase 5P",
      capacity: 10,
      warranty: 15,
      warrantyUnit: "years",
      price: 8000,
      shortName: "Enphase",
      modelFile: enphaseModel,
      info: "Ideal for budget-conscious homeowners looking for excellent reliability and modular design that allows for system expansion"
    },
    {
      name: "Franklin A2",
      capacity: 10,
      warranty: 15,
      warrantyUnit: "years",
      shortName: "Franklin",
      price: 9000,
      modelFile: franklinModel,
      info: "Best for homes with higher energy needs. Features industry-leading warranty and excellent thermal management for longer life."
    },
    {
      name: "SolarEdge BAT-10K1P",
      capacity: 10,
      warranty: 10,
      warrantyUnit: "years",
      shortName: "SolarEdge",
      price: 9000,
      modelFile: solarEdgeModel,
      info: "DC-coupled battery with 94.5% round-trip efficiency. Offers 5kW continuous and 7.5kW peak power with excellent scalability for whole-home backup solutions."
    }
  ];

  // Toggle card expansion on mobile
  const toggleCardExpand = (index) => {
    if (expandedCardIndex === index) {
      setExpandedCardIndex(null);
    } else {
      setExpandedCardIndex(index);
    }
  };

  // Find the index of the selected battery, if any
  const findSelectedBatteryIndex = () => {
    if (selectedBatteryDetails && selectedBatteryDetails.shortName) {
      const index = batteryOptions.findIndex(
        battery => battery.shortName === selectedBatteryDetails.shortName
      );
      return index >= 0 ? index : 0;
    }
    return 0;
  };

  // State initialization - use findSelectedBatteryIndex to set the initial state based on selectedBatteryDetails
  const [currentBatteryIndex, setCurrentBatteryIndex] = useState(findSelectedBatteryIndex());
  const nextIndexRef = useRef(null); // Ref to store the next index during animation
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [batteryPositions, setBatteryPositions] = useState([
    { position: 'front', scale: 1.0, x: 0, y: -60, rotationY: 0 }, 
    { position: 'middle', scale: 0.7, x: -280, y: -40, rotationY: Math.PI * 0.1 }, 
    { position: 'back', scale: 0.5, x: -430, y: -120, rotationY: Math.PI * 0.08 },  
    { position: 'far-back', scale: 0.3, x: -530, y: -180, rotationY: Math.PI * 0.06, opacity: 0.25 } 
  ]);
  
  // Rotation is now managed within batteryPositions

  const [modelsLoaded, setModelsLoaded] = useState([false, false, false, false]);

  // Track when all models are loaded
  const allModelsLoaded = modelsLoaded.every(loaded => loaded);

  // Add this logging effect


  // Fix the handleModelLoad function to use a functional state update
  const handleModelLoad = (index) => {
    
    setModelsLoaded(prevState => {
      const newState = [...prevState];
      newState[index] = true;
    
      return newState;
    });
  };

  // Add this force-load effect as a fallback
  useEffect(() => {
    const forceLoadTimer = setTimeout(() => {
      if (!allModelsLoaded) {
     
        setModelsLoaded([true, true, true, true]);
      }
    }, 15000); // 15 seconds timeout
    
    return () => clearTimeout(forceLoadTimer);
  }, [allModelsLoaded]);

  // Also add WebGL context recovery
  useEffect(() => {
    function handleContextLost() {
      
      // Force models to load to recover from WebGL context loss
      setTimeout(() => {
        if (!allModelsLoaded) {
     
          setModelsLoaded([true, true, true, true]);
        }
      }, 3000);
    }
    
    window.addEventListener('webglcontextlost', handleContextLost);
    return () => window.removeEventListener('webglcontextlost', handleContextLost);
  }, [allModelsLoaded]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate estimated monthly financing payment using PMT factor and dealer fee (matches LoanOptionCard logic)
  const DEFAULT_DEALER_FEE = 0.35; // 35% dealer fee (typical for 25-year solar loans)
  const DEFAULT_PMT_FACTOR = 0.0038216; // PMT factor for 25-year term at 3.99% APR

  const calculateLoanPayment = (cashPrice, dealerFee = DEFAULT_DEALER_FEE, pmtFactor = DEFAULT_PMT_FACTOR) => {
    const numericCashPrice = Number(cashPrice);
    if (isNaN(numericCashPrice) || numericCashPrice <= 0 || dealerFee >= 1 || pmtFactor <= 0) {
      return 0;
    }
    const financedAmount = numericCashPrice / (1 - dealerFee);
    return financedAmount * pmtFactor;
  };

  // Get the current battery based on index
  const getCurrentBattery = () => {
    return batteryOptions[currentBatteryIndex];
  };
  
  // Initialize with the selected battery or default battery on component mount
  useEffect(() => {
    // Notify parent of the current battery
    if (updateCurrentBatteryName) {
      updateCurrentBatteryName(getCurrentBattery());
    }
  }, [currentBatteryIndex]);
  
  // Initialize positions based on selected battery on mount only
  useEffect(() => {
    // This runs only once on component mount
    // No animation is needed here since we're just setting up initial state
    const selectedIndex = findSelectedBatteryIndex();
    if (selectedIndex !== 0) {
      // If we have a non-default selection, we don't need to update any visual states
      // as the rendering logic in the JSX already handles positioning based on currentBatteryIndex
      console.log("Initial battery set to:", batteryOptions[selectedIndex].name);
    }
  }, []); // Empty dependency array means this only runs once on mount
  
  // We've removed the problematic useEffect that watches for selectedBatteryDetails changes
  // as it was causing glitches with animation. We now rely on the initial state setup only.

  // The handleRotate function is no longer needed as rotation is managed via handleRotateRequest and batteryPositions state.

  // Create refs to access the battery models
  const batteryRefs = useRef([]);

  // Define circle parameters
  const circleRadius = 300; // Radius of the circle
  const circleCenter = { x: 0, y: 0 }; // Center point at right edge
  // Add this for card positions, similar to batteryPositions
  const [cardPositions, setCardPositions] = useState([
    { position: 'front', zIndex: 30, x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 },
    { position: 'middle', zIndex: 20, x: 10, y: -20, scale: 0.97, opacity: 0.9, rotate: 2 },
    { position: 'back', zIndex: 10, x: 20, y: -50, scale: 0.94, opacity: 0.3, rotate: 4 },
    { position: 'far-back', zIndex: 5, x: 30, y: -70, scale: 0.91, opacity: 0.1, rotate: 4 }
  ]);

  // Handle cycling through batteries
  const handleCycleBatteries = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Reset expanded card when cycling batteries
    setExpandedCardIndex(null);
    
    // Calculate new index and store it in the ref
    const newIndex = (currentBatteryIndex + 1) % batteryOptions.length;
    nextIndexRef.current = newIndex; // Store the target index
    
    // Update the battery name in the parent component
    if (updateCurrentBatteryName) {
      updateCurrentBatteryName(batteryOptions[newIndex]);
    }
    
    // Animate battery positions
    const animatedPositions = [...batteryPositions];
    
    // Find current front rotation before modifying
    const currentFrontRotation = batteryPositions.find(p => p.position === 'front')?.rotationY || 0;

    // Move front battery to the LEFT instead of right, creating a natural circular motion
    animatedPositions[0] = {
      ...animatedPositions[0], // Spread existing properties first
      position: 'far-back',
      x: -530, 
      y: -180,  
      rotationY: Math.PI * 0.08,
      opacity: 0.25, // Explicit target opacity for far-back
      scale: 0.3 // Ensure scale is also part of the animation target
    };
    
    // Move middle battery to front (with updated rotation value)
    animatedPositions[1] = { ...animatedPositions[1], position: 'front', scale: 1.0, x: 0, y: -60, rotationY: Math.PI * 0.1, opacity: 1 }; // Explicit target opacity for front
    
    // Move back battery to middle (with updated rotation value)
    animatedPositions[2] = { ...animatedPositions[2], position: 'middle', scale: 0.7, x: -280, y: -40, rotationY: Math.PI * 0.1, opacity: 0.6 }; // Explicit target opacity for middle
    
    // Move far-back battery to back (with updated rotation value)
    if (animatedPositions[3]) {
      animatedPositions[3] = { 
        ...animatedPositions[3], 
        position: 'back', 
        scale: 0.5, 
        x: -430, 
        y: -120, 
        rotationY: Math.PI * 0.08,
        opacity: 0.2  // Explicit target opacity for back
      };
    }
    
    // Set the animated positions
    setBatteryPositions(animatedPositions);
    
    // Store original card positions to avoid circular references
    const frontCard = { ...cardPositions[0] };
    const middleCard = { ...cardPositions[1] };
    const backCard = { ...cardPositions[2] };
    const farBackCard = { ...cardPositions[3] };
    
    // Create new positions array with proper transitions
    const animatedCardPositions = [
      // Front card exits to far-back
      {
        position: 'far-back',
        zIndex: 5,
        x: 50,
        y: -60,
        scale: 0.85,
        opacity: 0.1,
        rotate: 10
      },
      
      // Middle card comes to front - keep this the same
      {
        position: 'front',
        zIndex: 30,
        x: frontCard.x,
        y: frontCard.y,
        scale: frontCard.scale,
        opacity: frontCard.opacity,
        rotate: frontCard.rotate
      },
      
      // Back card moves to middle - keep this the same
      {
        position: 'middle',
        zIndex: 20,
        x: middleCard.x,
        y: middleCard.y,
        scale: middleCard.scale,
        opacity: middleCard.opacity,
        rotate: middleCard.rotate
      },
      // Far-back card moves to back
      {
        position: 'back',
        zIndex: 10,
        x: farBackCard.x,
        y: farBackCard.y,
        scale: farBackCard.scale,
        opacity: farBackCard.opacity,
        rotate: farBackCard.rotate
      }
    ];
    
    setCardPositions(animatedCardPositions);
  
    
    // State updates will now happen in handleAnimationComplete triggered by onAnimationComplete
  };

  // Function to handle state updates after animation completes
  const handleAnimationComplete = () => {
    // Check if animation is still considered active and we have a target index
    if (isAnimating && nextIndexRef.current !== null) {
      const newIndex = nextIndexRef.current;
      setCurrentBatteryIndex(newIndex);
      
      // Make sure the battery name is updated in the parent component
      if (updateCurrentBatteryName) {
        updateCurrentBatteryName(batteryOptions[newIndex]);
      }
      
      // Reset positions immediately for the new state, including updated rotation
      setBatteryPositions([
        { position: 'front',    scale: 1.0, x: 0,    y: -60,  rotationY: 0               },
        { position: 'middle',   scale: 0.7, x: -280, y: -40,  rotationY: Math.PI * 0.1    },
        { position: 'back',     scale: 0.5, x: -430, y: -120, rotationY: Math.PI * 0.08   },
        { position: 'far-back', scale: 0.3, x: -530, y: -180, rotationY: Math.PI * 0.08, opacity: 0.25 }
      ]);

      // Reset card positions
      setCardPositions([
        { position: 'front',    zIndex:30, x:0,  y:0,   scale:1.00, opacity:1.0, rotate:0 },
        { position: 'middle',   zIndex:20, x:10, y:-20, scale:0.97, opacity:0.9, rotate:2 },
        { position: 'back',     zIndex:10, x:20, y:-50, scale:0.94, opacity:0.3, rotate:4 },
        { position: 'far-back', zIndex:5,  x:30, y:-70, scale:0.91, opacity:0.1, rotate:8 }
      ]);
      
      // Clear the target index ref
      nextIndexRef.current = null;
      
      // Allow new animations now that state is stable
      setIsAnimating(false);
    }
  };

  // Toggle calculator modal
  const toggleCalculator = () => {
    setIsCalculatorOpen(!isCalculatorOpen);
  };

  // Animation variants
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
    }
  };

  // Battery model entry animation variants
  const batteryModelVariants = {
    hidden: (i) => ({
      opacity: 0,
      x: 100, // Start from right
      y: 100, // Start from bottom
      scale: 0.8,
      transition: {
        duration: 0
      }
    }),
    visible: (i) => ({
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.15, // Stagger based on position index
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    })
  };

  // Next battery button animation variants
  const nextButtonVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.3, // Delay after batteries are loaded
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Function to handle battery rotation request (updates state directly)
  const handleRotateRequest = (direction) => {
    const rotationAmount = direction === 'left' ? -Math.PI / 2 : Math.PI / 2;
    setBatteryPositions(currentPositions => {
      const newPositions = [...currentPositions];
      // Find the index of the current front battery
      const frontIndex = newPositions.findIndex(p => p.position === 'front');
      if (frontIndex !== -1) {
        // Update its rotationY property
        newPositions[frontIndex] = {
          ...newPositions[frontIndex],
          rotationY: newPositions[frontIndex].rotationY + rotationAmount
        };
      }
      return newPositions; // Return the updated array
    });
  };

  // Add this state near the top of your component with other state declarations
  const [isContentVisible, setIsContentVisible] = useState(true);

  // Add this effect to manage the content animations during battery transitions
  useEffect(() => {
    if (isAnimating) {
      // When animating to a new battery, first hide content
      setIsContentVisible(false);
    } else {
      // When animation is complete, show the new content
      const timer = setTimeout(() => {
        setIsContentVisible(true);
      }, 150); // Delay showing content until container has finished resizing
      return () => clearTimeout(timer);
    }
  }, [isAnimating, currentBatteryIndex]);

  return (
    <div className="relative">
      {/* Global overlay to block interactions while battery models are loading */}
      {!allModelsLoaded && (
        <div
          className="fixed inset-0 z-[2000] bg-transparent pointer-events-auto"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        />
      )}
      {/* Background glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-3xl z-0 rounded-xl"
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
      
      {/* Main content container with backdrop blur */}
      <motion.div 
        className={`relative z-10 overflow-visible `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className={`battery-showcase ${isMobile ? 'mt-[-10dvh]' : null}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
      
            {/* Header */}
            <motion.div variants={itemVariants} className="flex justify-between items-center relative">
              <motion.div 
                className="relative"
                layout
                layoutId="battery-header-container"
                transition={{ 
                  layout: { duration: 0.3, ease: "easeOut" }
                }}
              >
                {/* Top left corner border */}
                {/* <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white/30 font-light"></div>
                <div className="absolute -bottom-1 -right-8 w-6 h-6 border-b-2 border-r-2 border-white/30"></div> */}
                
                {/* <motion.h2 
                  className="text-4xl text-white px-4 pt-2 font-light tracking-wide text-left" 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Home Battery Storage
                </motion.h2> */}
                
               
              </motion.div>
            </motion.div>
            
            {/* Main content area */}
            
              {/* 3D Battery Stack - Left side */}
              <motion.div 
                variants={itemVariants}
                className={`col-span-1 relative h-[700px] overflow-visible `}
              >
                {/* Loading overlay */}
                {!allModelsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center z-40">
                    <div className="flex flex-col items-center">
                      <div className="text-white text-sm">Loading battery models...</div>
                    </div>
                  </div>
                )}
                
                {/* Battery models */}
                <div className={`relative h-full mt-[-${isMobile ? '-10dvh' : '23dvh'}] ml-[-${isMobile ? '90%' : '0px'}] overflow-visible`}>
                  {batteryOptions.map((battery, index) => {
                    // Calculate the actual index in the current stack
                    const positionIndex = (index - currentBatteryIndex + batteryOptions.length) % batteryOptions.length;
                    const position = batteryPositions[positionIndex];
                    
                    // Determine if this specific model instance is the one finishing its move to the front
                    const isMovingToFront = positionIndex === 1;
                    
                    // Only the front battery should be interactive and rotatable
                    const isFront = position.position === 'front';

                    return (
                      <motion.div
                        key={battery.name}
                        className="absolute inset-0"
                        custom={positionIndex}
                        initial="hidden"
                        animate={allModelsLoaded ? {
                          x: position.x,
                          y: position.y || 0,
                          opacity: position.opacity !== undefined ? position.opacity : // If explicit opacity is provided, use it
                                  position.position === 'far-back' ? 0.1 :          // Fallback for 'far-back'
                                  position.position === 'back' ? 0.2 :             // Fallback for 'back'
                                  position.position === 'middle' ? 0.6 :           // Fallback for 'middle'
                                  1,                                               // Fallback for 'front' (or any other case)
                          zIndex: position.position === 'front' ? 30 : position.position === 'middle' ? 20 : 10
                        } : "hidden"}
                        variants={batteryModelVariants}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        onAnimationComplete={() => {
                          if (isMovingToFront && isAnimating) {
                            handleAnimationComplete();
                          }
                        }}
                      >
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center">
                          <div className="text-white">Loading model...</div>
                        </div>}>
                         { <BatteryModel
                            key={viewerKey}
                            ref={el => {
                              // Store refs to access the battery models directly
                              if (batteryRefs.current.length <= index) {
                                batteryRefs.current[index] = null;
                              }
                              if (isFront) {
                                batteryRefs.current[0] = el; // Always store front battery at index 0
                              }
                            }}
                            containerHeight={isMobile ? 300 : 500}
                            position={position.position}
                            isInteractive={isFront}
                            scale={position.scale * (battery.shortName === 'Enphase' ? 1.15 : battery.shortName === 'Tesla' ? 1.1 : battery.shortName === 'SolarEdge' ? 100 : 1)}
                            onLoadComplete={() => handleModelLoad(index)}
                            rotationY={position.rotationY}
                            onRotateRequest={isFront ? handleRotateRequest : null}
                            isMobile={isMobile}
                            modelFile={battery.modelFile}
                          />}
                        </Suspense>
                      </motion.div>
                    );
                  })}
                  
                  {/* Navigation arrow - only show when not animating */}
                  {
                    <div className={`animate-pulse-scale fixed ${isMobile ? 'left-[4dvw] bottom-[4dvh]' : 'left-[6dvw] bottom-[38dvh]'} transform -translate-y-1/2 z-40`}>
                      {allModelsLoaded && (
                        <>
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
                            <div className={`absolute btn-sheen inset-0 bg-gradient-to-r z-60 from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[20px] border  ${isMobile ? 'w-[100%] h-[100px]' : 'w-[150px] h-[150px] pt-[20%]'}`} />
                          </motion.div>
                          <motion.button
                            className={`border bg-transparent border-white/10 relative button-sheen z-10 ${isMobile ? 'pl-8 pr-6 text-xl py-4' : 'pl-12 pr-10 text-2xl py-6'} rounded-full text-white hover:text-glow-white transition-colors flex items-center gap-1`}
                            onClick={handleCycleBatteries}
                            whileTap={{ scale: 0.95 }}
                            variants={nextButtonVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            Next Battery <ChevronRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} transition-transform duration-300 icon-glow-white`} />
                          </motion.button>
                        </>
                      )}
                    </div>
                  }
                </div>
              </motion.div>
              
              {/* Battery Specs - Right side with stacked cards */}
              <AnimatePresence mode="wait">
                {allModelsLoaded && (
                  <motion.div 
                    className={`fixed ${isMobile ? 'lg:right-[1dvw] md:right-[2%] right-[1%] lg:bottom-[5%] md:bottom-[4%] bottom-[2%]' : 'lg:right-[1dvw] md:right-[2%] right-[1%] lg:bottom-[10%] md:bottom-[8%] bottom-[5%]'} z-30 ${isMobile ? 'w-[75vw] md:w-[55vw] lg:w-[28vw] max-w-[350px]' : 'w-[90vw] md:w-[70vw] lg:w-[40vw] max-w-[550px]'}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ 
                      duration: 0.5,
                      ease: "easeOut"
                    }}
                  >
                    <div className={`relative h-auto ${isMobile ? 'min-h-[300px] md:min-h-[320px] lg:min-h-[350px] ' : 'min-h-[400px] md:min-h-[460px] lg:min-h-[520px]'}`}>
                      {batteryOptions.map((battery, index) => {
                        // Calculate the actual index in the current stack
                        const positionIndex = (index - currentBatteryIndex + batteryOptions.length) % batteryOptions.length;
                        const position = cardPositions[positionIndex];
                        
                        // Determine if this specific card is finishing its move to the front
                        const isMovingToFront = positionIndex === 1 && isAnimating;
                        
                        // Determine if this is the currently expanded card on mobile
                        const isExpanded = isMobile && expandedCardIndex === positionIndex;
                        const isFront = position.position === 'front';
                        
                        return (
                          <motion.div
                            key={battery.name}
                            className="absolute top-0 left-0 w-full"
                            initial={false}
                            animate={{
                              x: position.x,
                              y: position.y,
                              scale: position.scale,
                              opacity: position.opacity,
                              zIndex: position.zIndex,
                              rotate: position.rotate,
                              height: isMobile && isFront ? (isExpanded ? 'auto' : 'auto') : 'auto'
                            }}
                            transition={{
                              duration: 0.6,
                              ease: "easeInOut",
                              // Add different transition properties for different animation aspects
                              rotate: {
                                duration: 0.7,
                                ease: [0.16, 1, 0.3, 1] // Custom bezier curve for a more natural flip
                              },
                              scale: {
                                duration: 0.6,
                                ease: "easeOut"
                              },
                              opacity: {
                                duration: 0.4,
                                ease: "linear"
                              },
                              height: {
                                duration: 0.4,
                                ease: [0.16, 1, 0.3, 1] // Custom spring-like ease for more natural expansion
                              }
                            }}
                            onAnimationComplete={() => {
                              if (isMovingToFront) {
                                handleAnimationComplete();
                              }
                            }}
                          >
                            <motion.div 
                              className="p-3 md:p-4 lg:p-5 rounded-xl bg-gradient-to-b from-black to-zinc-900 border border-white/15 w-[90%] mx-auto shadow-lg shadow-black/50"
                              animate={{ 
                                height: isMobile && isFront ? (isExpanded ? 'auto' : 'auto') : 'auto'
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              {/* For mobile, we need to position the expanded content above the card */}
                              {isMobile && isFront && isExpanded && (
                                <motion.div 
                                  className="absolute bottom-full w-full left-0 right-0 mb-2 px-3 md:px-4 lg:px-5"
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                >
                                  <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/15 rounded-xl p-3 md:p-4 shadow-lg shadow-black/50 space-y-2 md:space-y-3 lg:space-y-4">
                                    <div className="flex justify-between items-center pb-2">
                                      <span className="text-white/80 text-sm md:text-base font-light">
                                        {battery.info}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                      <span className="text-sm md:text-base text-gray-500 uppercase tracking-widest">Capacity</span>
                                      <span className="text-white text-lg md:text-xl font-light">{battery.capacity} kWh</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pb-2 border-b border-white/10 pb-4">
                                      <span className="text-sm md:text-base text-gray-500 uppercase tracking-widest">Warranty</span>
                                      <span className="text-white text-lg md:text-xl font-light">
                                        {battery.warranty} {battery.warrantyUnit}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pb-2">
                                      <span className="text-sm md:text-base text-gray-500 uppercase tracking-widest">Payment</span>
                                      <span className="text-white text-lg md:text-xl font-light">
                                        {formatCurrency(calculateLoanPayment(battery.price))}
                                        <span className="text-sm md:text-base font-normal text-gray-400 ml-1">/ mo</span>
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                              
                              {/* Non-Mobile Content */}
                              {!isMobile && (
                                <div className="flex flex-col">
                                       <div className="flex items-center justify-between">
                                    
                                      <h3 className="text-3xl md:text-4xl text-white font-light mb-0 md:mb-1 lg:mb-2 pb-0 md:pb-0 text-glow-white">
                                        {battery.shortName}
                                      </h3>
                                      <p className="text-sm md:text-base text-gray-400 font-light mb-2 md:mb-3 lg:mb-4 pb-1 md:pb-2"> 
                                        {battery.name}
                                      </p>
                                   
                                  </div>
                                  <AnimatePresence>
                                    {(!isMobile || (isMobile && isFront && isExpanded)) && !isMobile && (
                                      <motion.div 
                                        className="space-y-2 md:space-y-3 lg:space-y-4"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                      >
                                        <div className="flex justify-between items-center pb-2">
                                          <span className="text-white/80 text-lg md:text-xl font-light">
                                            {battery.info}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                          <span className="text-base md:text-lg text-gray-500 uppercase tracking-widest">Capacity</span>
                                          <span className="text-white text-2xl md:text-3xl font-light">{battery.capacity} kWh</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pb-2 border-b border-white/10 pb-4">
                                          <span className="text-base md:text-lg text-gray-500 uppercase tracking-widest">Warranty</span>
                                          <span className="text-white text-2xl md:text-3xl font-light">
                                            {battery.warranty} {battery.warrantyUnit}
                                          </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pb-2">
                                          <span className="text-base md:text-lg text-gray-500 uppercase tracking-widest">Payment</span>
                                          <span className="text-white text-2xl md:text-3xl font-light">
                                            {formatCurrency(calculateLoanPayment(battery.price))}
                                            <span className="text-sm md:text-base font-normal text-gray-400 ml-1">/ mo</span>
                                          </span>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                  
                             
                                </div>
                              )}
                              
                              {/* Mobile Header Only */}
                              {isMobile && (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-xl md:text-2xl text-white font-light mb-0 md:mb-1 lg:mb-2 pb-0 md:pb-0 text-glow-white">
                                      {battery.shortName}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-400 font-light mb-2 md:mb-3 lg:mb-4 pb-1 md:pb-2"> 
                                      {battery.name}
                                    </p>
                                  </div>
                                  
                                  {isMobile && isFront && (
                                    <motion.button
                                      onClick={() => toggleCardExpand(positionIndex)}
                                      className="p-1 bg-white/10 rounded-full"
                                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                                      whileTap={{ scale: 0.95 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <Info size={20} className="text-white" />
                                    </motion.button>
                                  )}
                                </div>
                              )}
                              
                              {/* Select Battery button - only show for the front card */}
                              {isFront && (
                                <motion.button
                                  className={`uppercase tracking-widest mt-4 w-full flex justify-center items-center gap-2 px-4 py-5 bg-black/60 hover:bg-black/50 text-white rounded-lg text-base md:text-lg shadow-md shadow-black/40 border border-white/10 rounded-full`}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => {
                                    // Ensure parent state is updated with this battery
                                    if (updateCurrentBatteryName) {
                                      updateCurrentBatteryName(battery);
                                    }

                                    // Advance to next stage if handler provided
                                    if (onContinue) {
                                      onContinue();
                                    }
                                  }}
                                >
                                  Select This Battery
                                </motion.button>
                              )}
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            
          </motion.div>
        </motion.div>
  
      
      {/* Battery Calculator Modal */}
      <AnimatePresence>
        {isCalculatorOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-orange-900/90 backdrop-blur-xl rounded-xl border border-white/10 p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl text-white font-medium">Battery Calculator</h2>
                <button
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={toggleCalculator}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <BatteryCalculator isModal={true} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BatteryShowcase;