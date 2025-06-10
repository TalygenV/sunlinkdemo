import React from 'react';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';

const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    console.warn("Invalid amount passed to formatCurrency:", amount);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(0);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericAmount);
};

// Traditional loan calculation method
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

// New loan calculation method using dealerFee and pmtFactor
const calculateLoanPayment = (cashPrice, dealerFee, pmtFactor) => {
  const numericCashPrice = Number(cashPrice);
  if (isNaN(numericCashPrice) || numericCashPrice <= 0 || dealerFee >= 1 || pmtFactor <= 0) {
    return 0;
  }
  const financedAmount = numericCashPrice / (1 - dealerFee);
  return financedAmount * pmtFactor;
};

const LoanOptionCard = ({
  option,
  isSelected,
  onClick,
  loanAmount,
  dealerFee,
  pmtFactor,
  useNewCalculation = false,
  isBestOption = false
}) => {
  // Use the new calculation method if specified and dealerFee/pmtFactor are provided
  const monthlyPayment = useNewCalculation && dealerFee !== undefined && pmtFactor !== undefined
    ? calculateLoanPayment(loanAmount, dealerFee, pmtFactor)
    : calculateMonthlyPayment(loanAmount, option.annualRate, option.termYears);

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden group
        bg-black/30 rounded-xl border border-white/10 p-4 transition-all duration-300 ease-in-out cursor-pointer hover:border-white/20
        ${isSelected
          ? 'border-indigo-400 ring-2 ring-indigo-400'
          : ''}
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 text-indigo-400">
          <CheckCircle size={20} strokeWidth={2.5} />
        </div>
      )}

      {/* Header with icon and label */}
      <div className="flex items-center space-x-3 mb-2">
        <TrendingUp size={28} className={`${isSelected ? 'text-indigo-400' : 'text-indigo-500'}`} />
        <div className="pl-3 border-l border-white/20">
          <p className="text-sm text-gray-400 uppercase tracking-widest">{option.label}</p>
        </div>
      </div>
      
      {/* Monthly payment - centered and prominent */}
      <div className="flex justify-center items-center mt-1 mb-2">
        <p className={`text-2xl md:text-3xl lg:text-4xl font-semibold text-white tabular-nums ${isSelected ? 'text-white' : 'text-white'}`}>
          {formatCurrency(monthlyPayment)}
          <span className="text-sm md:text-base font-normal text-gray-400 ml-1">/ mo</span>
        </p>
      </div>
      
      {/* APR and term info at bottom */}
      <div className="flex justify-center">
        <p className={`text-sm ${isSelected ? 'text-indigo-400' : 'text-indigo-400/90'}`}>
          {option.annualRate}% APR for {option.termYears} years
        </p>
      </div>
    </div>
  );
};

export default LoanOptionCard; 