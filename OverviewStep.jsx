import React, { useState, useEffect, useLayoutEffect } from 'react';
import { CheckCircle, DollarSign, Sparkles, CreditCard, Zap, Sun, Cpu, BatteryCharging, X } from 'lucide-react'; // Added X icon
import LoanOptionCard from '../ui/LoanOptionCard'; // Corrected path
import StripeCheckout from './StripeCheckout'; // Import StripeCheckout
import { motion, AnimatePresence } from 'framer-motion'; // Added for modal animations

// Helper function to format currency (no change)
const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    console.warn("Invalid amount passed to formatCurrency:", amount);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(0);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericAmount);
};

// Helper function to calculate cash price
const calculateCashPrice = (systemSizeKw, batteryCount, selectedBatteryDetails) => {
  const baseCost = 2.3 * systemSizeKw * 1000;
  const batteryAddon = batteryCount && selectedBatteryDetails?.price
    ? batteryCount * selectedBatteryDetails.price
    : 0;
  return baseCost + batteryAddon;
};

// Helper function to calculate monthly loan payment using dealerFee and pmtFactor
const calculateLoanPayment = (cashPrice, dealerFee, pmtFactor) => {
  const numericCashPrice = Number(cashPrice);
  if (isNaN(numericCashPrice) || numericCashPrice <= 0 || dealerFee >= 1 || pmtFactor <= 0) {
    return 0;
  }
  const financedAmount = numericCashPrice / (1 - dealerFee);
  return financedAmount * pmtFactor;
};

// Legacy helper function to calculate monthly loan payment (kept for reference)
const calculateMonthlyPayment = (principal, annualRate, years) => {
  const numericPrincipal = Number(principal);
  if (isNaN(numericPrincipal) || numericPrincipal <= 0 || annualRate <= 0 || years <= 0) {
    return 0;
  }
  const monthlyRate = (annualRate / 100) / 12;
  const numberOfPayments = years * 12;
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
  const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
  if (denominator === 0) return 0;
  const monthlyPayment = numericPrincipal * (numerator / denominator);
  return monthlyPayment;
};

// Payment options data with dealerFee and pmtFactor values
const paymentOptions = [
  { id: 'cash', type: 'Cash', label: 'Cash Payment' },
  {
    id: 'finance_25',
    type: 'Finance',
    label: '25 Year Loan',
    termYears: 25,
    annualRate: 3.99,
    dealerFee: 0.35,
    pmtFactor: 0.0038216
  },
  {
    id: 'finance_15',
    type: 'Finance',
    label: '15 Year Loan',
    termYears: 15,
    annualRate: 3.99,
    dealerFee: 0.32,
    pmtFactor: 0.005381
  },
  {
    id: 'finance_10',
    type: 'Finance',
    label: '10 Year Loan',
    termYears: 10,
    annualRate: 3.99,
    dealerFee: 0.28,
    pmtFactor: 0.0074078
  }
];

// Premium Cash Payment Card
const CashPaymentCard = ({ option, isSelected, onClick, cashPrice, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden group
        bg-black/30 rounded-xl border border-white/10 p-4 transition-all duration-300 ease-in-out cursor-pointer hover:border-white/20
        ${isSelected
          ? 'border-indigo-400 ring-2 ring-indigo-400'
          : ''}
        ${className}
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 text-indigo-400">
          <CheckCircle size={20} strokeWidth={2.5} />
        </div>
      )}

      {/* Content */}
      <div className="flex items-center space-x-3 mb-2">
        <DollarSign size={28} className={`${isSelected ? 'text-indigo-400' : 'text-indigo-500'}`} />
        <div className="pl-3 border-l border-white/20">
          <p className="text-sm text-gray-400 uppercase tracking-widest">Cash Payment</p>
        </div>
      </div>
      
      {/* Cash price - centered and prominent */}
      <div className="flex justify-center items-center mt-1 mb-2">
        <p className={`text-2xl md:text-3xl lg:text-4xl font-semibold text-white tabular-nums ${isSelected ? 'text-white' : 'text-white'}`}>
          {formatCurrency(cashPrice)}
        </p>
      </div>
      
      {/* Deposit info at bottom */}
      <div className="flex justify-center">
        <p className={`text-sm ${isSelected ? 'text-indigo-400' : 'text-indigo-400/90'}`}>
          + $500 down payment
        </p>
      </div>
    </div>
  );
};

