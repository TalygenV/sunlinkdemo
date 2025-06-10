import { Plan } from '../../types';

export const plans: Plan[] = [
  {
    id: 'loan-25',
    type: 'loan',
    title: '25 Year Loan',
    term: '25',
    interestRate: '3.99% APR',
    amount: 142,
    amountWithTaxCredit: 99,
    features: [
      'Lowest monthly payment',
      'Long-term financing option',
      'Zero down payment',
      'No prepayment penalties'
    ],
    monthlySavings: 400 * 0.92 - 142
  },
  {
    id: 'loan-15',
    type: 'loan',
    title: '15 Year Loan',
    term: '15',
    interestRate: '3.99% APR',
    amount: 192,
    amountWithTaxCredit: 134,
    features: [
      'Balanced monthly payment',
      'Medium-term financing',
      'Zero down payment',
      'Faster equity building'
    ],
    monthlySavings: 400 * 0.92 - 192
  },
  {
    id: 'loan-10',
    type: 'loan',
    title: '10 Year Loan',
    term: '10',
    interestRate: '3.99% APR',
    amount: 249,
    amountWithTaxCredit: 174,
    features: [
      'Higher monthly payment',
      'Shorter-term financing',
      'Zero down payment',
      'Lowest total interest paid'
    ],
    monthlySavings: 400 * 0.92 - 249
  },
  {
    id: 'cash',
    type: 'cash',
    title: 'Cash Payment',
    amount: 24000,
    amountWithTaxCredit: 16800,
    downPayment: 12000,
    features: [
      '50% down payment',
      '50% at installation',
      'Maximum lifetime savings',
      'Immediate system ownership'
    ],
    monthlySavings: 400 * 0.92
  }
];