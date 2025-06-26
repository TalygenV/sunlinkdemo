import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
// import { motion } from 'framer-motion'; // optional for animations

// ChartJS registration
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// === Interfaces ===

export interface SeriesEntry {
  seriesId: number;
  fromDateTime: string;
  toDateTime: string;
  rate: number;
  qty: number;
  cost: number;
}

export interface Series {
  seriesId: number;
  cost: number;
  fromDateTime: string;
}

interface EnergyChartsProps {
  data: {
    series: Series[];
    seriesData: SeriesEntry[];
  };
}

export default function EnergyCharts({ data }: EnergyChartsProps) {
  const { series, seriesData } = data;
  const [selectedTab, setSelectedTab] = useState<'1y' | '25y'>('1y');
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [lifetimeData, setLifetimeData] = useState<any>(null);
  const [summary, setSummary] = useState<{
    firstYear?: { utility: string; solar: string; savings: string };
    lifetime?: { utility: string; solar: string; savings: string };
  }>({});

  useEffect(() => {
    if (!data) return;

    const monthLabels: string[] = [];
    const utilityCosts: number[] = [];
    const solarCosts: number[] = [];
    const netSavings: number[] = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let beforeSum = 0, afterSum = 0, solarSum = 0;

    for (let i = 0; i < 12; i++) {
      monthLabels.push(monthNames[i]);

      const before = seriesData.find(d => d.seriesId === 1 && new Date(d.fromDateTime).getMonth() === i);
      const after = seriesData.find(d => d.seriesId === 2 && new Date(d.fromDateTime).getMonth() === i);
      const solar = seriesData.find(d => d.seriesId === 3 && new Date(d.fromDateTime).getMonth() === i);

      const b = before?.cost || 0;
      const a = after?.cost || 0;
      const s = solar?.cost || 0;

      beforeSum += b;
      afterSum += a;
      solarSum += s;

      utilityCosts.push(a);
      solarCosts.push(s);
      netSavings.push(b - a - s);
    }

    // === Lifetime Data ===
    const years = seriesData
      .filter(d => d.seriesId === 5)
      .map(d => new Date(d.fromDateTime).getFullYear());

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    const lifetimeLabels: string[] = [];
    const lifetimeUtility: number[] = [];
    const lifetimeSolarData: number[] = [];
    const lifetimeNetSavings: number[] = [];

    for (let year = minYear; year <= maxYear; year++) {
      lifetimeLabels.push(year.toString());

      const before = seriesData.find(d => d.seriesId === 5 && d.fromDateTime.startsWith(`${year}`))?.cost || 0;
      const after = seriesData.find(d => d.seriesId === 6 && d.fromDateTime.startsWith(`${year}`))?.cost || 0;
      const solar = seriesData.find(d => d.seriesId === 7 && d.fromDateTime.startsWith(`${year}`))?.cost || 0;

      lifetimeUtility.push(after);
      lifetimeSolarData.push(solar);
      lifetimeNetSavings.push(before - after - solar);
    }

    const lifetimeBefore = series.find(s => s.seriesId === 5)?.cost || 0;
    const lifetimeAfter = series.find(s => s.seriesId === 6)?.cost || 0;
    const lifetimeSolar = series.find(s => s.seriesId === 7)?.cost || 0;
    const lifetimeSavings = lifetimeBefore - lifetimeAfter - lifetimeSolar;

    setMonthlyData({
      labels: monthLabels,
      datasets: [
        { label: 'Utility Cost', data: utilityCosts, backgroundColor: '#333' },
        { label: 'Solar Cost', data: solarCosts, backgroundColor: '#f4c542' },
        { label: 'Net Savings', data: netSavings, backgroundColor: '#C084FC' },
      ]
    });

    setLifetimeData({
      labels: lifetimeLabels,
      datasets: [
        { label: 'Utility Cost', data: lifetimeUtility, backgroundColor: '#333' },
        { label: 'Solar Cost', data: lifetimeSolarData, backgroundColor: '#f4c542' },
        { label: 'Net Savings', data: lifetimeNetSavings, backgroundColor: "#C084FC" },
      ]
    });

    setSummary({
      firstYear: {
        utility: afterSum.toFixed(0),
        solar: solarSum.toFixed(0),
        savings: (beforeSum - afterSum - solarSum).toFixed(0)
      },
      lifetime: {
        utility: lifetimeAfter.toLocaleString(),
        solar: lifetimeSolar.toLocaleString(),
        savings: lifetimeSavings.toLocaleString()
      }
    });
  }, [data]);

  const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false, // 👈 allow custom height
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    x: { stacked: true },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Cost in USD',
      },
    },
  },
};

  const is1Y = selectedTab === '1y';

  return (
    <div className="w-full max-w-5xl mx-auto mb-12">
      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-white/10 rounded-full p-1 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
          {['1y', '25y'].map((key) => {
            const isActive = key === selectedTab;
            return (
              <button
                key={key}
                onClick={() => setSelectedTab(key as '1y' | '25y')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-400 to-accent-400 text-white shadow-[0_0_20px_rgba(192,132,252,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {key === '1y' ? '1-Year' : 'Lifetime (25-Year)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {(is1Y ? monthlyData : lifetimeData) && (
        // <motion.div key={selectedTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="w-full h-[20vh]">

           <Bar
    data={is1Y ? monthlyData : lifetimeData}
    options={{
      ...chartOptions,
      maintainAspectRatio: false, // 👈 Important!
    }}
  />
          </div>
        // </motion.div>
      )}

      {/* Summary Cards */}
      {summary.firstYear && summary.lifetime && (
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
          <div className="bg-white/10 px-4 py-2 rounded text-white shadow">
            Utility: ${is1Y ? summary.firstYear.utility : summary.lifetime.utility}
          </div>
          <div className="bg-yellow-300 text-black px-4 py-2 rounded shadow">
            Solar: ${is1Y ? summary.firstYear.solar : summary.lifetime.solar}
          </div>
          <div className="bg-sky-400 text-black px-4 py-2 rounded shadow" style={{ backgroundColor: '#C084FC' }}>
            Net Savings: ${is1Y ? summary.firstYear.savings : summary.lifetime.savings}
          </div>
        </div>
      )}
    </div>
  );
}
