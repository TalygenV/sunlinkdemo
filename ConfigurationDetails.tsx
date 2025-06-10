import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Zap, BarChart3, ChevronRight, TrendingUp, Battery, CalendarClock, CheckCircle, ArrowRight, Plus, Minus } from 'lucide-react';
import { itemVariants, cardVariants, segmentCardVariants, controlButtonVariants } from '../utils/animations';
import { PanelControls, OffsetSelection, ManualPanelControls } from '../manual';
import { BatterySelectionButtons } from '../ui/buttons';

interface ConfigurationDetailsProps {
  stats: {
    totalPanels: number;
    totalEnergyDcKwh: number;
    roofSegmentSummaries: Array<{
      segmentIndex: number;
      panelsCount: number;
      yearlyEnergyDcKwh: number;
    }>;
  };
  obstructedPanels: Set<string>;
  onDecreasePanels: () => void;
  onIncreasePanels: () => void;
  onSetPanels?: (count: number) => void;
  totalPanels: number;
  panelOptions?: Array<{
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
  selectedPanel?: any;
  onSelectPanel?: (panel: any) => void;
  batteryOptions?: Array<{
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
  selectedBattery?: any;
  onSelectBattery?: (battery: any) => void;
  obstructionMode?: boolean; // Still need this prop to know the current state
  onFinalizeDesign?: () => void;
  annualUsage?: number; // Add annualUsage prop
  sortedPanelEfficiencies?: number[]; // Add sorted panel efficiencies prop
  isAutoPanelsSupported?: boolean; // Flag indicating if auto panels are supported
  
  // Battery-related props
  batteryCount?: number;
  setBatteryCount?: (count: number) => void;
  isBatterySkipped?: boolean;
  navigateToBatteriesTab?: () => void;
  
  // Manual panel props
  manualPanelsOn?: boolean;
  setManualPanelsOn?: (on: boolean) => void;
  totalManualPanels?: number;
  manualPanelEnergy?: number;
  onResetManualPanels?: () => void;
  onDeleteRegion?: () => void;
  onEnableDrawMode?: () => void;
  onRotationChange?: (rotation: number) => void;
  currentRotation?: number;
  
  // Add the ref prop
  manualPanelWrapperRef?: React.RefObject<any>;
  
  // Add these props:
  regions?: { id: number; panelCount: number }[];
  selectedRegionId?: number | null;
  onRegionSelect?: (regionId: number) => void;
  
  // Flag indicating whether we are in mobile layout
  isMobile?: boolean;
}

export const ConfigurationDetails = ({
  stats,
  obstructedPanels,
  onDecreasePanels,
  onIncreasePanels,
  onSetPanels,
  totalPanels,
  panelOptions = [],
  selectedPanel,
  onSelectPanel,
  batteryOptions = [],
  selectedBattery,
  onSelectBattery,
  obstructionMode = false,
  onFinalizeDesign = () => {},
  annualUsage: propAnnualUsage,
  sortedPanelEfficiencies = [], // Add sortedPanelEfficiencies prop with default empty array
  isAutoPanelsSupported = true, // Default to true for backward compatibility
  // Battery-related props
  batteryCount = 0,
  setBatteryCount = () => {},
  isBatterySkipped = false,
  navigateToBatteriesTab = () => {},
  // Manual panel props
  manualPanelsOn = false,
  setManualPanelsOn = () => {},
  totalManualPanels = 0,
  manualPanelEnergy = 0,
  onResetManualPanels = () => {},
  onDeleteRegion = () => {},
  onEnableDrawMode = () => {},
  onRotationChange = () => {},
  currentRotation = 0,
  // Add the ref prop
  manualPanelWrapperRef,
  regions,
  selectedRegionId,
  onRegionSelect,
  isMobile = false
}: ConfigurationDetailsProps) => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [isPanelSectionExpanded, setIsPanelSectionExpanded] = useState(false);
  const [isBatterySectionExpanded, setIsBatterySectionExpanded] = useState(true); // Start expanded
  const [isManualPanelSectionExpanded, setIsManualPanelSectionExpanded] = useState(isAutoPanelsSupported ? false : true); // Start expanded
  const [isOffsetSectionExpanded, setIsOffsetSectionExpanded] = useState(true); // Start collapsed
  const [annualUsage, setAnnualUsage] = useState(propAnnualUsage || 12000);
  const [showBatterySelectionModal, setShowBatterySelectionModal] = useState(false);
  
  // Update annualUsage state when prop changes
  useEffect(() => {
    if (propAnnualUsage) {
      setAnnualUsage(propAnnualUsage);
    }
  }, [propAnnualUsage]);
  
  const [animatedStats, setAnimatedStats] = useState({
    panels: 0,
    energy: 0,
    savings: 0,
    co2: 0,
    cost: 0,
    offset: 0,
    size: 0
  });
  
  const [animatingStats, setAnimatingStats] = useState({
    panels: false,
    energy: false,
    savings: false,
    co2: false,
    cost: false,
    offset: false,
    size: false
  });
  
  // Reference to the panel section for scroll detection
  const panelSectionRef = useRef<HTMLDivElement>(null);
  
  // Reference to the battery section for scroll detection
  const batterySectionRef = useRef<HTMLDivElement>(null);
  
  // Function to check if element is in viewport
  const isElementInViewport = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };
  
  // Battery count control functions
  const handleIncreaseBatteryCount = () => {
    if ((batteryCount === 0 || !batteryCount) && !selectedBattery) {
      // Show modal to navigate back to battery selection
      setShowBatterySelectionModal(true);
    } else {
      // Increase battery count
      setBatteryCount?.(batteryCount ? batteryCount + 1 : 1);
    }
  };

  const handleDecreaseBatteryCount = () => {
    if (batteryCount && batteryCount > 0) {
      setBatteryCount(batteryCount - 1);
    }
  };
  
  // Function to handle section toggling with animation timing
  const handleSectionToggle = (section: 'offset' | 'battery' | 'manual') => {
    // Animation duration is 0.3s as defined in the motion.div transitions
    const animationDuration = isAutoPanelsSupported ? 300 : 0; // 300ms
    
    if (section === 'offset') {
      // If offset section is already expanded, just collapse it
      if (isOffsetSectionExpanded) {
        setIsOffsetSectionExpanded(false);
        return;
      }
      
      // If battery section is expanded, collapse it first
      if (isBatterySectionExpanded) {
        isAutoPanelsSupported && setIsBatterySectionExpanded(false);
        // Wait for animation to complete before expanding offset section
        setTimeout(() => {
          setIsOffsetSectionExpanded(true);
        }, animationDuration);
      } else {
        // If battery section is already collapsed, just expand offset section
        setIsOffsetSectionExpanded(true);
      }
    } else if (section === 'battery') {
      // If battery section is already expanded, just collapse it
      isAutoPanelsSupported && setIsManualPanelSectionExpanded(false);
      setTimeout(() => {
        setIsBatterySectionExpanded(!isBatterySectionExpanded);
      }, animationDuration);
    } else if (section === 'manual') {
      // Toggle manual panel section
      isAutoPanelsSupported && setIsBatterySectionExpanded(false);
      setTimeout(() => {
        setIsManualPanelSectionExpanded(!isManualPanelSectionExpanded);
      }, animationDuration);
    }
  };

