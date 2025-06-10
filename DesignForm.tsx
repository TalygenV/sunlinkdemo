import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Zap,
  ArrowRight,
  ChevronLeft,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { useEffect, useRef } from "react";
import CallToAction from "../sections/CallToAction";
import { trackEvent, AnalyticsEvents } from "../../lib/analytics";

interface DesignFormProps {
  onBack: () => void;
}

const inputVariants = {
  focus: { scale: 1.02, transition: { type: "spring", stiffness: 400 } },
};

// Container animation variants
const containerVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

// Helper function to check if a point is inside a bounding box
function isPointInBoundingBox(
  point: { lat: number; lng: number },
  boundingBox: {
    ne: { latitude: number; longitude: number };
    sw: { latitude: number; longitude: number };
  }
): boolean {
  // Check if point is within the bounding box
  return (
    point.lat >= boundingBox.sw.latitude &&
    point.lat <= boundingBox.ne.latitude &&
    point.lng >= boundingBox.sw.longitude &&
    point.lng <= boundingBox.ne.longitude
  );
}

// Error component for when address is not supported
const AddressNotSupportedError = () => (
  <motion.div
    variants={containerVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="flex flex-col items-center justify-center h-[600px] text-center relative"
  >
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
      <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-white/10 to-red-500/20 rounded-3xl blur-[60px] opacity-60" />
    </motion.div>

    <div className="relative z-10 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-md">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4 mx-auto icon-glow-red" />
      <h2 className="text-2xl font-light text-white mb-4">
        Address Not Supported
      </h2>
      <p className="text-gray-400 mb-6">
        Sorry, your address is not supported yet.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white text-sm transition-all duration-300"
      >
        Exit
      </button>
    </div>
  </motion.div>
);

export default function DesignForm({ onBack }: DesignFormProps) {
  const [showKwh, setShowKwh] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [address, setAddress] = React.useState({ lat: 0, lng: 0 });
  const [formattedAddress, setFormattedAddress] = React.useState("");
  const [solarData, setSolarData] = React.useState<any>(null);
  const [isAddressSupported, setIsAddressSupported] = React.useState(true);
  const [monthlyBill, setMonthlyBill] = React.useState<number>(0);
  const [monthlyConsumption, setMonthlyConsumption] = React.useState<number>(0);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // We already have containerVariants defined at the top level
  const fetchSolarData = async (lat: number, lng: number) => {
    try {
      setShowResults(true);
      setIsAddressSupported(true); // Reset address support status
      trackEvent(AnalyticsEvents.FORM_START, { step: "solar_data" });
      const response = await fetch(
        `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }`
      );
      const data = await response.json();
      console.log(data);

      // -------------------- NEW LOGIC --------------------
      // By default we assume the address is supported. We will flip this flag if any
      // of our validation checks fail.
      let addressSupported = true;

      // 1) Ensure the searched point is inside the API provided bounding box (if one exists)
      if (data.boundingBox && data.boundingBox.ne && data.boundingBox.sw) {
        addressSupported = isPointInBoundingBox({ lat, lng }, data.boundingBox);
      }

      // 2) Validate that we actually received panel data with at least 10 panels
      if (
        !data.solarPotential ||
        !data.solarPotential.solarPanels ||
        data.solarPotential.solarPanels.length < 10
      ) {
        addressSupported = false;
      }

      // Persist the support flag in state so downstream components know whether
      // they can rely on automatic panel generation.
      setIsAddressSupported(addressSupported);

      // If the address is NOT supported, we need the user to provide their
      // monthly energy usage so the rest of the flow has meaningful numbers.
      if (!addressSupported) {
        // Force the KWh input to show
        setShowKwh(true);
        // If they haven't supplied a value yet, stop here and prompt for it
        if (!monthlyConsumption || monthlyConsumption <= 0) {
          alert(
            "This address requires manual design. Please enter your average monthly energy consumption (kWh) to continue."
          );
          setShowResults(false);
          return; // Abort further processing until user provides usage
        }
      }

      // ----------------------------------------------------
      // If the address is NOT supported, we still want to allow the user to move
      // forward, but we must guarantee that the solarData object we pass down
      // can be safely consumed by the rest of the application.  To achieve this
      // we create a minimal fallback object and explicitly mark
      // `isAutoPanelsSupported` as false so that the manual-design flow is used.
      // ----------------------------------------------------
      const fallbackSolarData = {
        name: formattedAddress, // human readable address
        coordinates: { latitude: lat, longitude: lng },
        postalCode: data.postalCode || "",
        administrativeArea: data.administrativeArea || "",
        isAutoPanelsSupported: false,
      };

      // Choose which data object to save based on support status
      const processedData = addressSupported
        ? {
            ...data,
            isAutoPanelsSupported: true,
            coordinates: { latitude: lat, longitude: lng },
          }
        : fallbackSolarData;

      setSolarData(processedData);
      trackEvent(AnalyticsEvents.FORM_COMPLETE, { step: "solar_data" });
    } catch (error) {
      console.error("Error fetching solar data:", error);
      trackEvent(AnalyticsEvents.FORM_ABANDON, {
        step: "solar_data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setShowResults(false);
    }
  };

  useEffect(() => {
    if (addressInputRef.current && window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        console.log(place);
        if (place.geometry?.location) {
          setFormattedAddress(place.formatted_address || "");

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          console.log(lat, lng);
          setAddress({ lat, lng });
        }
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.lat && address.lng) {
      fetchSolarData(address.lat, address.lng);
    }
  };

  if (showResults && solarData) {
    // Always proceed to CallToAction, but pass the address support status as a flag
    return (
      <CallToAction
        data={{
          ...solarData,
          name: formattedAddress,
          targetMonthlyBill: monthlyBill,
          isAutoPanelsSupported: isAddressSupported,
          coordinates: {
            latitude: address.lat,
            longitude: address.lng,
          },
        }}
        monthlyConsumption={showKwh ? monthlyConsumption : 0}
        onContinue={() => {
          /* Handle continue */
        }}
        onBack={() => setShowResults(false)}
      />
    );
  }

  return (
    <motion.div
      key="design-form-container"
      className="w-full"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
    >
      {/* Glowing Effect Wrapper */}
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Outer Glow */}
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

        {/* Form Container */}
        <motion.div
          className="relative z-10 mx-4 md:mx-8 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden p-6 sm:p-8 md:p-12"
          animate={{
            boxShadow: [
              "0 0 20px 0 rgba(255,255,255,0.1)",
              "0 0 25px 2px rgba(255,255,255,0.12)",
              "0 0 25px 2px rgba(255,255,255,0.12)",
              "0 0 20px 0 rgba(255,255,255,0.1)",
            ],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.4, 0.6, 1],
            repeatType: "loop",
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80 mb-4">
              Design Your System
            </h2>
            <p className="text-gray-400 text-lg">
              Let's start with your address and current energy usage
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="relative space-y-10">
            {/* Address Input */}
            <motion.div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400 tracking-wide uppercase">
                Property Address
              </label>
              <motion.div
                className="relative group"
                whileFocus="focus"
                variants={inputVariants}
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors duration-300" />
                <input
                  type="text"
                  ref={addressInputRef}
                  placeholder="Enter your address"
                  className="w-full pl-14 pr-5 py-5 bg-black/40 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/60 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            </motion.div>

            {/* Energy Usage Input */}
            <AnimatePresence mode="wait">
              {!showKwh ? (
                <motion.div
                  key="bill-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <label className="block text-sm font-medium text-gray-400 tracking-wide uppercase">
                    Average Electric Bill
                  </label>
                  <motion.div
                    className="relative group"
                    whileFocus="focus"
                    variants={inputVariants}
                  >
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors duration-300" />
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={monthlyBill || ""}
                      onChange={(e) => setMonthlyBill(Number(e.target.value))}
                      className="w-full pl-14 pr-16 py-5 bg-black/40 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/60 transition-all duration-300"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors duration-300">
                      /mo
                    </span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => setShowKwh(true)}
                    className="text-sm text-accent-400 hover:text-accent-300 transition-colors duration-300 mt-2"
                  >
                    or enter your monthly consumption
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="kwh-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <label className="block text-sm font-medium text-gray-400 tracking-wide uppercase">
                    Monthly Energy Usage
                  </label>
                  <motion.div
                    className="relative group"
                    whileFocus="focus"
                    variants={inputVariants}
                  >
                    <Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors duration-300" />
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={monthlyConsumption || ""}
                      onChange={(e) =>
                        setMonthlyConsumption(Number(e.target.value))
                      }
                      className="w-full pl-14 pr-16 py-5 bg-black/40 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/60 transition-all duration-300"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors duration-300">
                      kWh
                    </span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => setShowKwh(false)}
                    className="text-sm text-accent-400 hover:text-accent-300 transition-colors duration-300 mt-2"
                  >
                    or enter your monthly electricity bill
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
              <div className="relative">
                {/* Back Button with matching height */}
                <motion.button
                  type="button"
                  onClick={onBack}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium tracking-wider group"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                  Back
                </motion.button>
              </div>

              {/* Continue Button with Glow Effect */}
              <div className="relative">
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
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!address.lat || !address.lng}
                  className="btn-sheen relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10 text-sm font-medium tracking-wider group"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
