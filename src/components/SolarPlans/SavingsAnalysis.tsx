import React, { useState, useEffect } from 'react';
import { LineChart, TrendingUpIcon, BarChart4Icon, LeafIcon } from 'lucide-react';
import { Plan } from '../../types';
import { calculateSavings } from '../utils/calculations';

interface SavingsAnalysisProps {
  selectedPlanId: string;
  plans: Plan[];
  showTaxCredit: boolean;
}

const SavingsAnalysis: React.FC<SavingsAnalysisProps> = ({ 
  selectedPlanId, 
  plans,
  showTaxCredit
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'chart'>('details');
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId) || plans[0];
  
  const [savings, setSavings] = useState({
    fiveYear: 0,
    tenYear: 0,
    twentyYear: 0,
    thirtyYear: 0,
    breakEvenYear: 0
  });
  
  useEffect(() => {
    const newSavings = calculateSavings(selectedPlan, showTaxCredit);
    setSavings(newSavings);
  }, [selectedPlan, showTaxCredit]);

  const chartData = Array.from({ length: 31 }, (_, i) => ({
    year: i,
    savings: calculateSavings(selectedPlan, showTaxCredit, i).thirtyYear * (i / 30),
    costs: selectedPlan.type === 'loan' ? selectedPlan.amount * 12 * Math.min(i, parseInt(selectedPlan.term)) : i === 0 ? selectedPlan.amount : 0
  }));

  // Calculate environmental impact based on 30-year energy production
  const annualProduction = 16200; // kWh per year
  const thirtyYearProduction = annualProduction * 30;
  const co2Reduction = thirtyYearProduction * 0.855; // lbs of CO2 per kWh
  const treesEquivalent = co2Reduction / 48; // Each tree absorbs ~48 lbs of CO2 per year
  const gasEmissionsAvoided = co2Reduction / 19.6; // 19.6 lbs of CO2 per gallon of gas
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">30-Year Savings Analysis</h2>
        <div className="flex bg-slate-700 rounded-lg p-1">
          <button 
            className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
              activeTab === 'details' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('details')}
          >
            <BarChart4Icon size={16} />
            <span>Details</span>
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
              activeTab === 'chart' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('chart')}
          >
            <LineChart size={16} />
            <span>Chart</span>
          </button>
        </div>
      </div>
      
      {activeTab === 'details' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUpIcon className="text-green-500" size={20} />
                <span>Cumulative Savings</span>
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">5-Year Savings:</span>
                  <span className="font-bold text-white">${savings.fiveYear.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">10-Year Savings:</span>
                  <span className="font-bold text-white">${savings.tenYear.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">20-Year Savings:</span>
                  <span className="font-bold text-white">${savings.twentyYear.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">30-Year Savings:</span>
                  <span className="font-bold text-green-400 text-xl">${savings.thirtyYear.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Break-even Point:</span>
                    <span className="font-bold text-yellow-400">Year {savings.breakEvenYear}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Savings Factors</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300">Average Monthly Electric Bill:</span>
                    <span className="font-bold text-white">$400</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300">Estimated Solar Coverage:</span>
                    <span className="font-bold text-white">92%</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300">Electric Rate Inflation:</span>
                    <span className="font-bold text-white">3.5% per year</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-600">
                  <p className="text-sm text-slate-400">
                    These calculations are based on your current energy usage, local utility rates, and historical data on electricity price increases.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LeafIcon className="text-green-500" size={20} />
              <span>Environmental Impact</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {Math.round(co2Reduction).toLocaleString()}
                </div>
                <div className="text-sm text-slate-300">
                  Pounds of CO₂ Emissions Avoided
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {Math.round(treesEquivalent).toLocaleString()}
                </div>
                <div className="text-sm text-slate-300">
                  Equivalent Trees Planted
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {Math.round(gasEmissionsAvoided).toLocaleString()}
                </div>
                <div className="text-sm text-slate-300">
                  Gallons of Gas Emissions Avoided
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-4 text-center">
              Based on {Math.round(thirtyYearProduction).toLocaleString()} kWh of clean energy production over 30 years
            </p>
          </div>
        </div>
      )}
      
      {activeTab === 'chart' && (
        <div className="h-64 relative">
          <div className="absolute inset-0">
            <div className="w-full h-full flex">
              <div className="w-16 h-full flex flex-col justify-between pr-2 text-right text-xs text-slate-400">
                <span>${Math.round(savings.thirtyYear / 1000)}k</span>
                <span>${Math.round(savings.thirtyYear * 0.75 / 1000)}k</span>
                <span>${Math.round(savings.thirtyYear * 0.5 / 1000)}k</span>
                <span>${Math.round(savings.thirtyYear * 0.25 / 1000)}k</span>
                <span>$0</span>
              </div>
              
              <div className="flex-1 h-full flex flex-col">
                <div className="flex-1 border-b border-slate-700 border-dashed"></div>
                <div className="flex-1 border-b border-slate-700 border-dashed"></div>
                <div className="flex-1 border-b border-slate-700 border-dashed"></div>
                <div className="flex-1 border-b border-slate-700 border-dashed"></div>
                
                <div className="absolute left-16 right-0 top-0 bottom-16">
                  <svg className="w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none">
                    <path 
                      d={`M0,200 ${chartData.map((point, i) => `L${(i * 300) / 30},${200 - (point.costs * 200 / savings.thirtyYear)}`).join(' ')} L300,200 Z`} 
                      fill="rgba(239, 68, 68, 0.2)" 
                      stroke="rgb(239, 68, 68)" 
                      strokeWidth="1.5"
                    />
                  </svg>
                  
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 300 200" preserveAspectRatio="none">
                    <path 
                      d={`M0,200 ${chartData.map((point, i) => `L${(i * 300) / 30},${200 - (point.savings * 200 / savings.thirtyYear)}`).join(' ')} L300,200 Z`} 
                      fill="rgba(34, 197, 94, 0.2)" 
                      stroke="rgb(34, 197, 94)" 
                      strokeWidth="1.5"
                    />
                  </svg>
                  
                  {savings.breakEvenYear > 0 && (
                    <div 
                      className="absolute w-0.5 bg-yellow-500 h-full" 
                      style={{ left: `${(savings.breakEvenYear * 100) / 30}%` }}
                    >
                      <div className="absolute top-0 -left-16 bg-yellow-500/90 text-white text-xs px-2 py-1 rounded">
                        Break-even: Year {savings.breakEvenYear}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="h-16 flex justify-between items-center text-xs text-slate-400 pt-2">
                  {[0, 5, 10, 15, 20, 25, 30].map(year => (
                    <span key={year} className="flex-1 text-center">Year {year}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsAnalysis;