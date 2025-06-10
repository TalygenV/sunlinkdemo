import React from 'react';
import { TrendingUpIcon, DollarSignIcon } from 'lucide-react';
import { Plan } from '../../types';

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  showTaxCredit: boolean;
  onClick: () => void;
  onPreQualify?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ 
  plan, 
  isSelected, 
  showTaxCredit,
  onClick,
  onPreQualify
}) => {
  const getIconByType = () => {
    switch (plan.type) {
      case 'loan':
        return <TrendingUpIcon className="text-blue-400\" size={20} />;
      case 'cash':
        return <DollarSignIcon className="text-green-500" size={20} />;
      default:
        return <TrendingUpIcon className="text-blue-400" size={20} />;
    }
  };

  const displayAmount = showTaxCredit && plan.amountWithTaxCredit 
    ? plan.amountWithTaxCredit 
    : plan.amount;

  return (
    <div 
      className={`rounded-lg p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
        isSelected 
          ? 'bg-blue-900/30 border-2 border-blue-500 shadow-lg shadow-blue-900/20' 
          : 'bg-slate-800/50 border border-slate-700 hover:border-slate-500'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
          {getIconByType()}
        </div>
        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">
          {plan.title}
        </h3>
      </div>
      
      <div className="mb-2">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">${displayAmount.toLocaleString()}</span>
          {plan.type === 'loan' && <span className="text-sm text-slate-400 ml-1">/mo</span>}
        </div>
        
        {plan.type === 'loan' && (
          <div className="text-sm text-blue-400 mt-1">
            {plan.interestRate} for {plan.term} years
          </div>
        )}
        
        {plan.type === 'cash' && plan.downPayment && (
          <div className="text-sm text-slate-400 mt-1">
            ${plan.downPayment.toLocaleString()} down payment
          </div>
        )}
      </div>
      
      <div className="mt-4">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-green-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <span className="text-sm text-slate-300">{feature}</span>
          </div>
        ))}
      </div>
      
      {isSelected && (
        <div className="mt-4 space-y-3">
          <div className="text-center">
            <span className="text-xs font-medium bg-blue-500/20 text-blue-300 py-1 px-3 rounded-full">
              Selected
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreQualify?.();
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            {plan.type === 'loan' ? 'Pre-qualify Now' : 'Pay 50% Down Payment'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanCard;