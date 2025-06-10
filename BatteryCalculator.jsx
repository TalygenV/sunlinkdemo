import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronRight, ChevronLeft, Plus, Minus, AlertTriangle } from 'lucide-react';

const BatteryCalculator = ({ isModal = false }) => {
  // Battery data
  const batteryOptions = [
    {
      name: "Tesla Powerwall 3",
      capacity: 13.5,
      warranty: 10,
      warrantyUnit: "years",
      price: 12000
    },
    {
      name: "Enphase IQ Battery 5P",
      capacity: 5,
      warranty: 15,
      warrantyUnit: "years",
      price: 8000
    },
    {
      name: "Franklin Home Power 2",
      capacity: 10,
      warranty: 15,
      warrantyUnit: "years",
      price: 9000
    }
  ];

  // Backup options data
  const backupOptions = [
    { name: "Essential Lighting", powerNeeded: 1.2 },
    { name: "Critical Outlets", powerNeeded: 2.4 },
    { name: "Refrigeration", powerNeeded: 3.6 },
    { name: "Internet & Electronics", powerNeeded: 1.2 },
    { name: "EV Charging", powerNeeded: 11.8 },
    { name: "Air conditioning", powerNeeded: 10 },
  ];

  // State initialization
  const [selectedBattery, setSelectedBattery] = useState(batteryOptions[0]); // Default to Tesla
  const [selectedBackupOptions, setSelectedBackupOptions] = useState([]);
  const [batteryQuantity, setBatteryQuantity] = useState(1);
  const [recommendedQuantity, setRecommendedQuantity] = useState(1);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [totalPowerNeeded, setTotalPowerNeeded] = useState(0);
  const [backupDuration, setBackupDuration] = useState({ days: 0, hours: 0 });

  // Calculate total power needed based on selected options
  const calculateTotalPowerNeeded = (options) => {
    const total = options.reduce((sum, optionName) => {
      const option = backupOptions.find(o => o.name === optionName);
      return sum + (option ? option.powerNeeded : 0);
    }, 0);
    
    setTotalPowerNeeded(total);
    return total;
  };

  // Calculate recommended battery quantity
  const calculateRecommendedQuantity = (battery, options) => {
    if (!battery) return 1;
    
    const totalPower = calculateTotalPowerNeeded(options);
    if (totalPower === 0) return 1;
    
    // Calculate how many batteries needed for a full day's backup
    // We need enough capacity to cover the daily power needs
    const quantityNeeded = Math.ceil(totalPower / battery.capacity);
    
    setRecommendedQuantity(Math.max(1, quantityNeeded));
    return Math.max(1, quantityNeeded);
  };

  // Calculate backup duration
  const calculateBackupDuration = (battery, quantity, options) => {
    if (!battery || options.length === 0) {
      setBackupDuration({ days: 0, hours: 0 });
      return { days: 0, hours: 0 };
    }
    
    const totalCapacity = battery.capacity * quantity;
    const totalDailyPower = calculateTotalPowerNeeded(options);
    
    if (totalDailyPower === 0) {
      setBackupDuration({ days: 0, hours: 0 });
      return { days: 0, hours: 0 };
    }
    
    const durationDays = totalCapacity / totalDailyPower;
    const durationHours = durationDays * 24;
    
    const result = {
      days: Math.floor(durationDays),
      hours: Math.floor(durationHours % 24)
    };
    
    setBackupDuration(result);
    return result;
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    if (!selectedBattery) return 0;
    return selectedBattery.price * batteryQuantity;
  };

  // Handle battery selection
  const handleSelectBattery = (battery) => {
    setSelectedBattery(battery);
    // Recalculate duration and recommended quantity when battery changes
    if (selectedBackupOptions.length > 0) {
      calculateRecommendedQuantity(battery, selectedBackupOptions);
      calculateBackupDuration(battery, batteryQuantity, selectedBackupOptions);
    }
  };

  // Handle backup option toggle
  const handleToggleBackupOption = (option) => {
    const isSelected = selectedBackupOptions.includes(option.name);
    
    if (isSelected) {
      // Remove option from selections
      setSelectedBackupOptions(prev => prev.filter(name => name !== option.name));
    } else {
      // Add option to selections
      setSelectedBackupOptions(prev => [...prev, option.name]);
    }
    
    // After updating, recalculate power needed and recommended battery quantity
    const updatedOptions = isSelected 
      ? selectedBackupOptions.filter(name => name !== option.name)
      : [...selectedBackupOptions, option.name];
    
    calculateTotalPowerNeeded(updatedOptions);
    if (selectedBattery) {
      calculateRecommendedQuantity(selectedBattery, updatedOptions);
      calculateBackupDuration(selectedBattery, batteryQuantity, updatedOptions);
    }
  };

  // Handle increase battery quantity
  const handleIncreaseQuantity = () => {
    const newQuantity = batteryQuantity + 1;
    setBatteryQuantity(newQuantity);
    if (selectedBattery && selectedBackupOptions.length > 0) {
      calculateBackupDuration(selectedBattery, newQuantity, selectedBackupOptions);
    }
  };

  // Handle decrease battery quantity with confirmation
  const handleDecreaseQuantity = () => {
    if (batteryQuantity <= 1) return;
    
    const newQuantity = batteryQuantity - 1;
    
    // Check if decreasing would result in insufficient capacity
    if (selectedBattery && selectedBackupOptions.length > 0) {
      const totalCapacity = selectedBattery.capacity * newQuantity;
      const currentPowerNeeded = totalPowerNeeded;
      
      // Only show confirmation if we actually need more capacity than we'll have
      // This ensures we don't show the popup when there's still sufficient capacity
      if (totalCapacity < currentPowerNeeded) {
        // Show confirmation popup
        setShowConfirmationPopup(true);
      } else {
        // Just decrease the quantity - we have enough capacity
        setBatteryQuantity(newQuantity);
        calculateBackupDuration(selectedBattery, newQuantity, selectedBackupOptions);
      }
    } else {
      // No selected battery or options, just decrease
      setBatteryQuantity(newQuantity);
    }
  };

  // Handle confirmation response
  const handleConfirmationResponse = (addBattery) => {
    setShowConfirmationPopup(false);
    
    if (addBattery) {
      // User wants to keep current selections, don't decrease battery
      return;
    } else {
      // User wants to decrease battery, we need to auto-deselect options
      const newQuantity = batteryQuantity - 1;
      setBatteryQuantity(newQuantity);
      
      if (selectedBattery) {
        const newCapacity = selectedBattery.capacity * newQuantity;
        
        // Sort options by power consumption (highest first)
        // This ensures we remove the most power-hungry options first
        const sortedOptionNames = [...selectedBackupOptions].sort((a, b) => {
          const optionA = backupOptions.find(o => o.name === a);
          const optionB = backupOptions.find(o => o.name === b);
          return (optionB?.powerNeeded || 0) - (optionA?.powerNeeded || 0);
        });
        
        // Deselect options until we're under capacity
        let remainingCapacity = newCapacity;
        let currentPower = totalPowerNeeded;
        let updatedOptions = [...selectedBackupOptions];
        
        // Only start removing options if we're actually over capacity
        if (currentPower > remainingCapacity) {
          console.log(`Need to remove options: current power ${currentPower}kWh exceeds capacity ${remainingCapacity}kWh`);
          
          for (const optionName of sortedOptionNames) {
            const option = backupOptions.find(o => o.name === optionName);
            if (!option) continue;
            
            if (currentPower > remainingCapacity) {
              // Remove this option
              console.log(`Removing option: ${option.name} (${option.powerNeeded}kWh)`);
              updatedOptions = updatedOptions.filter(name => name !== optionName);
              currentPower -= option.powerNeeded;
            } else {
              // We're now under capacity, stop removing
              break;
            }
          }
          
          setSelectedBackupOptions(updatedOptions);
          setTotalPowerNeeded(currentPower);
        }
        
        // Always recalculate duration with the new quantity and possibly updated options
        calculateBackupDuration(selectedBattery, newQuantity, updatedOptions);
      }
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
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

  // Update calculations when component mounts
  useEffect(() => {
    if (selectedBattery && selectedBackupOptions.length > 0) {
      calculateTotalPowerNeeded(selectedBackupOptions);
      calculateRecommendedQuantity(selectedBattery, selectedBackupOptions);
      calculateBackupDuration(selectedBattery, batteryQuantity, selectedBackupOptions);
    }
  }, []);

  // Determine container classes based on isModal prop
  const containerClasses = isModal 
    ? "" // No additional classes needed for modal mode
    : "relative";

  return (
    <div className={containerClasses}>
      {/* Only show background glow effect when not in modal mode */}
      {!isModal && (
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
      )}
      
      {/* Main content container with backdrop blur */}
      <motion.div 
        className={`relative z-10 ${!isModal ? 'backdrop-blur-xl border border-white/10 rounded-3xl' : ''} overflow-visible`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="p-4 battery-calculator"
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
            {/* Only show header when not in modal mode */}
            {!isModal && (
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
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white/30 font-light"></div>
                  <div className="absolute -bottom-1 -right-8 w-6 h-6 border-b-2 border-r-2 border-white/30"></div>
                  
                  <motion.h2 
                    className="text-4xl text-white px-4 pt-2 font-light tracking-wide text-left" 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    Select Your Battery
                  </motion.h2>
                  
                  <motion.div 
                    className="text-gray-400 text-lg px-4 py-2 pb-2 min-h-[24px] w-full"
                    layout
                  >
                    <AnimatePresence mode="wait">
                      <motion.div 
                        className="flex items-center"
                        key="battery-spec"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="tabular-nums">
                          Choose a battery system to power your essential needs during outages
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
            
            {/* Battery Selection Cards */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {batteryOptions.map((battery, index) => (
                <motion.div
                  key={`battery-${index}`}
                  className={`p-4 rounded-xl border ${selectedBattery && selectedBattery.name === battery.name 
                    ? 'border-blue-500/50 bg-orange-900/20' 
                    : 'border-white/10 bg-black/40 hover:bg-black/60'} 
                    backdrop-blur-md cursor-pointer transition-colors`}
                  onClick={() => handleSelectBattery(battery)}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="text-xl text-white font-medium mb-2">{battery.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Capacity:</span>
                      <span className="text-white font-medium">{battery.capacity} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Warranty:</span>
                      <span className="text-white font-medium">{battery.warranty} {battery.warrantyUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-white font-medium">{formatCurrency(battery.price)}</span>
                    </div>
                  </div>
                  {selectedBattery && selectedBattery.name === battery.name && (
                    <motion.div 
                      className="mt-3 bg-orange-500/20 rounded-md p-1 text-center text-yellow-300 text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      Selected
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
            
            {/* Battery Calculator Section */}
            <motion.div
              variants={itemVariants}
              className="mt-6 p-6 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md"
            >
              <h3 className="text-2xl text-white font-light mb-4">Battery Calculator</h3>
              <div className="mb-4">
                <h4 className="text-lg text-white/80 mb-3">What would you like to backup?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {backupOptions.map((option, index) => (
                    <motion.div
                      key={`option-${index}`}
                      className={`p-3 rounded-lg border ${selectedBackupOptions.includes(option.name) 
                        ? 'border-green-500/30 bg-green-900/20' 
                        : 'border-white/10 bg-black/20'} 
                        cursor-pointer transition-colors`}
                      onClick={() => handleToggleBackupOption(option)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-md mr-3 flex items-center justify-center ${
                            selectedBackupOptions.includes(option.name) 
                              ? 'bg-green-500/80' 
                              : 'bg-white/10'
                          }`}>
                            {selectedBackupOptions.includes(option.name) && (
                              <motion.svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="text-white"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </motion.svg>
                            )}
                          </div>
                          <span className="text-white">{option.name}</span>
                        </div>
                        <span className="text-gray-300 tabular-nums">{option.powerNeeded} kWh/day</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Calculation Results */}
              <div className="mt-6 p-4 rounded-lg bg-black/30 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 mb-1">Daily power needed:</div>
                    <div className="text-2xl text-white font-medium tabular-nums">
                      {totalPowerNeeded.toFixed(1)} kWh/day
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Battery duration:</div>
                    <div className="text-2xl text-white font-medium tabular-nums">
                      {backupDuration.days > 0 && `${backupDuration.days} day${backupDuration.days !== 1 ? 's' : ''} `}
                      {backupDuration.hours > 0 && `${backupDuration.hours} hour${backupDuration.hours !== 1 ? 's' : ''}`}
                      {backupDuration.days === 0 && backupDuration.hours === 0 && 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Total Cost:</div>
                    <div className="text-2xl text-white font-medium tabular-nums">
                      {formatCurrency(calculateTotalCost())}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Quantity:</div>
                    <div className="flex items-center">
                      <motion.button
                        className="w-8 h-8 rounded-l-md bg-white/10 text-white flex items-center justify-center"
                        onClick={handleDecreaseQuantity}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        disabled={batteryQuantity <= 1}
                      >
                        <Minus size={16} />
                      </motion.button>
                      <div className="px-4 py-1 bg-white/5 text-white text-xl font-medium tabular-nums">
                        {batteryQuantity}
                      </div>
                      <motion.button
                        className="w-8 h-8 rounded-r-md bg-white/10 text-white flex items-center justify-center"
                        onClick={handleIncreaseQuantity}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus size={16} />
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* Recommended quantity message - only show when meaningful */}
                {recommendedQuantity > batteryQuantity && selectedBackupOptions.length > 0 && totalPowerNeeded > 0 && (
                  <motion.div
                    className="mt-4 p-3 rounded-lg bg-yellow-900/30 border border-yellow-500/30 text-yellow-300 flex items-start gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <AlertTriangle size={20} className="mt-0.5" />
                    <div>
                      <p>Based on your selections requiring {totalPowerNeeded.toFixed(1)} kWh/day, we recommend {recommendedQuantity} {selectedBattery.name} {recommendedQuantity === 1 ? 'battery' : 'batteries'} for full-day backup coverage.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Confirmation Popup */}
      <AnimatePresence>
        {showConfirmationPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-orange-900 rounded-xl border border-white/10 p-6 max-w-md mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <h3 className="text-xl text-white font-medium mb-3">Insufficient Battery Capacity</h3>
              <p className="text-gray-300 mb-4">
                Reducing to {batteryQuantity - 1} {selectedBattery.name} batteries will not provide enough capacity for all your selected backup options.
              </p>
              <p className="text-gray-300 mb-6">
                Would you like to keep your current battery quantity or reduce it and automatically remove some backup options?
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  className="px-4 py-2 rounded-lg bg-transparent border border-white/20 text-white"
                  onClick={() => handleConfirmationResponse(false)}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reduce & Auto-Adjust
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white"
                  onClick={() => handleConfirmationResponse(true)}
                  whileHover={{ backgroundColor: '#3b82f6' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Keep Current Quantity
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BatteryCalculator;