  // Add scroll listener to auto-expand panel and battery sections when scrolled to
  useEffect(() => {
    const handleScroll = () => {
      if (panelSectionRef.current && isElementInViewport(panelSectionRef.current)) {
        setIsPanelSectionExpanded(true);
      }
      if (batterySectionRef.current && isElementInViewport(batterySectionRef.current)) {
        // Only auto-expand battery section if offset section is not expanded
        if (!isOffsetSectionExpanded) {
          setIsBatterySectionExpanded(true);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOffsetSectionExpanded]);
  
  // Helper function to calculate system scaling factor
  const calculateSystemFactor = (systemEnergy: number, systemOffset: number) => {
    // Reference system: 13,780kWh at 115% offset
    const refEnergy = 13780;
    const refOffset = 115;
    
    // Calculate scaling based on ratio to reference system
    const energyRatio = systemEnergy / refEnergy;
    const offsetRatio = systemOffset / refOffset;
    
    // Combine factors with square root for diminishing returns
    return Math.sqrt(energyRatio * offsetRatio);
  };

  // Unified battery backup calculations using dynamic variables
  const calculateBatteryBackup = (
    batteryType: string,
    capacity: number,
    count: number,
    systemEnergy: number,
    systemOffset: number
  ): [number, number, number] => {
    const systemFactor = calculateSystemFactor(systemEnergy, systemOffset);
    
    // Initialize with default values
    let essentialDays = 0;
    let applianceDays = 0;
    let wholeHomeDays = 0;
    
    // Battery-specific lookup tables
    const batteryConfig = {
      enphase: {
        // Enphase IQ Battery 5P (5kWh capacity, 3.84kW output)
        essential: {
          single: 4.5,
          multi: 7, // 2+ batteries have "7+" days
        },
        appliance: {
          values: [0, 0.1, 0.45, 0.8, 1.7, 2.5], // Index corresponds to count (index 1 = count 1)
          extrapolationRate: 0.8, // For batteries beyond 5
        },
        wholeHome: {
          values: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
          extrapolationRate: 0.1, // For batteries beyond 5
        },
      },
      tesla: {
        // Tesla Powerwall 3 (13.5kWh capacity, 11.5kW output)
        essential: {
          single: 7,
          multi: 7, // All batteries have "7+" days
        },
        appliance: {
          values: [0, 0.6, 3.4, 7, 7, 7], // 3+ batteries have "7+" days
          extrapolationRate: 0, // No extrapolation needed as already maxed
        },
        wholeHome: {
          values: [0, 0.2, 0.6, 1.4, 1.8, 2.6],
          extrapolationRate: 0.8, // For batteries beyond 5
        },
      },
      franklin: {
        // Franklin Home Power 2 (15kWh capacity, 10kW output)
        essential: {
          single: 7,
          multi: 7, // All batteries have "7+" days
        },
        appliance: {
          values: [0, 0.6, 2.9, 6.2, 7, 7], // 4+ batteries have "7+" days
          extrapolationRate: 0, // No extrapolation needed as already maxed
        },
        wholeHome: {
          values: [0, 0.2, 0.6, 1.3, 1.8, 2.5],
          extrapolationRate: 0.7, // For batteries beyond 5
        },
      },
    };
    
    // Get the proper configuration based on battery type (case insensitive)
    const config =
      batteryType.toLowerCase().includes("enphase") ? batteryConfig.enphase :
      batteryType.toLowerCase().includes("tesla") ? batteryConfig.tesla :
      batteryType.toLowerCase().includes("franklin") ? batteryConfig.franklin : null;
      
    if (config) {
      // Calculate essential days based on configuration
      essentialDays = count === 1 ? config.essential.single : config.essential.multi;
      
      // Calculate appliance days
      if (count < config.appliance.values.length) {
        applianceDays = config.appliance.values[count];
      } else {
        // Extrapolate for battery counts beyond our lookup table
        applianceDays = config.appliance.values[5] +
          ((count - 5) * config.appliance.extrapolationRate);
      }
      
      // Cap appliance days at 7 if needed
      applianceDays = Math.min(applianceDays, 7);
      
      // Calculate whole home days
      if (count < config.wholeHome.values.length) {
        wholeHomeDays = config.wholeHome.values[count];
      } else {
        // Extrapolate for battery counts beyond our lookup table
        wholeHomeDays = config.wholeHome.values[5] +
          ((count - 5) * config.wholeHome.extrapolationRate);
      }
      
      // Apply system scaling factor
      if (essentialDays < 7) {
        essentialDays *= systemFactor;
      }
      
      if (applianceDays < 7) {
        applianceDays *= systemFactor;
      }
      
      wholeHomeDays *= systemFactor;
    } else {
      // Generic calculation for unknown battery types
      // Calculate load categories based on daily consumption
      const dailyConsumption = systemEnergy / 365;
      const essentialLoad = dailyConsumption * 0.08;  // 8%
      const applianceLoad = dailyConsumption * 0.35;  // 35%
      const wholeHomeLoad = dailyConsumption * 1.88;  // 188%
      
      // Calculate single-battery backup time
      const essentialBackup = capacity / essentialLoad;
      const applianceBackup = capacity / applianceLoad;
      const wholeHomeBackup = capacity / wholeHomeLoad;
      
      // Apply multi-battery improvement factors
      essentialDays = Math.min(
        essentialBackup * (1 + 0.7 * (count - 1)) * systemFactor,
        7
      );
      
      applianceDays = Math.min(
        applianceBackup * (1 + 2.5 * (count - 1)) * systemFactor,
        7
      );
      
      wholeHomeDays = wholeHomeBackup * (1 + 3.33 * (count - 1)) * systemFactor;
    }
    
    return [essentialDays, applianceDays, wholeHomeDays];
  };

  // Calculate backup durations using battery-specific formulas
  const calculateBackupDurations = () => {
    // Log the battery information for debugging
  
    
    if (!selectedBattery || batteryCount === 0) {
      return {
        essential: { days: 0, hours: 0 },
        appliance: { days: 0, hours: 0 },
        wholeHome: { days: 0, hours: 0 }
      };
    }
  
    // Get battery properties
    const batteryType = selectedBattery?.shortName || "";
    let batteryCapacity = 13.5; // Default to 13.5 kWh
    
    if (typeof selectedBattery === 'object' && selectedBattery !== null) {
      if (selectedBattery.capacity) {
        batteryCapacity = selectedBattery.capacity;
      }
    }
    
    // Step 1: Calculate daily consumption
    const dailyConsumption = annualUsage / 365;
   
    
    // Get system stats for scaling
    const systemEnergy = animatedStats.energy || 0; 
    const systemOffset = animatedStats.offset || 0; 
    
    // Use the unified function for all battery types
    const [essentialBackupDays, applianceBackupDays, wholeHomeBackupDays] =
      calculateBatteryBackup(batteryType, batteryCapacity, batteryCount, systemEnergy, systemOffset);
    
    // No need to cap here as it's already handled in the calculateBatteryBackup function
    
   
    
    // Convert days to days and hours
    return {
      essential: {
        days: Math.floor(essentialBackupDays),
        hours: Math.floor((essentialBackupDays % 1) * 24)
      },
      appliance: {
        days: Math.floor(applianceBackupDays),
        hours: Math.floor((applianceBackupDays % 1) * 24)
      },
      wholeHome: {
        days: Math.floor(wholeHomeBackupDays),
        hours: Math.floor((wholeHomeBackupDays % 1) * 24)
      }
    };
  };

  // Format duration display
  const formatDuration = (duration: { days: number, hours: number }) => {
    if (duration.days === 0 && duration.hours === 0) return "N/A";
    
    // Special case for 7+ days
    if (duration.days >= 7) {
      return "7+ days";
    }
    
    let result = "";
    if (duration.days > 0) {
      result += `${duration.days} day${duration.days !== 1 ? 's' : ''} `;
    }
    if (duration.hours > 0 || duration.days === 0) {
      result += `${duration.hours} hour${duration.hours !== 1 ? 's' : ''}`;
    }
    return result.trim();
  };
  
  // Calculate backup durations
  const backupDurations = calculateBackupDurations();
  
  // Calculate combined stats for display
  // If there are no panels at all, energy should be 0
  const combinedEnergyDcKwh = (totalManualPanels === 0)
    ? 0
    : totalManualPanels * 550;
  const combinedPanelCount = stats.totalPanels + totalManualPanels;

  // Calculate combined offset - if no panels, offset should be 0
  const combinedOffset = combinedPanelCount === 0
    ? 0
    : Math.max(0, ((combinedEnergyDcKwh - annualUsage) / annualUsage + 1) * 100);
  
  // Animate stats when they change
  useEffect(() => {
    // Use a single animation duration for all stats
    const animationDuration = 1500; // 1.5 seconds animation for everything
    const animationStartTime = Date.now();
    
    // Mark all stats as animating at the start
    setAnimatingStats({
      panels: true,
      energy: true,
      savings: true,
      co2: true,
      cost: true,
      offset: true,
      size: true
    });
    
    // Get start values from current animated stats
    const panelStart = animatedStats.panels;
    const energyStart = animatedStats.energy;
    const savingsStart = animatedStats.savings;
    const co2Start = animatedStats.co2;
    const sizeStart = animatedStats.size;
    const costStart = animatedStats.cost;
    const offsetStart = animatedStats.offset;
    
    // Calculate new target values
    const sizeInKW = (combinedPanelCount * 400) / 1000;
    const costValue = sizeInKW * 2.50 * 1000; // Converting to dollars
    const offsetValue = combinedOffset
    
    // Calculate differences between current and target values
    const panelDiff = combinedPanelCount - panelStart;
    const energyDiff = Math.round(combinedEnergyDcKwh) - energyStart;
    const savingsDiff = Math.round(combinedEnergyDcKwh * 0.15) - savingsStart;
    const co2Diff = Math.round(combinedEnergyDcKwh * 0.85) - co2Start;
    const sizeDiff = sizeInKW - sizeStart;
    const costDiff = costValue - costStart;
    const offsetDiff = offsetValue - offsetStart;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - animationStartTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Ease-out function for smoother animation
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOut(progress);
      
      // Update all animated values with the same progress
      setAnimatedStats({
        panels: Math.round(panelStart + panelDiff * easedProgress),
        energy: Math.round(energyStart + energyDiff * easedProgress),
        savings: Math.round(savingsStart + savingsDiff * easedProgress),
        co2: Math.round(co2Start + co2Diff * easedProgress),
        cost: Math.round(costStart + costDiff * easedProgress),
        offset: Math.round(offsetStart + offsetDiff * easedProgress),
        size: Number((sizeStart + sizeDiff * easedProgress).toFixed(1))
      });
      
      // Continue animation until complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Mark all stats as done animating
        setAnimatingStats({
          panels: false,
          energy: false,
          savings: false,
          co2: false,
          cost: false,
          offset: false,
          size: false
        });
      }
    };
    
    requestAnimationFrame(animate);
  }, [stats.totalPanels, stats.totalEnergyDcKwh, annualUsage, totalManualPanels]);
  
  // Helper function to get tier label based on panel count
  const getSystemTier = () => {
    if (stats.totalPanels >= 20) return "Premium";
    if (stats.totalPanels >= 10) return "Standard";
    return "Basic";
  };
  
  // Toggle manual panels mode
  const handleToggleManualPanels = () => {
    setManualPanelsOn(!manualPanelsOn);
  };
  
  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-3xl overflow-visible  top-4 transition-all duration-500 relative ${
        obstructionMode ? 'opacity-0 translate-x-20' : 'opacity-100 translate-x-0'
      }`}
    >
      {/* Battery Selection Modal */}
      <AnimatePresence>
        {showBatterySelectionModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center   p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="rounded-3xl border border-white/10 p-6 max-w-md bg-[#070709]"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <h3 className="text-xl font-light text-white mb-8 text-center">Battery Required</h3>
              <p className="text-gray-300 mb-8 text-center">
                A battery must be selected to modify the quantity.
              </p>
              <div className="px-5 py-5 pb-3 border-t border-white/10">
                <div className="relative">
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
                  <div className="flex gap-4 w-full">
                    <motion.button
                      onClick={() => setShowBatterySelectionModal(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative z-10 h-[52px] flex items-center rounded-full justify-center gap-3 text-white/70 border border-white/10 transition-all duration-500 text-sm font-medium tracking-wider group flex-1"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowBatterySelectionModal(false);
                        navigateToBatteriesTab();
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-sheen relative z-10 h-[52px] flex items-center rounded-full justify-center gap-3  border border-white/10 text-white shadow-xl transition-all duration-500 text-sm font-medium tracking-wider group flex-1"
                    >
                      Select
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content container with backdrop blur */}
      <div className="relative z-10 bg-black/10  rounded-3xl border border-white/10">
        {/* Header */}
       
        <div className="">
          <div className="px-5 py-0">
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-0 overflow-hidden rounded-xl`}>
              <motion.div
                variants={cardVariants}
                whileTap="tap"
                className="relative overflow-hidden group border-r border-white/10 border-b"
              >
                <div className="flex flex-col h-full justify-between relative z-10 p-4">
                  <div className="text-xs text-gray-500 text-center uppercase tracking-widest pb-2">Annual Usage</div>
                  
