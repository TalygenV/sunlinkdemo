import { Plan, SavingsData } from '../types';

export const calculateSavings = (plan: Plan, showTaxCredit: boolean, yearOverride?: number): SavingsData => {
  // Base assumptions
  const monthlyElectricBill = 400;
  const coveragePercent = 0.92;
  const electricRateInflation = 0.045; // Updated to 4.5% annual increase
  
  // Monthly savings from solar (without loan payment)
  const baseMonthlySavings = monthlyElectricBill * coveragePercent;
  
  // Initial system cost (after tax credit if applicable)
  const systemCost = plan.type === 'cash' 
    ? (showTaxCredit ? plan.amountWithTaxCredit || plan.amount : plan.amount)
    : 0;
  
  // Monthly payment for loans
  const monthlyPayment = plan.type === 'loan' ? plan.amount : 0;
  const loanTerm = plan.type === 'loan' ? parseInt(plan.term || '0') : 0;
  
  // Calculate year by year
  let totalCost = systemCost;
  let totalSavings = 0;
  let breakEvenYear = 0;
  let currentMonthlySavings = baseMonthlySavings;
  const maxYear = yearOverride !== undefined ? yearOverride : 30;
  
  for (let year = 1; year <= maxYear; year++) {
    // In loan scenarios, add loan payments to cost
    if (plan.type === 'loan' && year <= loanTerm) {
      totalCost += monthlyPayment * 12;
    }
    
    // Add savings for this year
    totalSavings += currentMonthlySavings * 12;
    
    // Check for break-even
    if (breakEvenYear === 0 && totalSavings >= totalCost) {
      breakEvenYear = year;
    }
    
    // Increase savings for next year due to electric rate inflation
    currentMonthlySavings *= (1 + electricRateInflation);
  }
  
  return {
    fiveYear: Math.round(calculateSavingsForPeriod(plan, showTaxCredit, 5)),
    tenYear: Math.round(calculateSavingsForPeriod(plan, showTaxCredit, 10)),
    twentyYear: Math.round(calculateSavingsForPeriod(plan, showTaxCredit, 20)),
    thirtyYear: Math.round(totalSavings - totalCost),
    breakEvenYear
  };
};

const calculateSavingsForPeriod = (plan: Plan, showTaxCredit: boolean, years: number): number => {
  // Base assumptions
  const monthlyElectricBill = 400;
  const coveragePercent = 0.92;
  const electricRateInflation = 0.045; // Updated to 4.5% annual increase
  
  // Monthly savings from solar (without loan payment)
  const baseMonthlySavings = monthlyElectricBill * coveragePercent;
  
  // Initial system cost (after tax credit if applicable)
  const systemCost = plan.type === 'cash' 
    ? (showTaxCredit ? plan.amountWithTaxCredit || plan.amount : plan.amount)
    : 0;
  
  // Monthly payment for loans
  const monthlyPayment = plan.type === 'loan' ? plan.amount : 0;
  const loanTerm = plan.type === 'loan' ? parseInt(plan.term || '0') : 0;
  
  // Calculate savings for the period
  let totalCost = systemCost;
  let totalSavings = 0;
  let currentMonthlySavings = baseMonthlySavings;
  
  for (let year = 1; year <= years; year++) {
    // In loan scenarios, add loan payments to cost
    if (plan.type === 'loan' && year <= loanTerm) {
      totalCost += monthlyPayment * 12;
    }
    
    // Add savings for this year
    totalSavings += currentMonthlySavings * 12;
    
    // Increase savings for next year due to electric rate inflation
    currentMonthlySavings *= (1 + electricRateInflation);
  }
  
  return totalSavings - totalCost;
};