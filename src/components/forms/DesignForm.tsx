import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  DollarSign,
  Search,
  Zap,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { AnalyticsEvents, trackEvent } from "../../lib/analytics";
import CallToAction from "../sections/CallToAction";
import { GenabilityData, SolarData, Tariff } from "@/types";

interface DesignFormProps {
  onBack: () => void;
}

const inputVariants = {
  focus: { scale: 1.02, transition: { type: "spring", stiffness: 400 } },
};

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
  const [showKwh, setShowKwh] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [address, setAddress] = useState({ lat: 0, lng: 0 });
  const [formattedAddress, setFormattedAddress] = useState("");
  const [solarData, setSolarData] = useState<SolarData | null>(null);
  const [isAddressSupported, setIsAddressSupported] = useState(true);
  const [genabilityData, setGenabilityData] = useState<GenabilityData | null>(
    null
  );
  const [monthlyBill, setMonthlyBill] = useState<number>(0);
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type Territory = {
  name: string;
  code: string;
  websiteHome: string;
    lseId: number;

  };
  interface RateBand {
    rateAmount: number;
    // You can add more fields here as needed
  }

  interface Rate {
    rateGroupName: string;
    chargeType: string;
    chargeClass: string;
    rateBands: RateBand[];
  }

  interface Tariff {
    tariffId: number;
    tariffName: string;
    tariffType: string;
    rates?: Rate[];
  }

  const addressInputRef = useRef<HTMLInputElement>(null);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(
    null
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNoTariffModal, setShowNoTariffModal] = useState(false);

  // Fallback API keys (for debugging only; move to backend in production)
  // const GENABILITY_APP_ID =
  //   import.meta.env.VITE_GENABILITY_APP_ID ||
  //   "db91730b-5e06-47b5-b720-772d79852505";
  // const GENABILITY_API_KEY =
  //   import.meta.env.VITE_GENABILITY_API_KEY ||
  //   "e9fd3859-80a0-4802-86b1-add58689c540";

  const GENABILITY_APP_ID =
    import.meta.env.GENABILITY_APP_ID || "db91730b-5e06-47b5-b720-772d79852505";
  const GENABILITY_API_KEY =
    import.meta.env.GENABILITY_API_KEY ||
    "e9fd3859-80a0-4802-86b1-add58689c540";
    const base_url = "https://api.genability.com";
    const basic_token = "NjQ2M2ZmM2EtMTJjZS00MjQ0LWFiMTEtMWQwOTZiNTQwN2M1OjFkMGM5NTI4LTU1NDktNDhhMy1iYTg5LTZkMWJlYTllMzllNQ=="

  const fetchUtilityAndTariff = async () => {
  try {
    // Input validation
    if (!address.lat || !address.lng || monthlyBill <= 0) throw new Error("Provide a valid address and monthly bill.");
    if (!selectedTerritory?.lseId) throw new Error("No utility selected.");
    if (!GENABILITY_APP_ID || !GENABILITY_API_KEY) throw new Error("Missing API credentials.");

    const lseId = selectedTerritory.lseId;
    const today = new Date().toISOString().split("T")[0];
    const lastYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split("T")[0];
    const annualBill = monthlyBill * 12;
    const randomId = Math.floor(Math.random() * 100000);
    const providerAccountId = `provider-account-${randomId}`;
    const accountName = `customer-account-${randomId}`;

    setIsLoading(true);
    setError(null);

    // 1. Create Genability Account
    const accountRes = await fetch(`${base_url}/rest/v1/accounts`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerAccountId,
        accountName,
        address: { addressString: formattedAddress },
        properties: {
          customerClass: {
            keyName: "customerClass",
            dataValue: "1",
          },
        },
      }),
    });

    if (!accountRes.ok) throw new Error(await accountRes.text());
    const accountData = await accountRes.json();
    const accountId = accountData?.results?.[0]?.accountId;
    if (!accountId) throw new Error("Account ID not found in response.");

    // 2. Set lseId property
    await fetch(`${base_url}/rest/v1/accounts/${accountId}/properties`, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${basic_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keyName: "lseId",
        dataValue: lseId,
      }),
    });

    // 3. Estimate kWh from annual bill
    const kwhCalcRes = await fetch(`${base_url}/rest/v1/accounts/${accountId}/calculate/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromDateTime: lastYear,
        toDateTime: today,
        billingPeriod: "false",
        groupBy: "MONTH",
        detailLevel: "TOTAL",
        propertyInputs: [
          { keyName: "total", dataValue: annualBill, unit: "cost" },
          { keyName: "baselineType", dataValue: "typicalElectricity" },
        ],
      }),
    });

    if (!kwhCalcRes.ok) throw new Error(await kwhCalcRes.text());
    const kwhData = await kwhCalcRes.json();
    const pricePerKwh = kwhData?.results?.[0]?.summary?.kWh;
    if (!pricePerKwh) throw new Error("kWh estimate not found.");

    // 4. Estimate system size in kW (used later for solar profile and display)
    const estimatedMonthlyKwh = pricePerKwh / 1500;
    const recommendedSizeKw = estimatedMonthlyKwh * 1000;
 await fetch(`${base_url}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        
    "providerAccountId": providerAccountId,
    "providerProfileId": `Annual-Consumption-${providerAccountId}`,
    "profileName": `Annual Consumption for ${providerAccountId}`,
    "isDefault": true,
    "serviceTypes": "ELECTRICITY",
    "sourceId": "ReadingEntry",
    "readingData": [
        {
            "fromDateTime": lastYear,
            "toDateTime": today,
            "quantityUnit": "kWh",
            "quantityValue": pricePerKwh
        }
    ]

      }),
    });

    // if (!profileResAnnual.ok) throw new Error(await profileResAnnual.text());
    // const profileDataAnnual = await profileResAnnual.json();
    // 5. Create Solar Profile
   await fetch(`${base_url}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerAccountId: providerAccountId,
        providerProfileId: `Solar-Production-PVWatts-6kW-${providerAccountId}`,
        groupBy: "YEAR",
        serviceTypes: "SOLAR_PV",
        source: { sourceId: "PVWatts", sourceVersion: "8" },
        properties: {
          systemSize: { keyName: "systemSize", dataValue: recommendedSizeKw / 400 },
          azimuth: { keyName: "azimuth", dataValue: "180" },
          losses: { keyName: "losses", dataValue: "15" },
          inverterEfficiency: { keyName: "inverterEfficiency", dataValue: "96" },
          tilt: { keyName: "tilt", dataValue: "25" },
        },
      }),
    });

    // if (!profileRes.ok) throw new Error(await profileRes.text());
    // const profileData = await profileRes.json();



const analysis = await fetch(`${base_url}/rest/v1/accounts/analysis`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
    "providerAccountId": providerAccountId,
    "fromDateTime": today,
    "useIntelligentBaselining": true,
    "propertyInputs": [
        {
            "keyName": "providerProfileId",
            "dataType": "STRING",
            "dataValue": `Annual-Consumption-${providerAccountId}`,
            "scenarios": "before,after",
            "dataFactor": 1.0
        },
        {
            "keyName": "providerProfileId",
            "dataType": "STRING",
            "dataValue": `Solar-Production-PVWatts-6kW-${providerAccountId}`,
            "scenarios": "solar,after",
            "dataFactor": 1.0
        },
        {
            "keyName": "projectDuration",
            "dataType": "INTEGER",
            "dataValue": "25"
        },
        {
            "keyName": "rateInflation",
            "dataType": "DECIMAL",
            "dataValue": "3.0",
            "scenarios": "before,after"
        },
        {
            "keyName": "rateInflation",
            "dataType": "DECIMAL",
            "dataValue": "2.0",
            "scenarios": "solar"
        },
        {
            "keyName": "solarDegradation",
            "dataType": "DECIMAL",
            "dataValue": "0.5",
            "scenarios": "solar"
        }
    ],
    "rateInputs": [
        {
            "chargeType": "CONSUMPTION_BASED",
            "chargePeriod": "MONTHLY",
            "transactionType": "BUY",
            "rateBands": [
                {
                    "rateAmount": 0.15
                }
            ],
            "scenarios": "solar"
        }
    ]

      }),
    });

    if (!analysis.ok) throw new Error(await analysis.text());
    const analysisData = await analysis.json();
    console.log("test ",analysisData);

      const estimatedAnnualSavings =
        estimatedMonthlyKwh * 12 * pricePerKwh * 0.8; // 80% savings
        const penalCount = recommendedSizeKw / 400;
console.log("pricePerKwh",pricePerKwh);
console.log("selectedTerritory.name",selectedTerritory.name);
console.log("estimatedMonthlyKwh",estimatedMonthlyKwh);
console.log("recommendedSizeKw",recommendedSizeKw);
  console.log("estimatedAnnualSavings",estimatedAnnualSavings);
   console.log("penalCount",penalCount);
    console.log("providerAccountId",providerAccountId);

      return {
        utilityName: selectedTerritory.name || "Unknown Utility",
        pricePerKwh,
        estimatedMonthlyKwh,
        recommendedSizeKw,
        estimatedAnnualSavings,
        providerAccountId,
        penalCount
      };
    } catch (error: unknown) {
      console.error("Genability API error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch utility data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSolarData = async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      setError(null);
      setShowResults(true);
      setIsAddressSupported(true);
      trackEvent(AnalyticsEvents.FORM_START, { step: "solar_data" });

      // Validate coordinates
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error("Invalid coordinates provided.");
      }

      const response = await fetch(
        `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }`
      );
      const data = await response.json();


      if (data.error) {
        throw new Error(
          `Solar API error: ${data.error.message} (Code: ${data.error.code})`
        );
      }

      let addressSupported = true;

      if (data.boundingBox && data.boundingBox.ne && data.boundingBox.sw) {
        addressSupported = isPointInBoundingBox({ lat, lng }, data.boundingBox);
      }

      if (
        !data.solarPotential ||
        !data.solarPotential.solarPanels ||
        data.solarPotential.solarPanels.length < 10
      ) {
        addressSupported = false;
      }

      console.log("addressSupported:", addressSupported);
      console.log("monthlyConsumption:", monthlyConsumption);
      console.log(
        "solarPanels length:",
        data?.solarPotential?.solarPanels?.length
      );
      setIsAddressSupported(addressSupported);
      const fallbackSolarData = {
        name: formattedAddress,
        coordinates: { latitude: lat, longitude: lng },
        postalCode: data.postalCode || "",
        administrativeArea: data.administrativeArea || "",
        isAutoPanelsSupported: false,
      };

      if (
        !addressSupported &&
        (!monthlyConsumption || monthlyConsumption <= 0)
      ) {
        setShowKwh(true);
        setError(
          "This address requires manual design. Please enter your average monthly energy consumption (kWh)."
        );
        setShowResults(false);
        setIsLoading(false);
        return fallbackSolarData; // instead of `null`
      }

      const processedData = addressSupported
        ? {
            ...data,
            isAutoPanelsSupported: true,
            coordinates: { latitude: lat, longitude: lng },
          }
        : fallbackSolarData;

      setSolarData(processedData);
      trackEvent(AnalyticsEvents.FORM_COMPLETE, { step: "solar_data" });
      return processedData;
    } catch (error: unknown) {
      console.error("Error fetching solar data:", error);
      trackEvent(AnalyticsEvents.FORM_ABANDON, {
        step: "solar_data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setError(
        "Unable to fetch solar data for this location. Please try another address."
      );
      setShowResults(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (addressInputRef.current && window.google) {
      console.log("addressInputRef",addressInputRef);
      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
        }
      );
console.log("autocomplete",autocomplete);
      autocomplete.addListener("place_changed", async () => {
        const place = autocomplete.getPlace();
        console.log("addressInputRef.current?.value",addressInputRef.current?.value);
        const address = addressInputRef.current?.value;
        const lataddress = place.geometry?.location?.lat();
        const lngaddress = place.geometry?.location?.lng();
        let postalCode: string | undefined = undefined;

        // Extract postal code from address_components
        if (place.address_components) {
          for (const component of place.address_components) {
            if (component.types.includes("postal_code")) {
              postalCode = component.long_name;
              break;
            }
          }
        }

        if (address && place.geometry?.location) {
          setFormattedAddress(address);
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setAddress({ lat, lng });
          }
          

try {
  const response = await fetch(
    `${base_url}/rest/public/lses?addressString=${address}&country=US&residentialServiceTypes=ELECTRICITY&sortOn=totalCustomers&sortOrder=DESC`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basic_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = (await response.json()) as {
  status: string;
  results: Territory[];
};

  if (data.status === "success") {
    const utilityList = data.results || [];

    // You can filter if needed — for example, ignore records without names or websites:
    const filteredList = utilityList.filter((u) => u.name && u.websiteHome);

    setTerritories(filteredList); // Though this should ideally be named setUtilities or similar
  } else {
    setTerritories([]);
  }
} catch (error) {
  console.error("Error fetching utilities:", error);
}
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      !address.lat ||
      !selectedTerritory ||
      !address.lng ||
      monthlyBill <= 0
    ) {
      setError("Please enter a valid address and monthly bill.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const genabilityInfo = await fetchUtilityAndTariff();
      const solarInfo = await fetchSolarData(address.lat, address.lng);

      if (genabilityInfo) {
        setGenabilityData(genabilityInfo);
        solarInfo.estimatedMonthlyKwh = genabilityInfo.estimatedMonthlyKwh;
        setSolarData(solarInfo); // Update state here
        setShowResults(true);
      } else {
        //setError("Failed to process data. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch utility or solar data."
      );
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAddressSupported && !showKwh) {
    return <AddressNotSupportedError />;
  }

  if (showResults && genabilityData && solarData) {
    return (
      <>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium text-white text-center mb-16 md:mb-24">
          Solar for you, not sales people
        </h1>

        <div className="w-full max-w-[1200px] mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center mb-3">
                <span className="text-2xl font-medium text-blue-500 mr-3">
                  1
                </span>
                <div className="w-10 h-10 flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-home w-6 h-6"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-medium text-white">
                Create YOUR custom design with our advanced AI design tool
              </h3>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center mb-3">
                <span className="text-2xl font-medium text-blue-500 mr-3">
                  2
                </span>
                <div className="w-10 h-10 flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-sun w-6 h-6"
                  >
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-medium text-white">
                Choose your plan
              </h3>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center mb-3">
                <span className="text-2xl font-medium text-blue-500 mr-3">
                  3
                </span>
                <div className="w-10 h-10 flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-camera w-6 h-6"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-medium text-white">
                Upload photos of your home
              </h3>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center mb-3">
                <span className="text-2xl font-medium text-blue-500 mr-3">
                  4
                </span>
                <div className="w-10 h-10 flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-wrench w-6 h-6"
                  >
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-medium text-white">
                Get installed
              </h3>
            </div>
          </div>
        </div>

        <CallToAction
          data={{
            ...solarData,
            ...genabilityData,
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

        {/* <p className="mt-12 text-gray-300 text-base md:text-lg text-center mb-8 md:mb-12 max-w-2xl">
          Choose your preferred plan
        </p> */}

        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-[1200px] place-items-stretch mb-20">
          <div
            className="relative flex flex-col justify-between h-auto min-h-[500px] bg-white backdrop-blur-sm 
                rounded-2xl p-8 md:p-10 transition-all duration-500 cursor-pointer group 
                hover:shadow-lg border bg-opacity-5 border-gray-100 border-opacity-10 hover:bg-opacity-10"
          >
            <div className="w-16 md:w-20 h-16 md:h-20 mb-8 text-white opacity-90">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-sun w-full h-full"
              >
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="m4.93 4.93 1.41 1.41"></path>
                <path d="m17.66 17.66 1.41 1.41"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="m6.34 17.66-1.41 1.41"></path>
                <path d="m19.07 4.93-1.41 1.41"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
                Solar Savings Plan
              </h2>
              <p className="text-gray-300 mb-6 max-w-xl text-base md:text-lg leading-relaxed">
                Essential solar power system for your home
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    Tier 1 black solar panels
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    Inverter included
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    10 year roof warranty
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    24/7 monitoring
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-red-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-x w-3 h-3 text-red-500"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    Backup power system
                  </span>
                </div>
              </div>
              <div
                className="inline-flex items-center text-white text-base md:text-lg transition-all duration-300 
                      group-hover:translate-x-2"
              >
                <span className="mr-2 font-medium">Design my system</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-right w-5 h-5 md:w-6 md:h-6"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>
          <div
            className="relative flex flex-col justify-between h-auto min-h-[500px] bg-white backdrop-blur-sm 
                rounded-2xl p-8 md:p-10 transition-all duration-500 cursor-pointer group 
                hover:shadow-lg border bg-opacity-10 border-blue-500/30 hover:bg-opacity-15"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 rounded-full text-sm font-medium">
              Recommended
            </div>
            <div className="w-16 md:w-20 h-16 md:h-20 mb-8 text-white opacity-90">
              <div className="relative w-full h-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-battery w-full h-full"
                >
                  <rect width="16" height="10" x="2" y="7" rx="2" ry="2"></rect>
                  <line x1="22" x2="22" y1="11" y2="13"></line>
                </svg>
                <motion.div
                  className="absolute inset-[15%] right-[35%] bg-white rounded-sm"
                  initial={{ width: "0%", opacity: 0 }}
                  animate={{ width: "50%", opacity: 0.2 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
                Solar + Storage
              </h2>
              <p className="text-gray-300 mb-6 max-w-xl text-base md:text-lg leading-relaxed">
                Complete solar system with backup power
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    Tier 1 black solar panels
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    Inverter included
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    10 year roof warranty
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    24/7 monitoring
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            bg-green-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check w-3 h-3 text-green-500"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">
                    Backup power system
                  </span>
                </div>
              </div>
              <div
                className="inline-flex items-center text-white text-base md:text-lg transition-all duration-300 
                      group-hover:translate-x-2"
              >
                <span className="mr-2 font-medium">Design my system</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-right w-5 h-5 md:w-6 md:h-6"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div> */}
      </>
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
      {/* {showResults && genabilityData && (
        <UtilityResultsPopup
          genabilityData={genabilityData}
          onClose={() => setShowResults(false)}
        />
      )} */}
      <div className="relative w-full max-w-2xl mx-auto">
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
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80 mb-4">
              Design Your Solar System
            </h2>
            <p className="text-gray-400 text-lg">
              Enter your address and average electric bill to estimate savings
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="relative space-y-10">
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

              {/* Dropdown appears after address is selected */}
              {territories.length > 0 && (
                <div className="mt-4 relative">
                  <label className="block text-sm font-medium text-gray-400 tracking-wide uppercase">
                    Choose Utility
                  </label>

                  {/* Styled input that acts like a dropdown toggle */}
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <input
                      readOnly
                      value={
                        selectedTerritory
                          ? `${selectedTerritory.name}`
                          : ""
                      }
                      placeholder="Select a Utility"
                      className="w-full pl-4 pr-10 py-5 bg-black/40 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/60 transition-all duration-300"
                    />
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                  {showNoTariffModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                      <div className="bg-gray-900 border border-white/10 p-8 rounded-2xl w-full max-w-md text-center">
                        <div className="flex justify-center mb-6">
                          <CheckCircle className="w-16 h-16 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-light text-white mb-4">
                          Tariff Not Found
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                          No valid utility tariffs found for this address.
                          Please select another address.
                        </p>
                        <motion.button
                          onClick={() => setShowNoTariffModal(false)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 bg-blue-500 hover:bg-blue-600 text-sm font-medium tracking-wider"
                        >
                          Close
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                  {/* Dropdown list */}
                  {showDropdown && (
                    <ul className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-black/80 border border-white/10 rounded-xl text-white shadow-lg">
                      {territories.map((territory) => (
                        <li
                          key={territory.lseId}
                          className="px-4 py-3 hover:bg-white/10 cursor-pointer transition"
                          onClick={() => {
                            setSelectedTerritory(territory);
                            setShowDropdown(false);
                          }}
                        >
                          {territory.name} 
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
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

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-blue-400 text-sm font-medium">
                    Loading...
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-6 pt-8">
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

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  isLoading ||
                  !selectedTerritory ||
                  !address.lat ||
                  !address.lng ||
                  monthlyBill <= 0
                }
                className="relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 bg-blue-500 hover:bg-blue-600 text-sm font-medium tracking-wider group disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