                  <motion.div
                    key={`annual-usage-stat`}
                    initial={{ opacity: 0.5, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-light text-white tabular-nums flex items-end self-center pb-2 pt-2 "
                  >
                    <motion.span 
                      className="text-white"
                      whileHover={{ scale: 1.1 }}
                    >
                      {Math.round(annualUsage).toLocaleString()}
                    </motion.span>
                    <span className="text-xs text-gray-500  tracking-widest ml-1 mb-1">kWh</span>
                  </motion.div>
                </div>
                
                {/* Subtle animated border effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    boxShadow: ['0 0 0px rgba(168, 85, 247, 0)', '0 0 15px rgba(168, 85, 247, 0.3)', '0 0 0px rgba(168, 85, 247, 0)']
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "loop" }}
                />
              </motion.div>
              
              <motion.div
                variants={cardVariants}
                whileTap="tap"
                className="relative overflow-hidden group border-b border-white/10"
              >
                <div className="flex flex-col h-full justify-between relative z-10 p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-widest pb-2 text-center">Annual Output</div>
                  
                  <motion.div
                    initial={{ opacity: 0.5, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-light text-white tabular-nums truncate flex items-end self-center px-4 pb-2 pt-2"
                  >
                    <motion.span 
                      className="text-white"
                      whileHover={{ scale: 1.1 }}
                      animate={{ opacity: animatingStats.energy ? 0.5 : 1 }}
                     
                    >
                      {Math.round(combinedEnergyDcKwh).toLocaleString()}
                    </motion.span>
                    <span className="text-xs text-gray-500 tracking-widest ml-1 mb-1">kWh</span>
                  </motion.div>
                </div>
                
                {/* Subtle animated border effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    boxShadow: ['0 0 0px rgba(168, 85, 247, 0)', '0 0 15px rgba(168, 85, 247, 0.3)', '0 0 0px rgba(168, 85, 247, 0)']
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "loop" }}
                />
              </motion.div>
              
              <motion.div
                variants={cardVariants}
                whileTap="tap"
                className="relative overflow-hidden group border-r border-white/10"
              >
                <div className="flex flex-col h-full justify-between relative z-10 p-4">
                    <div className="text-xs text-gray-500 uppercase tracking-widest pb-2 text-center">System Size</div>
                  
                  <motion.div
                    initial={{ opacity: 0.5, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-light text-white tabular-nums flex items-end self-center pb-2 pt-2"
                  >
                    <motion.span 
                      className="text-white"
                      whileHover={{ scale: 1.1 }}
                      animate={{ opacity: animatingStats.size ? 0.5 : 1 }}
                    
                    >
                      {((combinedPanelCount * 400) / 1000).toFixed(1)}
                    </motion.span>
                    <span className="text-xs text-gray-500  tracking-widest ml-1 mb-1">kW</span>
                  </motion.div>
                </div>
                
                {/* Subtle animated border effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    boxShadow: ['0 0 0px rgba(168, 85, 247, 0)', '0 0 15px rgba(168, 85, 247, 0.3)', '0 0 0px rgba(168, 85, 247, 0)']
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "loop" }}
                />
              </motion.div>
              
              <motion.div
                variants={cardVariants}
                whileTap="tap"
                className="relative overflow-hidden group "
              >
                <div className="flex flex-col h-full justify-between relative z-10 p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-widest pb-2 text-center">Offset</div>
                  
                  <motion.div
                    initial={{ opacity: 0.5, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-light text-white tabular-nums flex items-end self-center pb-2 pt-2"
                  >
                    <motion.span 
                      className="text-white"
                      whileHover={{ scale: 1.1 }}
                      animate={{ opacity: animatingStats.offset ? 0.5 : 1 }}
                     
                    >
                      {animatedStats.offset}
                    </motion.span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest ml-1 mb-1">%</span>
                  </motion.div>
                </div>
                
                {/* Subtle animated border effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    boxShadow: ['0 0 0px rgba(168, 85, 247, 0)', '0 0 15px rgba(168, 85, 247, 0.3)', '0 0 0px rgba(168, 85, 247, 0)']
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "loop" }}
                />
              </motion.div>
            </div>
          </div>
          
          {/* Manual Panel Controls Section - always shown as a dropdown */}
          <div className="relative rounded-t-3xl shadow-lg">
           {/* Only show panel controls if auto panels are supported */}
           {isAutoPanelsSupported && (
             <PanelControls
               activePanels={stats.totalPanels + totalManualPanels}
               totalPanels={totalPanels + totalManualPanels}
               onDecreasePanels={onDecreasePanels}
               onIncreasePanels={onIncreasePanels}
             />
           )}
       </div>
          <div className="px-5 pt-3 ">
            {/* Manual Panel Controls have been moved to NearmapTestingTwoManual.tsx as an overlay above the map. */}
          </div>
          
          {/* Battery Storage Section - always shown just like manual panels section */}
          <div className="px-5 pt-4">
            <motion.div
              className="overflow-hidden rounded-xl bg-black/30 border border-white/5"
              ref={batterySectionRef}
            >
              <div
                className="flex items-center cursor-pointer p-4 relative"
                onClick={() => handleSectionToggle('battery')}
              >
                <h3 className="text-white text-sm font-medium w-full text-center">
                  {selectedBattery
                    ? selectedBattery.name
                    : batteryCount === 0
                      ? "No Battery Selected"
                      : "Battery Required"}
                </h3>
                <motion.div
                  animate={{ rotate: isBatterySectionExpanded ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-4"
                >
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </motion.div>
              </div>
              
              <AnimatePresence>
                {isBatterySectionExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-visible"
                  >
                    <div className="px-4 pb-4">
                      {/* Battery Information and Controls in a row */}
                      <div className="mb-4 flex items-center justify-center">
                        {/* Battery Count Controls */}
                        <motion.div className="flex items-center gap-1 text-white select-none">
                          {/* Decrease button */}
                          <motion.button
                            variants={controlButtonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handleDecreaseBatteryCount}
                            className={`relative w-9 h-9 flex items-center justify-center rounded-full ${
                              batteryCount === 0
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'text-white border border-white/20'
                            } transition-colors`}
                            disabled={batteryCount === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          
                          {/* Battery count display */}
                          <div className="relative text-center min-w-[60px] group">
                            <div className="flex flex-col">
                              <motion.div
                                key={batteryCount}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-base font-light tracking-wide"
                              >
                                <span className="text-white text-2xl font-lg">{batteryCount}</span>
                              </motion.div>
                              
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest">{batteryCount === 1 ? 'Battery' : 'Batteries'}</div>
                            </div>
                          </div>
                          
                          {/* Increase button */}
                          <motion.button
                            variants={controlButtonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handleIncreaseBatteryCount}
                            className="group relative w-9 h-9 overflow-visible"
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
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[15px]" />
                            </motion.div>

                            {/* Button Core */}
                            <div
                              className="btn-sheen relative z-10 flex items-center justify-center w-full h-full rounded-full shadow-xl transition-all duration-500 border border-white/10 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </div>
                          </motion.button>
                        </motion.div>
                      </div>
                      
                      {/* Backup Durations */}
                      <div className="p-3 rounded-lg ">
                        <h4 className="text-white/90 text-sm w-full text-center mb-3">Backup Duration</h4>
                        
                        <div className="text-sm">
                          <div className="flex justify-between mb-1 pb-1 border-b border-white/5">
                            <div className="flex items-center gap-1 group relative">
                              <span className="text-gray-300">Essentials</span>
                              <div className="relative w-4 h-4 flex items-center justify-center cursor-help">
                                <div className="w-3 h-3 rounded-full border border-white/30 flex items-center justify-center text-[8px] text-white/70">i</div>
                                <div className="absolute bottom-full -left-3 mb-1 w-[220px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                                  <div className="relative">
                                    <div className="absolute -inset-1 rounded-md opacity-70"></div>
                                    <div className="bg-black/80 backdrop-blur-sm text-[12px] p-2 rounded-md border border-white/10 text-white/90 relative z-10 text-center">
                                      Electrical fixtures and select outlets
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className="text-white">{formatDuration(backupDurations.essential)}</span>
                          </div>
                          
                          <div className="flex justify-between mb-1 pb-1 border-b border-white/5">
                            <div className="flex items-center gap-1 group relative">
                              <span className="text-gray-300">Appliances</span>
                              <div className="relative w-4 h-4 flex items-center justify-center cursor-help">
                                <div className="w-3 h-3 rounded-full border border-white/30 flex items-center justify-center text-[8px] text-white/70">i</div>
                                <div className="absolute bottom-full -left-3 mb-1 w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                                  <div className="relative">
                                    <div className="absolute -inset-1 rounded-md opacity-70"></div>
                                    <div className="bg-black/80 backdrop-blur-sm text-[12px] p-2 rounded-md border border-white/10 text-white/90 relative z-10 text-center">
                                      Small appliances and essentials
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className="text-white">{formatDuration(backupDurations.appliance)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <div className="flex items-center gap-1 group relative">
                              <span className="text-gray-300">Whole Home</span>
                              <div className="relative w-4 h-4 flex items-center justify-center cursor-help">
                                <div className="w-3 h-3 rounded-full border border-white/30 flex items-center justify-center text-[8px] text-white/70">i</div>
                                <div className="absolute bottom-full -left-3 mb-1 w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                                  <div className="relative">
                                    <div className="absolute -inset-1 rounded-md opacity-70"></div>
                                    <div className="bg-black/80 backdrop-blur-sm text-[12px] p-2 rounded-md border border-white/10 text-white/90 relative z-10 text-center">
                                      Major appliances and essentials 
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className="text-white">{formatDuration(backupDurations.wholeHome)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Add Finalize Design button here */}
          <div className="px-[20%]  py-4 pb-6 mt-2">
            <div className="relative">
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
              <motion.button
                onClick={onFinalizeDesign}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-sheen relative z-10 w-full h-[52px] flex items-center rounded-full justify-center gap-3 px-8 text-white shadow-xl transition-all duration-500 border border-white/10 text-sm font-medium tracking-wider group"
              >
                Finalize Design
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        
        {/* Panel Selection Section */}
  

        {/* Segment Details */}
    
      </div>
    </motion.div>
  );
};