// Original PaymentOptionCard component kept for reference
const PaymentOptionCard = ({ option, isSelected, onClick, cashPrice }) => {
  const monthlyPayment = option.type === 'Finance'
    ? calculateMonthlyPayment(cashPrice, option.annualRate, option.termYears)
    : null;

  return (
    <div
      onClick={onClick}
      className={`
        relative group p-6 rounded-xl border-2 transition-all duration-300 ease-in-out cursor-pointer h-full flex flex-col justify-between
        bg-gradient-to-br backdrop-blur-sm hover:shadow-xl
        ${isSelected
          ? 'border-cyan-400 from-gray-700/70 to-gray-800/80 shadow-cyan-500/20 shadow-lg ring-2 ring-cyan-400 ring-offset-2 ring-offset-black/30'
          : 'border-white/20 from-gray-800/60 to-gray-900/70 hover:border-white/40 hover:from-gray-700/70 hover:to-gray-800/80'
        }
      `}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 text-cyan-400">
          <CheckCircle size={20} strokeWidth={2.5} />
        </div>
      )}
      <div> {/* Wrapper for content alignment */}
        <h3 className={`text-lg font-semibold mb-3 ${isSelected ? 'text-cyan-300' : 'text-white'}`}>{option.label}</h3>
        {option.type === 'Cash' ? (
          <p className="text-3xl font-bold text-white">{formatCurrency(cashPrice)}</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-white mb-1">{formatCurrency(monthlyPayment)} <span className="text-lg font-normal text-gray-400">/ mo</span></p>
            <p className="text-sm text-gray-400">at {option.annualRate}% APR for {option.termYears} years</p>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Overview Step Component ---
const OverviewStep = ({
  onContinue,
  selectedPaymentOption: externalSelectedOption,
  onSelectPaymentOption,
  cashPrice: externalCashPrice, // Renamed to avoid conflict with our calculated price
  // New props for system configuration summary
  totalPanels,
  systemSizeKw,
  batteryCount,
  selectedBatteryDetails,
  solarPanelType,
  inverterModel,
}) => {
  // Calculate the cash price based on system size and battery addons
  const calculatedCashPrice = calculateCashPrice(systemSizeKw, batteryCount, selectedBatteryDetails);
  
  // Use provided cash price if available, otherwise use our calculated price
  const cashPrice = externalCashPrice || calculatedCashPrice;
  
  // Internal state for selection with animation transitions
  const [selectedOption, setSelectedOption] = useState(externalSelectedOption || null);
  
  // State to control the Stripe checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const initialIsMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [viewerKey, setViewerKey] = useState(0); // Add a key to force re-render
  useLayoutEffect(() => {
    const checkIfMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        // Force re-render of viewer component when switching modes
        setViewerKey(prevKey => prevKey + 1);
        // Reset expanded card when switching to/from mobile
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
  // Handle checkout cancellation
  const handleCheckoutCancel = () => {
    setShowCheckoutModal(false);
  };

  // Update external state after animation delay
  const handleOptionSelect = (optionId) => {
    setSelectedOption(optionId);
    
    // If using an external state manager, update it
    if (onSelectPaymentOption) {
      onSelectPaymentOption(optionId);
    }
  };

  // Sync with external state if it changes
  useEffect(() => {
    if (externalSelectedOption !== selectedOption) {
      setSelectedOption(externalSelectedOption);
    }
  }, [externalSelectedOption, selectedOption]);
  
  // Handle opening the checkout modal (exposed to parent)
  useEffect(() => {
    // Create a method on the window to allow parent component to open the modal
    const originalShowCheckoutModal = window.showStripeModal;
    
    window.showStripeModal = () => {
      if (selectedOption ) {
        setShowCheckoutModal(true);
        return true;
      }
      return false;
    };
    
    // Cleanup
    return () => {
      window.showStripeModal = originalShowCheckoutModal;
    };
  }, [selectedOption]);

  // Separate cash and finance options
  const cashOption = paymentOptions.find(opt => opt.type === 'Cash');
  const financeOptions = paymentOptions.filter(opt => opt.type === 'Finance');

  return (
    <div className="flex flex-col items-center text-white p-4 md:p-8 max-w-6xl mx-auto  ">
      {/* Add shimmer animation CSS */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer-animation {
          animation: shimmer 3s infinite;
          opacity: 0.2;
        }
        .hover\:shimmer-animation:hover {
          animation: shimmer 2s infinite;
          opacity: 0.2;
        }
        .glow {
          filter: drop-shadow(0 0 4px rgba(34, 211, 238, 0.5));
          text-shadow: 0 0 4px rgba(34, 211, 238, 0.5);
        }
      `}</style>

      {/* Main container - split with left side narrower */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 w-full mb-12 mt-[-5dvh]"> {/* Adjusted grid columns */}

        {/* Left side: System Configuration Summary - Vertical Layout */}
        <div className="flex flex-col lg:col-span-1"> {/* Adjusted column span */}
        <h2 className="text-3xl md:text-4xl font-light mb-8 md:mb-12 text-center " style={{color: "transparent"}}> .</h2>
          <div className="flex flex-col space-y-4"> {/* Changed back to vertical flex layout */}

            {/* System Size - Card */}
            <div className="bg-black/20 rounded-xl border border-white/10 p-4 flex items-center space-x-2 transition-all duration-300 ease-in-out "> {/* Adjusted background and border */}
              <Zap size={24} className="text-white icon-glow-white" />
              <div className="pl-3 pr-2 border-l border-white/20">
                <p className="text-xs text-gray-400 uppercase tracking-widest text-left">System Size</p>
                <p className="text-lg font-light text-white tabular-nums text-left">{systemSizeKw ? `${systemSizeKw.toFixed(2)} kW` : 'N/A'}</p>
              </div>
            </div>

            {/* Total Solar Panels - Card */}
            <div className="bg-black/20 rounded-xl border border-white/10 p-4 flex items-center space-x-2 transition-all duration-300 ease-in-out "> {/* Adjusted background and border */}
              <Sun size={24} className="text-white icon-glow-white" />
              <div className="pl-3 pr-2 border-l border-white/20">
                <p className="text-xs text-gray-400 uppercase tracking-widest text-left">Total Panels</p>
                <p className="text-lg font-light text-white tabular-nums text-left">{totalPanels !== undefined ? totalPanels : 'N/A'}</p>
              </div>
            </div>

            {/* Solar Panel Type - Card */}
            <div className="bg-black/20 rounded-xl border border-white/10 p-4 flex items-center space-x-2 transition-all duration-300 ease-in-out "> {/* Adjusted background and border */}
              <Sun size={24} className="text-white icon-glow-white" /> {/* Re-using Sun icon */}
              <div className="pl-3 pr-2 border-l border-white/20">
                <p className="text-xs text-gray-400 uppercase tracking-widest text-left">Panel Type</p>
                <p className="text-lg font-light text-white text-left">Black-on-Black 400W Panels</p>
              </div>
            </div>

            {/* Inverter Model - Card */}
            <div className="bg-black/20 rounded-xl border border-white/10 p-4 flex items-center space-x-2 transition-all duration-300 ease-in-out "> {/* Adjusted background and border */}
              <Cpu size={24} className="text-white icon-glow-white" />
              <div className="pl-3 pr-2 border-l border-white/20">
                <p className="text-xs text-gray-400 uppercase tracking-widest text-left">Inverter</p>
                <p className="text-lg font-light text-white text-left">{inverterModel || 'N/A'}</p>
              </div>
            </div>

            {/* Battery Selection - Card */}
            <div className="bg-black/20 rounded-xl border border-white/10 p-4 flex items-center space-x-2 transition-all duration-300 ease-in-out "> {/* Adjusted background and border */}
              <BatteryCharging size={24} className="text-white icon-glow-white" />
              <div className="pl-3 pr-2 border-l border-white/20">
                <p className="text-xs text-gray-400 uppercase tracking-widest text-left">Battery</p>
                <p className="text-lg font-light text-white text-left">{selectedBatteryDetails ? `${selectedBatteryDetails.shortName} (${batteryCount} selected)` : (batteryCount === 0 ? 'None selected' : 'N/A')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider for mobile view */}
        <div className="block lg:hidden w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-4"></div>

        {/* Divider for mobile view */}
        <div className="block lg:hidden w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-4"></div>

        {/* Right side: Payment Options */}
        <div className="flex flex-col lg:col-span-2"> {/* Adjusted column span */}
        <h2 className="text-3xl md:text-4xl font-light mb-8 md:mb-12 text-center">Choose Your Plan</h2>
          <div className={`flex flex-col space-y-4 lg:min-h-[560px] lg:justify-start ${isMobile ? 'pb-[100px]' : ''}`}> {/* Adjusted justify-start */}
            {/* Cash Option Card */}
            {financeOptions.map((option) => (
              <LoanOptionCard
                key={option.id}
                option={option}
                isSelected={selectedOption === option.id}
                onClick={() => handleOptionSelect(option.id)}
                loanAmount={cashPrice}
                dealerFee={option.dealerFee}
                pmtFactor={option.pmtFactor}
                useNewCalculation={true}
              />
            ))}
            {cashOption && (
              <CashPaymentCard
                option={cashOption}
                isSelected={selectedOption === cashOption.id}
                onClick={() => handleOptionSelect(cashOption.id)}
                cashPrice={cashPrice}
                className="w-full" // Adjusted width
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Stripe Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-7xl max-h-[90vh] overflow-auto stripe-modal rounded-3xl"
            >
              {/* Background glow effects */}
              <div className="absolute -inset-0 opacity-30 z-0">
                <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-orange-600 rounded-full filter blur-[120px]"></div>
                <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-600 rounded-full filter blur-[120px]"></div>
              </div>
              
              {/* Close button */}
              <button
                onClick={handleCheckoutCancel}
                className="absolute top-4 right-4 z-40 p-2 rounded-full   text-white/60 hover:text-white/80 transition-all"
              >
                <X size={24} />
              </button>
              
              {/* StripeCheckout component */}
              <StripeCheckout
                onCancel={handleCheckoutCancel}
                className="relative z-10 shadow-2xl shadow-purple-900/30 rounded-3xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverviewStep;