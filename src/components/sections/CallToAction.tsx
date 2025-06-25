import { CallToActionProps } from "@/types";
import { motion } from "framer-motion";
import {
  DollarSign,
  Sun,
  TrendingUp
} from "lucide-react";
import { useState ,useEffect} from "react";
import { Cpu as SolarPanel } from "react-feather";
import SystemDesign from "../design/SystemDesign";
import { AuthModal } from "../ui/modals";
import NumberAnimation from "../ui/NumberAnimation";


export default function CallToAction({
  data,
  monthlyConsumption,
  onContinue,
  onBack,
}: CallToActionProps) {
    const [kwhData, setKwhData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const base_url = "https://api.genability.com";
  const basic_token =
    "NjQ2M2ZmM2EtMTJjZS00MjQ0LWFiMTEtMWQwOTZiNTQwN2M1OjFkMGM5NTI4LTU1NDktNDhhMy1iYTg5LTZkMWJlYTllMzllNQ==";
    useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(
          `${base_url}/rest/v1/accounts/pid/${data.providerAccountId}/analyses`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${basic_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
          const series = json?.results?.[0]?.series || [];

      const savingsMonthly = series.find(
        (s: any) => s.displayLabel === "Total Savings (Mo/Year 1)"
      );
      const savingsLifetime = series.find(
        (s: any) => s.displayLabel === "Total Savings (Lifetime)"
      );

      console.log("💰 Monthly Savings:", savingsMonthly?.cost);
      console.log("💰 Lifetime Savings:", savingsLifetime?.cost);

      // Optionally, store in state:
      setKwhData({
        monthly: savingsMonthly?.cost ?? 0,
        lifetime: savingsLifetime?.cost ?? 0,
      });
      const today = new Date().toISOString().split("T")[0];
      const result = await fetch(
          `${base_url}/rest/v1/incentives?addressString=${data.name}&customerClasses=RESIDENTIAL&effectiveOn=${today}`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${basic_token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const getRateResult = await result.json();

if (getRateResult.status === "success" && getRateResult.results && getRateResult.results.length > 0) {
  const rate = getRateResult.results[0].rate;
  
} else {
  console.log("No incentive data found");
}
      } catch (err: any) {
        console.error("Error fetching analyses:", err);
        setError(err.message || "Unknown error");
      }
    };

    if (data?.providerAccountId) {
      fetchAnalysis();
    }
  }, [data?.providerAccountId]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userData, setUserData] = useState<{
    name: string;
    address: string;
    phoneNumber?: string;
    uid?: string;
  } | null>(null);

  // ----------------------------------------------
  // Hoist annualProduction & panelCount so they are
  // available inside calculateAnnualUsage before we
  // determine bestAnalysis.
  // ----------------------------------------------
  let annualProduction = 0;
  let panelCount = 0;

  // Handle successful authentication
  const handleAuthSuccess = (userData?: {
    name: string;
    address: string;
    phoneNumber?: string;
    uid?: string;
    solarData?: any;
  }) => {
    console.log("DEBUG: handleAuthSuccess called with userData:", userData);

    if (userData) {
      // Make sure we're preserving solarData with coordinates when setting userData
      console.log(
        "DEBUG: Setting userData with solarData:",
        userData.solarData
      );

      // When there's no best analysis, explicitly ensure autopanels is false
      if (!bestAnalysis) {
        if (userData.solarData) {
          userData.solarData.isAutoPanelsSupported = false;
        }
        // Use type assertion to set isAutoPanelsSupported property
        (userData as any).isAutoPanelsSupported = false;
        console.log(
          "DEBUG: Explicitly setting isAutoPanelsSupported=false for no analysis case"
        );
      }

      setUserData(userData);
    }

    // Only call onContinue for normal flow, not for the no-analysis case
    if (bestAnalysis) {
      // Normal flow - let parent component handle navigation
      onContinue();
    } else {
      console.log(
        "DEBUG: No analysis case - SystemDesign will be displayed directly"
      );
    }
    // For no-analysis case, we'll display SystemDesign directly without calling onContinue
  };

  // Calculate annual usage based on input method
  const calculateAnnualUsage = (): number => {
    if (monthlyConsumption && monthlyConsumption > 0) {
      // If monthly consumption is provided, multiply by 12
      return monthlyConsumption * 12;
    }

    // Fall back to the annual production if we have it, otherwise use 12,000 kWh
    return annualProduction || 12000;
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  };

  // Find the analysis with the highest savings
  const validAnalyses =
    data?.solarPotential?.financialAnalyses || data?.financialAnalyses || [];
  const bestAnalysis = validAnalyses
    .filter((analysis: any) => analysis.panelConfigIndex >= 0)
    .reduce((best: any, current: any) => {
      console.log("current",current);
      if (!data.targetMonthlyBill) {
        // Fallback to highest savings if no monthly bill provided
        const currentSavings =
          current.cashPurchaseSavings?.savings?.savingsYear20?.units || "0";
        const bestSavings =
          best.cashPurchaseSavings?.savings?.savingsYear20?.units || "0";
        return parseInt(currentSavings) > parseInt(bestSavings)
          ? current
          : best;
      }

      // Calculate target monthly bill using the formula: (monthlyBill / 2) + 25
      const targetBill = data.targetMonthlyBill / 2 + 25;

      // Get the absolute difference between each analysis's monthly bill and target
      const currentDiff = Math.abs(
        parseInt(current.monthlyBill?.units || "0") - targetBill
      );
      const bestDiff = Math.abs(
        parseInt(best.monthlyBill?.units || "0") - targetBill
      );

      // Return the analysis with the closest monthly bill to our target
      return currentDiff < bestDiff ? current : best;
    }, validAnalyses[0]);

  if (!bestAnalysis) {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-4xl mx-auto px-4 text-center"
      >
        <h2 className="text-3xl text-white mb-4">
          No Solar Analysis Available
        </h2>
        <p className="text-gray-400 mb-8">
          Don't worry! You can still design your system manually.
        </p>
        <motion.button
          onClick={() => setShowAuthModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white"
        >
          Continue with Manual Design
        </motion.button>

        {/* Add this section for manual panel case */}
        {userData && (
          <div className="fixed inset-0 z-40">
            <SystemDesign
              userData={{
                ...userData,
                isAutoPanelsSupported: false, // Force manual panels mode
              }}
            />
          </div>
        )}

        {/* Add logging for debugging */}
        {(() => {
          if (showAuthModal) {
            console.log(
              "DEBUG: Coordinates in CallToAction for no solar analysis case:",
              data?.coordinates
            );
            console.log("DEBUG: solarData being passed to AuthModal:", {
              coordinates: {
                latitude: data?.coordinates?.latitude || 0,
                longitude: data?.coordinates?.longitude || 0,
              },
              isAutoPanelsSupported: false, // EXPLICITLY FALSE for no analysis case
            });
          }
          return null;
        })()}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
            initialAddress={data.name}
            isAutoPanelsSupported={false}
            solarData={{
              coordinates: {
                latitude: data?.coordinates?.latitude || 0,
                longitude: data?.coordinates?.longitude || 0,
              },
              isAutoPanelsSupported: false,
              // Include these to ensure they're accessible in SystemDesign
              name: data.name,
              postalCode: data.postalCode || "",
              administrativeArea: data.administrativeArea || "",
            }}
            monthlyBill={data.targetMonthlyBill}
            annualUsage={calculateAnnualUsage()}
          />
        )}
      </motion.div>
    );
  }

  const { cashPurchaseSavings, financialDetails } = bestAnalysis || {};

  const { outOfPocketCost, upfrontCost, rebateValue, paybackYears, savings } =
    cashPurchaseSavings || {};

  const {
    initialAcKwhPerYear,
    costOfElectricityWithoutSolar,
    solarPercentage,
    federalIncentive,
    netMeteringAllowed,
  } = financialDetails || {};

  const firstYearSavings = savings?.savingsYear1?.units || "0";
  const twentyYearSavings = savings?.savingsYear20?.units || "0";
  const totalCostWithoutSolar = costOfElectricityWithoutSolar?.units || "0";
  const federalIncentiveAmount = federalIncentive?.units || "0";
  const initialCost = outOfPocketCost?.units || "0";

  // Get the selected panel configuration
  const selectedConfig =
    data.solarPotential?.solarPanelConfigs[bestAnalysis.panelConfigIndex];
    console.log("selectedConfig",selectedConfig);
  annualProduction = selectedConfig?.yearlyEnergyDcKwh || 0;
  panelCount = selectedConfig?.panelsCount || 0;

  // Calculate annual usage based on input method
  const annualUsage = calculateAnnualUsage();

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      {/* Main Content Container */}
      <div className="relative">
        {/* Background Glow */}
        <motion.div
          className="absolute -inset-8 rounded-3xl"
          animate={{
            opacity: [0.2, 0.4, 0.4, 0.2],
            scale: [1, 1.015, 1.015, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.4, 0.6, 1],
            repeatType: "loop",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/20 to-blue-500/20 rounded-3xl blur-[60px] opacity-60" />
        </motion.div>

        {/* Content */}
        <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
                Your Solar Potential
              </h2>
              <p className="text-xl text-gray-400">
                Here's how much you could save with solar
              </p>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Savings Card */}
            {kwhData && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="z-10 shadow-[0_0_25px_5px_rgba(255,255,255,0.03)] transition-all duration-500 overflow-hidden rounded-2xl p-6 border border-white/10 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.03] pointer-events-none" />
              <div className="flex items-start justify-between mb-6 ">
                <div>
                  <h3 className="text-2xl font-light text-white mb-2">
                    25 Year Savings
                  </h3>
                  <p className="text-gray-400">Total financial benefit</p>
                </div>
                <DollarSign className="w-6 h-6 text-purple-400 text-glow-purple icon-glow-purple" />
              </div>
              <div className="text-4xl md:text-5xl font-light text-white mb-4">
                {parseInt(kwhData.lifetime) < 0 ? (
  <span>
    ({<NumberAnimation value={Math.abs(parseInt(kwhData.lifetime))} prefix="$" />})
  </span>
) : (
  <NumberAnimation value={parseInt(kwhData.lifetime)} prefix="$" />
)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-400 text-glow-purple">
                  <TrendingUp className="w-4 h-4 icon-glow-purple" />
                  <span className="text-sm">
                    {parseInt(kwhData.monthly) < 0 ? (
  <span>
    ({<NumberAnimation value={Math.abs(parseInt(kwhData.monthly))} prefix="$" />})
  </span>
) : (
  <NumberAnimation value={parseInt(kwhData.monthly)} prefix="$" />
)}{" "}
                    in first year
                  </span>
                </div>
                <div className="flex items-center gap-2 text-accent-400 text-glow-accent">
                  <DollarSign className="w-4 h-4 icon-glow-accent" />
                  <span className="text-sm">
                    <NumberAnimation
                      value={0}
                      prefix="$"
                    />{" "}
                    federal tax credit
                  </span>
                </div>
              </div>
            </motion.div>
            )}

            {/* Solar Production Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="z-10 shadow-[0_0_25px_5px_rgba(255,255,255,0.03)] transition-all duration-500 overflow-hidden rounded-2xl p-6 border border-white/10 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.03] pointer-events-none" />
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-light text-white mb-2">
                    Annual Production
                  </h3>
                  <p className="text-gray-400">Clean energy generation</p>
                </div>
                <Sun className="w-6 h-6 text-accent-400 text-glow-accent icon-glow-accent" />
              </div>
              <div className="text-4xl md:text-5xl font-light text-white mb-4">
                <NumberAnimation value={Math.round(data.pricePerKwh)} />
                <span className="text-lg text-gray-400 ml-2 mt-2">
                  kWh/year
                </span>
              </div>
              <div className="flex items-center gap-2 text-accent-400 text-glow-accent mt-10 ">
                <SolarPanel className="w-4 h-4 icon-glow-accent" />
                <span className="text-sm ">
                  <NumberAnimation value={Math.round(data.penalCount)} /> panels (
                  {data.solarPotential?.panelCapacityWatts || 0}W each)
                </span>
              </div>
            </motion.div>
          </div>

          {/* Timeline */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.3)]">
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-400 to-accent-400 shadow-[0_0_20px_rgba(192,132,252,0.5)] transition-all duration-300"
                initial={{ width: "0%" }}
                animate={{
                  width: paybackYears ? `${(paybackYears / 20) * 100}%` : "0%",
                }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-accent-400/20 blur-sm" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-4 text-sm">
              <span className="text-gray-400">Installation</span>
              <span className="text-white">
                Payback in {paybackYears?.toFixed(1) || "N/A"} years
              </span>
              <span className="text-gray-400">
                {data.solarPotential?.panelLifetimeYears || 20} years
              </span>
            </div>
          </motion.div> */}

          {/* Additional Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-12 grid grid-cols-2 gap-4 text-sm"
          >
            <div className="text-gray-400">
              <span className="block text-white">Panels</span>
              {Math.round(data.penalCount)}
            </div>
            <div className="text-gray-400">
              <span className="block text-white">System Size</span>
              {Math.round((data.estimatedMonthlyKwh)).toFixed(1)} kW
            </div>
            <div className="text-gray-400">
              <span className="block text-white">Location</span>
              {data.postalCode}, {data.administrativeArea}
            </div>
            <div className="text-gray-400">
              <span className="block text-white">Warranty</span>
              25 Years
            </div>
          </motion.div>

          {/* Action Buttons */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
            <div className="relative">
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium tracking-wider group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                Back
              </motion.button>
            </div> */}

            {/* Continue Button with Glow Effect */}
            {/* <div className="relative">
              <motion.div
                className="absolute -inset-1 rounded-full z-0"
                animate={{
                  opacity: [0.4, 0.6, 0.4],
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[20px]" />
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAuthModal(true)}
                className="btn-sheen relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10 text-sm font-medium tracking-wider group"
              >
                Continue to Design
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </div>
          </div> */}
  <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAuthModal(true)}
                className="btn-sheen relative z-10 w-full h-[52px] flex items-center justify-center gap-3 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10 text-sm font-medium tracking-wider group"
              >
          <button className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white text-lg font-medium rounded-xl transition-all duration-300 flex items-center justify-center group">Continue to Design<span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span></button></motion.button>
        </div>
        
      </div>
      {/* Render SystemDesign component behind the AuthModal if userData exists */}
      {userData && (
        <div className="fixed inset-0 z-40">
          <SystemDesign
            userData={{
              ...userData,
              isAutoPanelsSupported: data.isAutoPanelsSupported, // Pass the flag to SystemDesign
            }}
          />
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          initialAddress={data.name}
          isAutoPanelsSupported={data.isAutoPanelsSupported} // Pass the flag to AuthModal
          solarData={{
            ...data,
            // Ensure coordinates are always included and properly structured
            coordinates: data.coordinates || {
              latitude: 0,
              longitude: 0,
            },
          }}
          monthlyBill={data.targetMonthlyBill}
          annualUsage={annualUsage}
        />
      )}
    </motion.div>
  );
}
