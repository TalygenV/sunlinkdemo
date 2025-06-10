import React from 'react';
import { FileText, Shield, PenTool as Tool, Calendar, CheckCircle } from 'lucide-react';

const InstallerContract: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Home Improvement Contract</h1>
          <p className="text-slate-300">Review your solar installation agreement and warranties</p>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="text-blue-400" />
              Contract Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400">Contract Number</p>
                  <p className="font-semibold">#SOL-2025-0123</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400">Installation Address</p>
                  <p className="font-semibold">123 Solar Street, Sunnyville, CA 92123</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="text-green-400" />
              Warranties & Guarantees
            </h2>
            <div className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Production Guarantee</h3>
                <p className="text-slate-300">We guarantee your system will produce at least 92% of the estimated annual production or we'll pay you the difference.</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Workmanship Warranty</h3>
                <p className="text-slate-300">25-year comprehensive warranty covering all aspects of the installation, including roof penetrations and mounting hardware.</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Equipment Warranties</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Solar Panels: 25-year product and performance warranty</li>
                  <li>• Inverter: 25-year warranty</li>
                  <li>• Battery: 10-year warranty</li>
                  <li>• Mounting System: 25-year warranty</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tool className="text-amber-400" />
              Installation Timeline
            </h2>
            <div className="space-y-4">
              <div className="relative pl-8 pb-8 border-l-2 border-slate-700 last:border-0">
                <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500"></div>
                <h3 className="font-semibold">Site Survey & Design</h3>
                <p className="text-slate-300">Completed within 7 days</p>
              </div>
              <div className="relative pl-8 pb-8 border-l-2 border-slate-700 last:border-0">
                <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500"></div>
                <h3 className="font-semibold">Permitting</h3>
                <p className="text-slate-300">2-3 weeks processing time</p>
              </div>
              <div className="relative pl-8 pb-8 border-l-2 border-slate-700 last:border-0">
                <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500"></div>
                <h3 className="font-semibold">Installation</h3>
                <p className="text-slate-300">1-2 days for installation</p>
              </div>
              <div className="relative pl-8">
                <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500"></div>
                <h3 className="font-semibold">Final Inspection & Activation</h3>
                <p className="text-slate-300">Within 1 week of installation</p>
              </div>
            </div>
          </section>

          <div className="flex justify-center pt-8">
            <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-medium flex items-center gap-2 transition-colors">
              <CheckCircle size={20} />
              Accept & Sign Contract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallerContract;