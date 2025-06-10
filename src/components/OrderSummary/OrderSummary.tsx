import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Truck, Calendar, PenTool as Tool, ArrowRight, FileText } from 'lucide-react';

const OrderSummary: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const quoteData = JSON.parse(localStorage.getItem('quoteData') || '{}');

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/installer-contract');
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Order Summary</h1>
          <p className="text-slate-300">Review your solar system configuration and confirm your order</p>
        </div>

        <div className="space-y-8">
          {/* System Configuration */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4">System Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400">System Size</div>
                  <div className="font-semibold">{quoteData.systemSize} kW</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Solar Panels</div>
                  <div className="font-semibold">30 × 400W Premium Panels</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Battery Storage</div>
                  <div className="font-semibold">
                    {quoteData.batteryCount ? `${quoteData.batteryCount} × 10kWh Battery` : 'Not Selected'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Roof Replacement</div>
                  <div className="font-semibold">
                    {quoteData.includeRoof ? 'Included' : 'Not Selected'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">EV Charger</div>
                  <div className="font-semibold">
                    {quoteData.includeEvCharger ? 'Level 2 Charger Included' : 'Not Selected'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400">Installation Address</div>
                  <div className="font-semibold">
                    {quoteData.address}<br />
                    {quoteData.city}, {quoteData.state} {quoteData.zipCode}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Customer Name</div>
                  <div className="font-semibold">
                    {quoteData.firstName} {quoteData.lastName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Installation Timeline */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-6">Installation Timeline</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <FileText className="text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Documentation & Permits</h3>
                  <p className="text-sm text-slate-400">1-2 weeks</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Tool className="text-amber-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Installation</h3>
                  <p className="text-sm text-slate-400">2-3 days</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Inspection & Activation</h3>
                  <p className="text-sm text-slate-400">1-2 weeks after installation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-6">Next Steps</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Review & Sign Contract</h3>
                  <p className="text-sm text-slate-400">
                    After submitting your order, you'll review and sign the installation contract
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">Site Survey</h3>
                  <p className="text-sm text-slate-400">
                    Our team will schedule a detailed site survey within 3-5 business days
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Permitting Process</h3>
                  <p className="text-sm text-slate-400">
                    We'll handle all necessary permits and utility paperwork
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Order Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="tesla-button"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Processing...
                </>
              ) : (
                <>
                  Submit Order
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;