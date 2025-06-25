import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  PlugIcon as EvPlugIcon,
  HomeIcon,
  InfoIcon,
  MinusIcon,
  PlusIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { plans } from "../data/solarPlans";
import { systemSpecs } from "../data/systemSpecs";
import StripeCheckout from "../design/StripeCheckout";
import PreQualifyModal from "./PreQualifyModal";
import SavingsAnalysis from "./SavingsAnalysis";
import SystemSpecs from "./SystemSpecs";
import { GenabilityData } from "../../types";
import { getFunctions, httpsCallable } from "firebase/functions";

interface PlanSelectionProps {
  initialSystemSize: number; // in kW
  initialBatteryCount: number;
  genabilityData?: GenabilityData; // Add Genability data prop
}

function PlanSelection({
  initialSystemSize,
  initialBatteryCount,
  genabilityData,
}: PlanSelectionProps) {
  const [showTaxCredit, setShowTaxCredit] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(plans[0].id);
  const [batteryCount, setBatteryCount] = useState(initialBatteryCount);
  const [includeRoof, setIncludeRoof] = useState(false);
  const [includeEvCharger, setIncludeEvCharger] = useState(false);
  const [showPreQualifyModal, setShowPreQualifyModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [mosaicProducts, setMosaicProducts] = useState<any[]>([]);
  const [selectedMosaicProduct, setSelectedMosaicProduct] = useState<
    any | null
  >(null);
  const [mosaicLoading, setMosaicLoading] = useState(false);
  const [mosaicEstimate, setMosaicEstimate] = useState<any>(null);

  // Calculate total cost
  const costPerKW = 2000;
  const baseSystemCost = costPerKW * initialSystemSize;
  const batteryPrice = 12000;
  const roofReplacementCost = 15000;
  const evChargerCost = 1500;
  const totalBatteryCost = batteryPrice * batteryCount;

  // Calculate tax credit only on solar, battery, and EV charger components
  const solarBatteryEvCost =
    baseSystemCost + totalBatteryCost + (includeEvCharger ? evChargerCost : 0);
  const taxCreditAmount = showTaxCredit ? solarBatteryEvCost * 0.3 : 0;

  // Total cost including roof if selected
  const totalCost =
    solarBatteryEvCost + (includeRoof ? roofReplacementCost : 0);
  const costAfterTaxCredit = totalCost - taxCreditAmount;

  // Calculate savings based on Genability data
  const calculateSavings = () => {
    if (!genabilityData) return null;

    const monthlySavings = genabilityData.estimatedAnnualSavings / 12;
    const yearlySavings = genabilityData.estimatedAnnualSavings;
    const lifetimeSavings = yearlySavings * 25; // Assuming 25-year system lifetime

    return {
      monthly: monthlySavings,
      yearly: yearlySavings,
      lifetime: lifetimeSavings,
      utilityRate: genabilityData.pricePerKwh,
      utilityName: genabilityData.utilityName,
    };
  };

  const savings = calculateSavings();

  useEffect(() => {
    const defaultQuoteData = {
      firstName: "", // populate as needed
      lastName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      monthlyBill: "", // preserved from earlier steps if stored
      systemSize: initialSystemSize,
      planType: "solar",
      batteryCount: initialBatteryCount,
      includeRoof,
      includeEvCharger,
    };
    localStorage.setItem("quoteData", JSON.stringify(defaultQuoteData));
  }, [initialSystemSize, initialBatteryCount, includeRoof, includeEvCharger]);

  // Fetch Mosaic loan products on mount
  useEffect(() => {
    async function fetchProducts() {
      setMosaicLoading(true);
      try {
        const functions = getFunctions();
        const getMosaicLoanProducts = httpsCallable(
          functions,
          "getMosaicLoanProducts"
        );
        const result: any = await getMosaicLoanProducts();
        if (result.data.success) {
          setMosaicProducts(result.data.products);
        } else {
          setMosaicProducts([]);
        }
      } catch (err) {
        setMosaicProducts([]);
      } finally {
        setMosaicLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Fetch payment estimate when a Mosaic product is selected
  useEffect(() => {
    if (!selectedMosaicProduct) return;
    async function fetchEstimate() {
      setMosaicLoading(true);
      try {
        const functions = getFunctions();
        const getMosaicPaymentEstimate = httpsCallable(
          functions,
          "getMosaicPaymentEstimate"
        );
        const result: any = await getMosaicPaymentEstimate({
          productId: selectedMosaicProduct.id,
          amount: showTaxCredit ? costAfterTaxCredit : totalCost,
        });
        if (result.data.success) {
          setMosaicEstimate(result.data.estimate);
        } else {
          setMosaicEstimate(null);
        }
      } catch (err) {
        setMosaicEstimate(null);
      } finally {
        setMosaicLoading(false);
      }
    }
    fetchEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMosaicProduct, showTaxCredit, costAfterTaxCredit, totalCost]);

  const handlePreQualify = () => {
    const selectedPlanDetails = plans.find((p) => p.id === selectedPlan);
    if (selectedPlanDetails?.type === "cash") {
      setShowStripeCheckout(true);
    } else {
      setShowPreQualifyModal(true);
    }
  };

  const handleStripeSuccess = () => {
    setShowStripeCheckout(false);
    // You can add additional success handling here
  };

  const handleStripeCancel = () => {
    setShowStripeCheckout(false);
  };

  const adjustedPlans = plans.map((plan) => {
    const basePlanAmount =
      plan.type === "cash"
        ? baseSystemCost +
          totalBatteryCost +
          (includeEvCharger ? evChargerCost : 0)
        : plan.amount *
          (1 +
            (totalBatteryCost + (includeEvCharger ? evChargerCost : 0)) /
              baseSystemCost);

    const totalPlanAmount = includeRoof
      ? plan.type === "cash"
        ? basePlanAmount + roofReplacementCost
        : Math.round(
            basePlanAmount * (1 + roofReplacementCost / baseSystemCost)
          )
      : Math.round(basePlanAmount);

    // Apply tax credit only to solar, battery, and EV charger portion
    const taxCreditAdjustment = showTaxCredit ? solarBatteryEvCost * 0.3 : 0;
    const amountAfterTaxCredit =
      plan.type === "cash"
        ? totalPlanAmount - taxCreditAdjustment
        : Math.round(
            plan.amount *
              (1 - 0.3) *
              (1 +
                (totalBatteryCost + (includeEvCharger ? evChargerCost : 0)) /
                  baseSystemCost)
          );

    return {
      ...plan,
      amount: totalPlanAmount,
      amountWithTaxCredit: amountAfterTaxCredit,
    };
  });

  const selectedPlanDetails = adjustedPlans.find((p) => p.id === selectedPlan);

  // Create order summary data
  const orderSummary = {
    systemDetails: {
      baseSystemCost,
      batteryCount,
      totalBatteryCost,
      includeRoof,
      roofReplacementCost,
      includeEvCharger,
      evChargerCost,
      totalCost,
      taxCreditAmount,
      costAfterTaxCredit,
    },
    selectedPlan: selectedPlanDetails,
    customerInfo: {
      name: auth.currentUser?.displayName || "Solar Customer",
      email: auth.currentUser?.email || "",
    },
  };

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
        Choose Your Solar Plan
      </h1>

      <div className="bg-slate-800/50 rounded-xl p-4 mb-8 border border-slate-700">
        <SystemSpecs specs={systemSpecs} batteryCount={batteryCount} />
      </div>

      {/* Add Savings Analysis Section */}
      {savings && (
        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUpIcon className="text-green-400" size={24} />
            <h2 className="text-2xl font-bold text-white">
              Your Savings Analysis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="text-slate-400 mb-1">Monthly Savings</div>
              <div className="text-2xl font-bold text-green-400">
                $
                {savings.monthly.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="text-slate-400 mb-1">Yearly Savings</div>
              <div className="text-2xl font-bold text-green-400">
                $
                {savings.yearly.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="text-slate-400 mb-1">25-Year Savings</div>
              <div className="text-2xl font-bold text-green-400">
                $
                {savings.lifetime.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-400">
            Based on your current utility rate of $
            {savings.utilityRate.toFixed(2)}/kWh with {savings.utilityName}
          </div>
        </div>
      )}

      

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold">System Price & Payment Options</h2>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div>
                <div className="text-slate-300 mb-1">Total System Cost</div>
                <div className="text-3xl font-bold">
                  ${totalCost.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`text-green-400 mb-1 ${
                      !showTaxCredit && "opacity-50"
                    }`}
                  >
                    30% Federal Tax Credit
                  </div>
                  <button
                    onClick={() => setShowEligibilityModal(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <InfoIcon size={16} />
                  </button>
                </div>
                <div
                  className={`text-2xl font-bold text-green-400 ${
                    !showTaxCredit && "opacity-50"
                  }`}
                >
                  -${taxCreditAmount.toLocaleString()}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="text-blue-400 mb-1">
                  Final Cost {showTaxCredit ? "After Tax Credit" : ""}
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  $
                  {(showTaxCredit
                    ? costAfterTaxCredit
                    : totalCost
                  ).toLocaleString()}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">
                    Battery Storage
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setBatteryCount(Math.max(0, batteryCount - 1))
                      }
                      className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                      disabled={batteryCount === 0}
                    >
                      <MinusIcon
                        size={16}
                        className={batteryCount === 0 ? "opacity-50" : ""}
                      />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {batteryCount}
                    </span>
                    <button
                      onClick={() => setBatteryCount(batteryCount + 1)}
                      className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                  <span className="text-sm text-slate-400">
                    (+${(batteryPrice * batteryCount).toLocaleString()})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">
                    Roof Replacement
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={includeRoof}
                      onChange={() => setIncludeRoof(!includeRoof)}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                  <span className="text-sm text-slate-400">(+$15,000)</span>
                  <InfoIcon
                    size={16}
                    className="text-blue-400 cursor-help"
                    aria-label="Includes complete roof replacement with 30-year architectural shingles and upgraded underlayment"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">
                    EV Charger Installation
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={includeEvCharger}
                      onChange={() => setIncludeEvCharger(!includeEvCharger)}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                  <span className="text-sm text-slate-400">(+$1,500)</span>
                  <span title="Level 2 EV charger with professional installation">
                    <InfoIcon size={16} className="text-blue-400 cursor-help" />
                  </span>
                  <InfoIcon
                    size={16}
                    className="text-blue-400 cursor-help"
                    aria-label="Level 2 EV charger with professional installation"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">
                    Include Federal Tax Credit
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={showTaxCredit}
                      onChange={() => setShowTaxCredit(!showTaxCredit)}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                {includeRoof && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HomeIcon size={18} className="text-blue-400" />
                      <span className="font-medium">
                        Roof Replacement Includes:
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        30-year architectural shingles
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Premium underlayment & ice barrier
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Complete tear-off & disposal
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        25-year workmanship warranty
                      </li>
                    </ul>
                  </div>
                )}

                {includeEvCharger && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <EvPlugIcon size={18} className="text-blue-400" />
                      <span className="font-medium">
                        EV Charger Package Includes:
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Level 2 (240V) charging station
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Professional installation
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Electrical panel upgrades if needed
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        3-year warranty
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adjustedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                      selectedPlan === plan.id
                        ? "bg-blue-900/30 border-2 border-blue-500"
                        : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{plan.title}</h3>
                      {selectedPlan === plan.id && (
                        <CheckIcon size={18} className="text-blue-400" />
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          $
                          {(showTaxCredit
                            ? plan.amountWithTaxCredit
                            : plan.amount
                          ).toLocaleString()}
                        </span>
                        {plan.type === "loan" && (
                          <span className="text-sm text-slate-400">/mo</span>
                        )}
                      </div>
                      {plan.type === "loan" && (
                        <div className="text-sm text-blue-400 mt-1">
                          {plan.interestRate} for {plan.term} years
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-slate-300"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {selectedPlan === plan.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreQualify();
                        }}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        {plan.type === "loan"
                          ? "Pre-qualify Now"
                          : "Pay $500 Deposit"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 mb-10 border border-slate-700 animate-fadeIn">
        <SavingsAnalysis
          selectedPlanId={selectedPlan}
          plans={adjustedPlans}
          showTaxCredit={showTaxCredit}
        />
      </div>

      <PreQualifyModal
        isOpen={showPreQualifyModal}
        onClose={() => setShowPreQualifyModal(false)}
        planType={selectedPlanDetails?.title || ""}
      />

      <Dialog.Root
        open={showEligibilityModal}
        onOpenChange={setShowEligibilityModal}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg bg-slate-900 rounded-xl shadow-xl border border-slate-700">
            <div className="p-6">
              <Dialog.Title className="text-xl font-bold mb-4">
                Solar Tax Credit Eligibility
              </Dialog.Title>

              <div className="space-y-4">
                <p className="text-slate-300">
                  The federal solar tax credit, also known as the Investment Tax
                  Credit (ITC), allows you to deduct 30% of the cost of
                  installing a solar energy system from your federal taxes. This
                  credit also applies to battery storage and EV charger
                  installations when purchased with solar.
                </p>

                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    You may be eligible if:
                  </h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      You own your home
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      You have sufficient tax liability
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Your system is installed between 2022 and 2032
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      This is the original installation of the solar system
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    Note: The tax credit can be carried forward if your tax
                    liability is less than the credit amount. Consult with a tax
                    professional for advice specific to your situation.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Dialog.Close asChild>
                  <button className="tesla-button">Got it</button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Stripe Checkout Modal */}
      <AnimatePresence>
        {showStripeCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-7xl max-h-[90vh] overflow-auto"
            >
              <StripeCheckout
                onSuccess={handleStripeSuccess}
                onCancel={handleStripeCancel}
                customerName={orderSummary.customerInfo.name}
                customerEmail={orderSummary.customerInfo.email}
                className="relative z-10"
                amount={
                  selectedPlanDetails?.type === "cash"
                    ? selectedPlanDetails.amount
                    : 500
                }
                orderSummary={orderSummary}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlanSelection;
