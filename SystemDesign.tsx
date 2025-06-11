import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, LogOut } from "lucide-react";
import ProgressBar, { type ProgressStage } from "../ui/progress/ProgressBar";
import { createCheckoutSession } from "../../lib/functions";
import StripeCheckout from "./StripeCheckout";

// @ts-ignore
import { DefaultPanelShowcase } from "../solar";
// @ts-ignore
import { DefaultInverterShowcase } from "../inverter";
// @ts-ignore
import { BatteryShowcase } from "../battery";

import { OverviewStep } from "../design";
import NearmapTestingTwo from "./NearmapTestingTwoManual";
import { auth, db, storage } from "../../lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref as dbRef, get, set, update } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  getAllPanels,
  getPanelId,
  calculateTotalStats,
  updateActivePanels,
} from "../utils/panelHelpers";
import { signOut } from "firebase/auth";

// Add this type declaration at the top of the file, after imports
// Declare global Stripe interface
declare global {
  interface Window {
    Stripe?: (apiKey: string) => any;
    showStripeModal?: () => boolean;
  }
}

// Define user data interface
interface UserData {
  name: string;
  address: string;
  phoneNumber?: string;
  uid?: string;
  solarData?: any;
  monthlyBill?: number;
  annualUsage?: number;
  isAutoPanelsSupported?: boolean;
}

// Props for the SystemDesign component
interface SystemDesignProps {
  userData: UserData;
}

// Interface for step components
interface StepComponentProps {
  onContinue: () => void;
  imageUrl?: string | null;
  overlayBounds?: {
    north: number;
    east: number;
    south: number;
    west: number;
  } | null;
  mapCenter?: {
    lat: number;
    lng: number;
  } | null;
  solarData?: any;
  // Added props for panel state
  panels?: any[];
  obstructedPanels?: Set<string>;
  onIncreasePanels?: () => void;
  onDecreasePanels?: () => void;
  onSetPanels?: (newCount: number) => void;
  onPanelClick?: (panel: any) => void;
  annualUsage?: number;
  // Battery-related props
  updateCurrentBatteryName?: (battery: any) => void;
  batteryCount?: number;
  setBatteryCount?: (count: number) => void;
  isBatterySkipped?: boolean;
  setIsBatterySkipped?: (skipped: boolean) => void;
  selectedBatteryDetails?: any;
  navigateToBatteriesTab?: () => void;
  // Manual panel-related props
  manualPanelsOn?: boolean;
  setManualPanelsOn?: (on: boolean) => void;
  manualPanelRegions?: any[];
  setManualPanelRegions?: (regions: any[]) => void;
  selectedRegionId?: number | null;
  setSelectedRegionId?: (id: number | null) => void;
  totalManualPanels?: number;
  setTotalManualPanels?: (count: number) => void;
  manualPanelEnergy?: number;
  setManualPanelEnergy?: (energy: number) => void;
  currentRotation?: number;
  setCurrentRotation?: (rotation: number) => void;
  // Add isAutoPanelsSupported flag
  isAutoPanelsSupported?: boolean;
  // Add manual panel obstructions
  manualPanelObstructedIds?: Set<string>;
  setManualPanelObstructedIds?: (ids: Set<string>) => void;
  // Add alignment saved prop
  alignmentSaved?: boolean;
  setAlignmentSaved?: (saved: boolean) => void;
  // Add autoPanelOffset props
  autoPanelOffset?: { lat: number; lng: number };
  setAutoPanelOffset?: (offset: { lat: number; lng: number }) => void;
  // Add roofData prop
  roofData?: any;
}

// Main SystemDesign component
const SystemDesign: React.FC<SystemDesignProps> = ({ userData }) => {
  const [currentStage, setCurrentStage] = useState<ProgressStage>("Panels");
  // Start with Panels already in completed stages
  const [completedStages, setCompletedStages] = useState<ProgressStage[]>([
    "Panels",
  ]);
  // State for the image URL and map data
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<{
    north: number;
    east: number;
    south: number;
    west: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [solarData, setSolarData] = useState<any>(null);
  const [annualUsage, setAnnualUsage] = useState<number>(12000); // Default fallback value
  const [roofData, setRoofData] = useState<any>(null);

  // Check if we have necessary user data
  const [profileComplete, setProfileComplete] = useState<boolean>(true);
  const [checkingProfile, setCheckingProfile] = useState<boolean>(true);

  // Check if user profile is complete
  useEffect(() => {
    const checkProfileStatus = async () => {
      setCheckingProfile(true);

      // If we don't have a name or address, profile is incomplete
      if (!userData.name || !userData.address) {
        console.log(
          "SystemDesign: User profile incomplete - missing name or address"
        );
        setProfileComplete(false);
        setCheckingProfile(false);
        return;
      }

      // If we have a uid, verify profile status in Firebase
      if (userData.uid || auth.currentUser?.uid) {
        const uid = userData.uid || auth.currentUser?.uid;
        try {
          const userSnapshot = await get(dbRef(db, `users/${uid}`));
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            // Either explicitly marked complete OR has all required fields
            const isComplete =
              userData.profileComplete === true ||
              (userData.name && userData.address);

            console.log(`SystemDesign: Profile complete check: ${isComplete}`);
            setProfileComplete(isComplete);
          } else {
            console.log("SystemDesign: No user data found in database");
            setProfileComplete(false);
          }
        } catch (error) {
          console.error("Error checking profile status:", error);
        }
      }

      setCheckingProfile(false);
    };

    checkProfileStatus();
  }, [userData.uid, userData.name, userData.address]);

  // States moved from NearmapTestingTwo
  const [panels, setPanels] = useState<any[]>([]);
  const [obstructedPanels, setObstructedPanels] = useState<Set<string>>(
    new Set()
  );

  // Battery-related states
  const [currentBatteryName, setCurrentBatteryName] = useState<string>("");
  const [selectedBatteryDetails, setSelectedBatteryDetails] =
    useState<any>(null);
  const [batteryCount, setBatteryCount] = useState<number>(0);
  const [isBatterySkipped, setIsBatterySkipped] = useState<boolean>(false);

  // Add these states in SystemDesign.tsx where other states are defined
  const [manualPanelsOn, setManualPanelsOn] = useState<boolean>(false);
  const [manualPanelRegions, setManualPanelRegions] = useState<any[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [totalManualPanels, setTotalManualPanels] = useState<number>(0);
  const [manualPanelEnergy, setManualPanelEnergy] = useState<number>(0);
  const [currentRotation, setCurrentRotation] = useState<number>(0);

  // Add state for manual panel obstructions
  const [manualPanelObstructedIds, setManualPanelObstructedIds] = useState<
    Set<string>
  >(new Set());
  // Add alignment saved state
  const [alignmentSaved, setAlignmentSaved] = useState<boolean>(false);
  // Add autoPanelOffset state
  const [autoPanelOffset, setAutoPanelOffset] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 0, lng: 0 });

  // Progress persistence states
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState<number>(
    Date.now()
  );
  const [designSessionState, setDesignSessionState] = useState<
    "in-progress" | "completed" | "abandoned"
  >("in-progress");
  const [isRestoredSession, setIsRestoredSession] = useState<boolean>(false);
  // Add payment option state
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<
    string | null
  >(null);

  // Add state for detecting mobile devices
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Function to update current battery name and details
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);
  const updateCurrentBatteryName = (battery: any) => {
    if (battery) {
      if (battery.shortName) {
        setCurrentBatteryName(battery.shortName);
      }
      setSelectedBatteryDetails(battery);
      // When a battery is selected, set count to 1 if it was 0
      if (batteryCount === 0) {
        setBatteryCount(1);
      }
      // Reset the skipped flag when a battery is selected
      setIsBatterySkipped(false);
    }
  };

  // Function to navigate back to the Batteries tab
  const navigateToBatteriesTab = () => {
    setCurrentStage("Batteries");
    // Ensure Batteries is in the completed stages
    if (!completedStages.includes("Batteries")) {
      setCompletedStages((prevStages) => [...prevStages, "Batteries"]);
    }
  };

  // Function to update panel data in Firebase
  const updatePanelData = useCallback(async () => {
    // Use userData.uid if available, otherwise check auth.currentUser
    if (!userData.uid && !auth.currentUser) {
      return;
    }

    const uid = userData.uid || auth.currentUser?.uid;

    if (!uid) {
      return;
    }

    try {
      // Get reference to user's data
      const dataRef = dbRef(db, `users/${uid}`);

      // Convert obstructedPanels Set to Array for Firebase
      const obstructedPanelsArray = Array.from(obstructedPanels);

      // Convert manual panel obstructed IDs Set to Array for Firebase
      const manualPanelObstructedArray = Array.from(manualPanelObstructedIds);

      // Ensure isAutoPanelsSupported has a default value before saving
      const isAutoSupported =
        userData.isAutoPanelsSupported !== undefined
          ? userData.isAutoPanelsSupported
          : solarData?.isAutoPanelsSupported || false;

      // Update the database with current state using update() to preserve other fields
      await update(dataRef, {
        imageUrl,
        overlayBounds,
        mapCenter,
        solarData,
        panels,
        obstructedPanels: obstructedPanelsArray,
        annualUsage,
        roofData,
        // Add manual panel data

        manualPanelRegions,
        selectedRegionId,
        totalManualPanels,
        manualPanelEnergy,

        // Add manual panel obstructions
        manualPanelObstructedIds: manualPanelObstructedArray,
        // Add alignmentSaved state
        alignmentSaved,
        // Add autoPanelOffset
        autoPanelOffset,
        // Explicitly save isAutoPanelsSupported at the root level with a default
        isAutoPanelsSupported: isAutoSupported,
        // Add battery-related data
        selectedBatteryDetails,
        batteryCount,
        isBatterySkipped,
      });
    } catch (error) {}
  }, [
    userData.uid,
    imageUrl,
    overlayBounds,
    mapCenter,
    solarData,
    panels,
    obstructedPanels,
    annualUsage,
    roofData,
    // Add dependencies for manual panel data

    manualPanelRegions,
    selectedRegionId,
    totalManualPanels,
    manualPanelEnergy,

    // Add dependency for manual panel obstructions
    manualPanelObstructedIds,
    // Add dependencies for alignmentSaved and autoPanelOffset
    alignmentSaved,
    autoPanelOffset,
    solarData?.isAutoPanelsSupported,
    // Add battery-related dependencies
    selectedBatteryDetails,
    batteryCount,
    isBatterySkipped,
  ]);

  // Create a ref to store previous state for optimized updates
  const prevStateRef = useRef<Record<string, any>>({});

  // Optimized function to update only changed panel data in Firebase
  const updateChangedPanelData = useCallback(async () => {
    // Use userData.uid if available, otherwise check auth.currentUser
    if (!userData.uid && !auth.currentUser) {
      return;
    }

    const uid = userData.uid || auth.currentUser?.uid;

    if (!uid) {
      return;
    }

    try {
      // Get reference to user's data
      const dataRef = dbRef(db, `users/${uid}`);

      // Create current state object with all values
      const currentState: Record<string, any> = {
        imageUrl,
        overlayBounds,
        mapCenter,
        solarData,
        panels,
        obstructedPanels: Array.from(obstructedPanels),
        annualUsage,
        roofData,
        manualPanelRegions,
        selectedRegionId,
        totalManualPanels,
        manualPanelEnergy,
        manualPanelObstructedIds: Array.from(manualPanelObstructedIds),
        alignmentSaved,
        autoPanelOffset,
        isAutoPanelsSupported:
          userData.isAutoPanelsSupported !== undefined
            ? userData.isAutoPanelsSupported
            : solarData?.isAutoPanelsSupported || false,
        selectedBatteryDetails,
        batteryCount,
        isBatterySkipped,
      };

      // Compare with previous state and build update object with only changed fields
      const changedFields: Record<string, any> = {};
      let hasChanges = false;

      Object.entries(currentState).forEach(([key, value]) => {
        // Skip undefined values
        if (value === undefined) return;

        // Compare current and previous values using JSON.stringify
        // This handles complex objects but has limitations with circular references
        if (
          !prevStateRef.current[key] ||
          JSON.stringify(prevStateRef.current[key]) !== JSON.stringify(value)
        ) {
          changedFields[key] = value;
          hasChanges = true;
        }
      });

      // Only update if there are changes
      if (hasChanges) {
        await update(dataRef, changedFields);
        // Update previous state reference with new values
        prevStateRef.current = { ...prevStateRef.current, ...changedFields };
      }
    } catch (error) {
      console.error("Error updating panel data:", error);
    }
  }, [
    userData.uid,
    imageUrl,
    overlayBounds,
    mapCenter,
    solarData,
    panels,
    obstructedPanels,
    annualUsage,
    roofData,
    manualPanelRegions,
    selectedRegionId,
    totalManualPanels,
    manualPanelEnergy,
    manualPanelObstructedIds,
    alignmentSaved,
    autoPanelOffset,
    solarData?.isAutoPanelsSupported,
    selectedBatteryDetails,
    batteryCount,
    isBatterySkipped,
  ]);

  // Handler functions for panel manipulation
  const handleIncreasePanels = () => {
    const stats = calculateTotalStats(panels, obstructedPanels);
    setPanels(
      updateActivePanels(panels, stats.totalPanels + 1, obstructedPanels)
    );
    // Update database after state change
  };

  const handleDecreasePanels = () => {
    const stats = calculateTotalStats(panels, obstructedPanels);
    setPanels(
      updateActivePanels(
        panels,
        Math.max(0, stats.totalPanels - 1),
        obstructedPanels
      )
    );
    // Update database after state change
  };

  const handleSetPanels = (newCount: number) => {
    setPanels(updateActivePanels(panels, newCount, obstructedPanels));
    // Update database after state change
  };

  const handlePanelClick = (panel: any) => {
    if (panel) {
      const panelId = getPanelId(panel);
      const newObstructedPanels = new Set(obstructedPanels);
      if (obstructedPanels.has(panelId)) {
        newObstructedPanels.delete(panelId);
      } else {
        newObstructedPanels.add(panelId);
      }
      setObstructedPanels(newObstructedPanels);
      // Update database after state change using optimized function
      setTimeout(() => updateChangedPanelData(), 0);
    }
  };

  // Modify the panel initialization effect to check for roof data
  useEffect(() => {
    if (solarData) {
      try {
        // If there's no roof data, ensure manual panels mode is activated
        if (!roofData && !manualPanelsOn) {
          console.log(
            "No roof data available - switching to manual panels mode"
          );
          setManualPanelsOn(true);
        }

        // Use existing panels when reinitializing
        setPanels((prevPanels) =>
          getAllPanels(solarData, prevPanels, roofData)
        );
      } catch (err) {
        console.error("Error initializing panels:", err);
        // If there's an error, also enable manual panels mode
        setManualPanelsOn(true);
      }
    }
  }, [solarData, roofData]);

  // Update database when panels or obstructedPanels change

  // Update database when manual panel data changes
  useEffect(() => {
    // Skip initial render
    if (
      manualPanelRegions.length > 0 ||
      totalManualPanels > 0 ||
      manualPanelEnergy > 0 ||
      manualPanelsOn
    ) {
      // Use a debounce mechanism to avoid too many database writes
      const timeoutId = setTimeout(() => {
        updateChangedPanelData();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [
    manualPanelsOn,
    obstructedPanels,
    manualPanelRegions,
    selectedRegionId,
    totalManualPanels,
    manualPanelEnergy,
    currentRotation,
  ]);

  // Add useEffect for battery-related state changes
  useEffect(() => {
    // Skip initial render or when battery features are not in use
    if (batteryCount === 0 && !selectedBatteryDetails && !isBatterySkipped)
      return;

    // Use debounce pattern to avoid rapid updates
    const timeoutId = setTimeout(() => {
      updateChangedPanelData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedBatteryDetails, batteryCount, isBatterySkipped]);

  // Update database when manual panel obstructions change

  // Helper function to format address for storage
  const formatAddressForStorage = (address: string): string => {
    return address.replace(/\s+/g, "").replace(/,/g, "-");
  };

  // Helper function to parse bbox string into overlayBounds object
  const parseBbox = (bboxString: string) => {
    const [west, south, east, north] = bboxString.split(",").map(Number);
    return { north, east, south, west };
  };

  // Helper function to calculate map center from bounds
  const calculateMapCenter = (bounds: {
    north: number;
    east: number;
    south: number;
    west: number;
  }) => {
    return {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2,
    };
  };

  // Helper function to check if snapshot has required SystemDesign data
  const hasRequiredSystemDesignData = (snapshot: any) => {
    if (!snapshot.exists()) return false;

    // Check for at least one of the key SystemDesign properties
    const data = snapshot.val();
    return (
      data.imageUrl !== undefined ||
      data.panels !== undefined ||
      data.solarData !== undefined
    );
  };

  // Function to ensure progress state consistency
  const ensureProgressConsistency = () => {
    const stages = ["Panels", "Inverter", "Design", "Batteries", "Overview"];
    const currentIndex = stages.indexOf(currentStage);

    if (currentIndex === -1) {
      // Invalid currentStage, reset to a safe state
      setCurrentStage("Panels");
      setCompletedStages(["Panels"]);
      return;
    }

    // Ensure all previous stages are in completedStages
    const requiredStages = stages
      .slice(0, currentIndex + 1)
      .filter((stage) => stage !== "Completion") as ProgressStage[];
    const updatedCompletedStages = [
      ...new Set([...completedStages, ...requiredStages]),
    ];

    if (
      JSON.stringify(updatedCompletedStages) !== JSON.stringify(completedStages)
    ) {
      setCompletedStages(updatedCompletedStages);
    }

    // If battery was skipped, make sure state is consistent
    if (isBatterySkipped && batteryCount > 0) {
      setBatteryCount(0);
    }
  };

  // Function to save progress state to Firebase
  const saveProgressState = useCallback(
    async (
      stageToSave?: ProgressStage | string,
      stagesToSave?: ProgressStage[]
    ) => {
      // Use userData.uid if available, otherwise check auth.currentUser
      if (!userData.uid && !auth.currentUser) return;

      const uid = userData.uid || auth.currentUser?.uid;
      if (!uid) return;

      try {
        // Get reference to user's progress data
        const progressRef = dbRef(db, `users/${uid}/progress`);

        // Update lastActiveTimestamp
        const now = Date.now();
        setLastActiveTimestamp(now);

        // Use provided values or fall back to state values
        const currentStageToSave = stageToSave || currentStage;
        const completedStagesToSave = stagesToSave || completedStages;

        // Only save essential progress data
        await update(progressRef, {
          currentStage: currentStageToSave,
          completedStages: completedStagesToSave,
          lastActiveTimestamp: now,
          designSessionState: designSessionState,
          purchaseCompleted:
            currentStageToSave === "Overview" &&
            selectedPaymentOption === "cash",
        });

        console.log("Progress state saved successfully");
      } catch (error) {
        console.error("Error saving progress state:", error);
      }
    },
    [
      userData.uid,
      currentStage,
      completedStages,
      designSessionState,
      selectedPaymentOption,
    ]
  );

  // Function to reset progress
  const resetProgress = async () => {
    if (
      !window.confirm("This will reset your design progress. Are you sure?")
    ) {
      return;
    }

    if (!userData.uid && !auth.currentUser) return;

    const uid = userData.uid || auth.currentUser?.uid;
    if (!uid) return;

    try {
      const progressRef = dbRef(db, `users/${uid}/progress`);
      await update(progressRef, {
        currentStage: "Panels",
        completedStages: ["Panels"],
        lastActiveTimestamp: Date.now(),
        designSessionState: "in-progress",
        purchaseCompleted: false,
      });

      // Reset local state
      setCurrentStage("Panels");
      setCompletedStages(["Panels"]);
      setDesignSessionState("in-progress");
      setIsRestoredSession(false);

      console.log("Progress reset successfully");
    } catch (error) {
      console.error("Error resetting progress:", error);
    }
  };

  // Effect to handle data fetching and generation
  useEffect(() => {
    const fetchOrGenerateData = async () => {
      // Use userData.uid if available, otherwise check auth.currentUser
      if (!userData.uid && !auth.currentUser) {
        console.log("No user data or auth.currentUser found");

        return;
      }

      const uid = userData.uid || auth.currentUser?.uid;

      if (!uid) {
        console.log("No uid found");
        return;
      }

      try {
        console.log("uid found");
        // Check if data exists in database
        const dataRef = dbRef(db, `users/${uid}`);
        const snapshot = await get(dataRef);

        // Check if snapshot has the required SystemDesign data
        if (hasRequiredSystemDesignData(snapshot)) {
          console.log("hasRequiredSystemDesignData");
          // Use existing data
          console.log("Found existing SystemDesign data");

          // Load image and bounds data if available
          if (snapshot.val().imageUrl) {
            setImageUrl(snapshot.val().imageUrl);
          }

          // Always try to load bounds, but provide a fallback if missing
          if (snapshot.val().overlayBounds) {
            setOverlayBounds(snapshot.val().overlayBounds);
          } else {
            // Create default bounds based on map center if available
            const center = snapshot.val().mapCenter;
            if (center) {
              setOverlayBounds({
                north: center.lat + 0.001,
                south: center.lat - 0.001,
                east: center.lng + 0.001,
                west: center.lng - 0.001,
              });
            }
          }

          // Load progress state if it exists
          if (snapshot.val().progress) {
            const progressData = snapshot.val().progress;

            if (progressData.currentStage) {
              setCurrentStage(progressData.currentStage);
              setIsRestoredSession(true);
            }

            if (
              progressData.completedStages &&
              Array.isArray(progressData.completedStages)
            ) {
              setCompletedStages(progressData.completedStages);
            }

            if (progressData.lastActiveTimestamp) {
              setLastActiveTimestamp(progressData.lastActiveTimestamp);
            }

            if (progressData.designSessionState) {
              setDesignSessionState(progressData.designSessionState);
            }

            // Ensure progress state is consistent
            ensureProgressConsistency();
          }

          // Always try to load map center, critical for map initialization
          if (snapshot.val().mapCenter) {
            setMapCenter(snapshot.val().mapCenter);
          } else if (
            snapshot.val().solarData &&
            snapshot.val().solarData.center &&
            snapshot.val().solarData.center.latitude &&
            snapshot.val().solarData.center.longitude
          ) {
            // If no mapCenter but solarData has center coordinates, use those instead
            const newMapCenter = {
              lat: snapshot.val().solarData.center.latitude,
              lng: snapshot.val().solarData.center.longitude,
            };
            setMapCenter(newMapCenter);
          }

          // Make sure solarData includes isAutoPanelsSupported flag
          const existingSolarData = snapshot.val().solarData;
          // First check if we have isAutoPanelsSupported directly in userData
          // Then check if it's in the database snapshot, otherwise use the flag from solarData
          const isAutoSupported =
            userData.isAutoPanelsSupported !== undefined
              ? userData.isAutoPanelsSupported
              : snapshot.val().isAutoPanelsSupported !== undefined
              ? snapshot.val().isAutoPanelsSupported
              : existingSolarData?.isAutoPanelsSupported || false;

          setSolarData(
            existingSolarData
              ? {
                  ...existingSolarData,
                  isAutoPanelsSupported: isAutoSupported,
                }
              : null
          );

          // Load panels if they exist in the database
          if (snapshot.val().panels) {
            setPanels(snapshot.val().panels);
          }

          // Load obstructedPanels if they exist in the database
          if (snapshot.val().obstructedPanels) {
            // Convert array back to Set
            setObstructedPanels(new Set(snapshot.val().obstructedPanels));
          }

          // Load annualUsage if it exists in the database
          if (snapshot.val().annualUsage) {
            setAnnualUsage(snapshot.val().annualUsage);
          }

          // Load roofData if it exists in the database
          if (snapshot.val().roofData) {
            setRoofData(snapshot.val().roofData);
          }

          // Load battery-related data if they exist in the database
          if (snapshot.val().selectedBatteryDetails) {
            setSelectedBatteryDetails(snapshot.val().selectedBatteryDetails);
          }

          if (snapshot.val().batteryCount !== undefined) {
            setBatteryCount(snapshot.val().batteryCount);
          }

          if (snapshot.val().isBatterySkipped !== undefined) {
            setIsBatterySkipped(snapshot.val().isBatterySkipped);
          }

          // Load manual panel data if it exists in the database
          if (snapshot.val().manualPanelsOn !== undefined) {
            setManualPanelsOn(snapshot.val().manualPanelsOn);
          }

          if (snapshot.val().manualPanelRegions) {
            setManualPanelRegions(snapshot.val().manualPanelRegions);
          }

          if (snapshot.val().selectedRegionId !== undefined) {
            setSelectedRegionId(snapshot.val().selectedRegionId);
          }

          if (snapshot.val().totalManualPanels !== undefined) {
            setTotalManualPanels(snapshot.val().totalManualPanels);
          }

          if (snapshot.val().manualPanelEnergy !== undefined) {
            setManualPanelEnergy(snapshot.val().manualPanelEnergy);
          }

          if (snapshot.val().currentRotation !== undefined) {
            setCurrentRotation(snapshot.val().currentRotation);
          }

          // Load manual panel obstructions if they exist in the database
          if (snapshot.val().manualPanelObstructedIds !== undefined) {
            setManualPanelObstructedIds(
              new Set(snapshot.val().manualPanelObstructedIds)
            );
          }

          if (snapshot.val().alignmentSaved !== undefined) {
            setAlignmentSaved(snapshot.val().alignmentSaved);
          }

          if (snapshot.val().autoPanelOffset !== undefined) {
            setAutoPanelOffset(snapshot.val().autoPanelOffset);
          }

          // Option B: Check if imageUrl is missing and fetch if needed
          if (!snapshot.val().imageUrl) {
            console.log(
              "Existing data found, but imageUrl is missing. Fetching from Nearmap."
            );
            const address = userData.address;
            if (address) {
              try {
                const functions = getFunctions();
                const checkAvailabilityFunc = httpsCallable(
                  functions,
                  "checkSurveyAvailability"
                );
                const addressWithoutUSA = address.replace(/, USA$/, "");
                const response = await checkAvailabilityFunc({
                  address: addressWithoutUSA,
                });

                // @ts-ignore
                if (response.data.success && response.data.data?.imageData) {
                  // @ts-ignore
                  const imageData = response.data.data.imageData;
                  // @ts-ignore
                  const contentType =
                    response.data.data.contentType || "image/png";
                  const blob = await fetch(
                    `data:${contentType};base64,${imageData}`
                  ).then((res) => res.blob());

                  const formattedAddress = formatAddressForStorage(address);
                  const imageRef = storageRef(
                    storage,
                    `nearmap-images/${formattedAddress}`
                  );
                  const uploadResult = await uploadBytes(imageRef, blob);
                  const downloadUrl = await getDownloadURL(uploadResult.ref);

                  // @ts-ignore
                  const bbox = response.data.data.surveyData.bbox;
                  const newOverlayBounds = parseBbox(bbox);
                  const newMapCenter = calculateMapCenter(newOverlayBounds);
                  let newRoofData = null;
                  // @ts-ignore
                  if (response.data.data.roofData) {
                    // @ts-ignore
                    newRoofData = response.data.data.roofData;
                  } else {
                    console.log("no roof data found");
                  }

                  // Update state
                  setImageUrl(downloadUrl);
                  setOverlayBounds(newOverlayBounds);

                  // Only update map center if it wasn't already loaded
                  if (!mapCenter) {
                    setMapCenter(newMapCenter);
                  }
                  if (newRoofData) {
                    setRoofData(newRoofData);
                  }

                  // Update database
                  await update(dataRef, {
                    imageUrl: downloadUrl,
                    overlayBounds: newOverlayBounds,
                    mapCenter: mapCenter || newMapCenter, // Use existing or new map center
                    roofData: newRoofData || roofData, // Use new or existing roof data
                  });
                  console.log("Nearmap data fetched and updated successfully.");
                }
              } catch (error) {
                console.error("Error fetching missing Nearmap data:", error);
              }
            } else {
              console.error("Cannot fetch Nearmap data without an address.");
            }
          }
        } else {
          // No existing data, generate new data
          console.log("No existing data, generating new data");

          // Get address from userData
          const address = userData.address;
          if (!address) {
            console.log("No address found");
            return;
          }

          // Get solarData from userData - do this first to ensure we have coordinates
          const solarDataFromUser = userData.solarData;

          // Create placeholder objects for when Nearmap API fails
          let imageUrl = null;
          let overlayBoundsData = { north: 0, south: 0, east: 0, west: 0 };
          let downloadUrl = null;
          let mapCenterData = null;

          // First determine mapCenter using coordinates if available,
          // so we'll have this even if the cloud function fails
          if (
            solarDataFromUser &&
            solarDataFromUser.coordinates &&
            solarDataFromUser.coordinates.latitude &&
            solarDataFromUser.coordinates.longitude
          ) {
            // First priority: Use coordinates from Places API that we passed through
            mapCenterData = {
              lat: solarDataFromUser.coordinates.latitude,
              lng: solarDataFromUser.coordinates.longitude,
            };

            // If we have coordinates but no bounds, create default bounds centered on coordinates
            overlayBoundsData = {
              north: mapCenterData.lat + 0.001,
              south: mapCenterData.lat - 0.001,
              east: mapCenterData.lng + 0.001,
              west: mapCenterData.lng - 0.001,
            };
          } else if (
            solarDataFromUser &&
            solarDataFromUser.center &&
            solarDataFromUser.coordinates.latitude &&
            solarDataFromUser.coordinates.longitude
          ) {
            // Second priority: Use center from solarData
            mapCenterData = {
              lat: solarDataFromUser.coordinates.latitude,
              lng: solarDataFromUser.coordinates.longitude,
            };

            // If we only have center coordinates but no bounds, create default bounds
            overlayBoundsData = {
              north: mapCenterData.lat + 0.001,
              south: mapCenterData.lat - 0.001,
              east: mapCenterData.lng + 0.001,
              west: mapCenterData.lng - 0.001,
            };
          }

          // Try to get the image from Nearmap API
          try {
            console.log("getting image from nearmap api");
            const functions = getFunctions();
            const checkAvailabilityFunc = httpsCallable(
              functions,
              "checkSurveyAvailability"
            );
            // Remove USA country code from address before calling the function
            const addressWithoutUSA = address.replace(/, USA$/, "");
            const response = await checkAvailabilityFunc({
              address: addressWithoutUSA,
            });

            // @ts-ignore - response.data structure is known from NearmapTesting.tsx
            if (response.data.success && response.data.data?.imageData) {
              // @ts-ignore
              const imageData = response.data.data.imageData;
              // @ts-ignore
              const contentType = response.data.data.contentType || "image/png";

              // Create a data URL from the base64 image
              const dataUrl = `data:${contentType};base64,${imageData}`;

              // Convert base64 to blob for storage
              const byteCharacters = atob(imageData);
              const byteArrays = [];
              for (let i = 0; i < byteCharacters.length; i++) {
                byteArrays.push(byteCharacters.charCodeAt(i));
              }
              const blob = new Blob([new Uint8Array(byteArrays)], {
                type: contentType,
              });

              // Create a storage reference with formatted address
              const formattedAddress = formatAddressForStorage(address);
              const imageRef = storageRef(
                storage,
                `nearmap-images/${formattedAddress}`
              );

              // Upload the blob to Firebase Storage
              const uploadResult = await uploadBytes(imageRef, blob);

              // Get the download URL
              downloadUrl = await getDownloadURL(uploadResult.ref);

              // Parse bbox from surveyData
              // @ts-ignore
              const bbox = response.data.data.surveyData.bbox;

              overlayBoundsData = parseBbox(bbox);

              // If we didn't have map center from coordinates, calculate it from bounds
              if (!mapCenterData) {
                mapCenterData = calculateMapCenter(overlayBoundsData);
              }

              // Extract roof data if available
              // @ts-ignore
              if (response.data.data.roofData) {
                console.log("roof data found");
                // @ts-ignore
                const roofDataFromApi = response.data.data.roofData;
                setRoofData(roofDataFromApi);
              } else {
                console.log("no roof data found");
              }
            }
          } catch (error) {
            console.error("Error fetching roof data:", error);

            // We'll continue with whatever mapCenterData we determined earlier
          }

          // Initialize panels based on solarData if available
          let initialPanels: any[] = [];
          if (
            solarDataFromUser &&
            solarDataFromUser.solarPotential &&
            userData.isAutoPanelsSupported &&
            solarDataFromUser.solarPotential.solarPanels
          ) {
            try {
              // Get all possible panels from the solar data
              const allPanels = getAllPanels(solarDataFromUser);

              // Find the best analysis index
              let panelCount = 0;

              // Try to get panel count directly from solarData
              if (solarDataFromUser.solarPotential.solarPanelConfigs) {
                // Find the best analysis using the same logic as in CallToAction
                const validAnalyses = solarDataFromUser.financialAnalyses || [];
                const bestAnalysis = validAnalyses
                  .filter((analysis: any) => analysis.panelConfigIndex >= 0)
                  .reduce((best: any, current: any) => {
                    if (!solarDataFromUser.targetMonthlyBill) {
                      // Fallback to highest savings if no monthly bill provided
                      const currentSavings =
                        current.cashPurchaseSavings?.savings?.savingsYear20
                          ?.units || "0";
                      const bestSavings =
                        best.cashPurchaseSavings?.savings?.savingsYear20
                          ?.units || "0";
                      return parseInt(currentSavings) > parseInt(bestSavings)
                        ? current
                        : best;
                    }

                    // Calculate target monthly bill using the formula: (monthlyBill / 2) + 25
                    const targetBill =
                      solarDataFromUser.targetMonthlyBill / 2 + 25;

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

                if (bestAnalysis) {
                  const selectedConfig =
                    solarDataFromUser.solarPotential.solarPanelConfigs[
                      bestAnalysis.panelConfigIndex
                    ];
                  panelCount = selectedConfig?.panelsCount || 0;
                }
              }

              // Update panels to activate the specified number
              if (panelCount > 0) {
                initialPanels = updateActivePanels(
                  allPanels,
                  panelCount,
                  new Set()
                );
              } else {
                initialPanels = allPanels;
              }
            } catch (err) {
              // Fallback to empty array if there's an error
              initialPanels = [];
            }
          }

          // Calculate annual usage if userData has it, otherwise use default
          const userAnnualUsage =
            userData.annualUsage ||
            (solarDataFromUser &&
            solarDataFromUser.solarPotential &&
            solarDataFromUser.solarPotential.solarPanelConfigs &&
            solarDataFromUser.solarPotential.solarPanelConfigs[0]
              ? solarDataFromUser.solarPotential.solarPanelConfigs[0]
                  .yearlyEnergyDcKwh
              : 12000);

          // Add the isAutoPanelsSupported flag to solarData if it exists in userData
          const updatedSolarData = solarDataFromUser
            ? {
                ...solarDataFromUser,
                isAutoPanelsSupported: userData.isAutoPanelsSupported,
              }
            : null;

          // Ensure isAutoPanelsSupported is defined and force it to false if no solarPanels
          const hasSolarPanelData =
            solarDataFromUser &&
            solarDataFromUser.solarPotential &&
            solarDataFromUser.solarPotential.solarPanels;

          // Force isAutoSupported to false if no solar panel data is available
          const isAutoSupported = hasSolarPanelData
            ? userData.isAutoPanelsSupported !== undefined
              ? userData.isAutoPanelsSupported
              : solarDataFromUser?.isAutoPanelsSupported || false
            : false;

          // Prepare SystemDesign data to save
          const systemDesignData = {
            imageUrl: downloadUrl,
            overlayBounds: overlayBoundsData,
            mapCenter: mapCenterData,
            solarData: updatedSolarData,
            panels: initialPanels, // Use initialized panels instead of empty array
            obstructedPanels: [], // Initialize with empty obstructedPanels array
            annualUsage: userAnnualUsage,
            roofData: roofData, // Add roofData to database
            // Initialize manual panel data
            manualPanelsOn: !isAutoSupported || !hasSolarPanelData || !roofData, // Enable manual panels when no roof data
            manualPanelRegions: [],
            selectedRegionId: null,
            totalManualPanels: 0,
            manualPanelEnergy: 0,
            currentRotation: 0,
            // Initialize manual panel obstructions
            manualPanelObstructedIds: [],
            // Add default values for new fields
            alignmentSaved: false,
            autoPanelOffset: { lat: 0, lng: 0 },
            // Explicitly save isAutoPanelsSupported at the root level
            isAutoPanelsSupported: isAutoSupported,
            // Initialize battery-related data
            selectedBatteryDetails: null,
            batteryCount: 0,
            isBatterySkipped: false,
          };

          // If the node already exists, use update to preserve other fields
          if (snapshot.exists()) {
            console.log("Updating existing user node with SystemDesign data");
            await update(dataRef, systemDesignData);
          } else {
            // If node doesn't exist at all, use set to create it
            console.log("Creating new user node with SystemDesign data");
            await set(dataRef, systemDesignData);
          }

          // Update annualUsage state
          setAnnualUsage(userAnnualUsage);

          // Set state values
          setImageUrl(downloadUrl);
          setOverlayBounds(overlayBoundsData);
          setMapCenter(mapCenterData);
          setSolarData(solarDataFromUser);
          setPanels(initialPanels); // Set panels state with initialized panels
        }
      } catch (error) {}
    };

    fetchOrGenerateData();
  }, [userData.uid]); // Re-run if address or uid changes

  // Handle navigation between steps with improved logging
  const handleContinue = async () => {
    debugger;
    // Change the type to include 'Completion'
    const stages = [
      "Panels",
      "Inverter",
      "Design",
      "Batteries",
      "Overview",
    ] as const;
    type ExtendedStage = (typeof stages)[number]; // This creates a union type from the array
    const currentIndex = stages.indexOf(currentStage as ExtendedStage);

    // Check if payment option is selected when on Overview step
    if (currentStage === "Overview" && !selectedPaymentOption) {
      alert("Please select a payment option to continue.");
      return;
    }

    // If we're on the Overview step and the payment option is "cash", show the Stripe modal
    if (
      currentStage === "Overview" &&
      selectedPaymentOption &&
      window.showStripeModal
    ) {
      // Use the window.showStripeModal function we created in OverviewStep
      const modalShown = window.showStripeModal();
      if (modalShown) {
        return; // Stop here, don't navigate to the next stage
      }
    }
    // 🧪 TEMP TEST: force skip to Batteries if stuck
    if (currentStage === "Design") {
      console.log("🚀 Force jump to Batteries");
      setCurrentStage("Batteries");
      return;
    }
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];

      // Update completed stages to include all previous and the new stage
      const updatedCompletedStages = [
        ...new Set([
          ...completedStages,
          currentStage, // Ensure current stage is marked as completed
          nextStage, // Also mark next stage as completed
        ]),
      ] as ProgressStage[];

      // Save progress with the new values BEFORE updating state
      // This ensures we save the next stage, not the current one
      saveProgressState(nextStage as any, updatedCompletedStages);

      // Update state
      setCurrentStage(nextStage as any);
      setCompletedStages(updatedCompletedStages);
    } else if (currentStage === "Overview") {
      // This is the last stage, mark the process as completed
      setDesignSessionState("completed");
      saveProgressState(currentStage, completedStages);
      alert("Your system design has been submitted successfully!");
    }
  };

  // Safe click handler with debugging
  const handleStageClick = (stage: ProgressStage) => {
    // Only allow navigation to completed stages
    if (completedStages.includes(stage)) {
      // Save progress with the new stage BEFORE updating state
      saveProgressState(stage, completedStages);

      // Update state
      setCurrentStage(stage);
    }
  };

  // Function to get the appropriate button text based on current stage
  const getContinueButtonText = () => {
    switch (currentStage) {
      case "Panels":
        return "Continue with 400W Panels";
      case "Inverter":
        return "Continue with Microinverter";
      case "Batteries":
        // Use the current battery name if available
        if (currentBatteryName) {
          return `Continue with ${currentBatteryName} Battery`;
        }
        return "Continue with Batteries";
      case "Design":
        return "Finalize Design";
      case "Overview":
        return selectedPaymentOption === "cash"
          ? "Continue to Payment"
          : "Submit System Design";
      default:
        return "Continue";
    }
  };

  // Render the appropriate step content
  const renderStepContent = () => {
    return (
      <>
        {currentStage === "Panels" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="panel-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <PanelStep onContinue={handleContinue} />
            </motion.div>
          </AnimatePresence>
        )}
        {currentStage === "Inverter" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="inverter-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <InverterStep onContinue={handleContinue} />
            </motion.div>
          </AnimatePresence>
        )}
        {currentStage === "Batteries" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="batteries-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <BatteriesStep
                onContinue={handleContinue}
                updateCurrentBatteryName={updateCurrentBatteryName}
                selectedBatteryDetails={selectedBatteryDetails}
              />
            </motion.div>
          </AnimatePresence>
        )}
        {currentStage === "Design" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="design-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <DesignStep
                onContinue={handleContinue}
                onFinalizeDesign={handleContinue}
                imageUrl={imageUrl}
                overlayBounds={overlayBounds}
                mapCenter={mapCenter}
                solarData={solarData}
                panels={panels}
                obstructedPanels={obstructedPanels}
                onIncreasePanels={handleIncreasePanels}
                onDecreasePanels={handleDecreasePanels}
                onSetPanels={handleSetPanels}
                onPanelClick={handlePanelClick}
                annualUsage={annualUsage}
                // Battery-related props
                batteryCount={batteryCount}
                setBatteryCount={setBatteryCount}
                isBatterySkipped={isBatterySkipped}
                selectedBatteryDetails={selectedBatteryDetails}
                navigateToBatteriesTab={navigateToBatteriesTab}
                // Manual panel-related props
                manualPanelsOn={manualPanelsOn}
                setManualPanelsOn={setManualPanelsOn}
                manualPanelRegions={manualPanelRegions}
                setManualPanelRegions={setManualPanelRegions}
                selectedRegionId={selectedRegionId}
                setSelectedRegionId={setSelectedRegionId}
                totalManualPanels={totalManualPanels}
                setTotalManualPanels={setTotalManualPanels}
                manualPanelEnergy={manualPanelEnergy}
                setManualPanelEnergy={setManualPanelEnergy}
                currentRotation={currentRotation}
                setCurrentRotation={setCurrentRotation}
                // Pass the isAutoPanelsSupported flag from solarData
                isAutoPanelsSupported={solarData?.isAutoPanelsSupported}
                // Add manual panel obstructions
                manualPanelObstructedIds={manualPanelObstructedIds}
                setManualPanelObstructedIds={setManualPanelObstructedIds}
                // Add alignment saved props
                alignmentSaved={alignmentSaved}
                setAlignmentSaved={setAlignmentSaved}
                // Add autoPanelOffset props
                autoPanelOffset={
                  autoPanelOffset && {
                    lat: autoPanelOffset.lat,
                    lng: autoPanelOffset.lng,
                  }
                }
                setAutoPanelOffset={setAutoPanelOffset}
                // Add roofData prop
                roofData={roofData}
              />
            </motion.div>
          </AnimatePresence>
        )}
        {currentStage === "Overview" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="overview-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <OverviewStep
                onContinue={handleContinue}
                // Pass system configuration details
                totalPanels={totalManualPanels || 0}
                systemSizeKw={((totalManualPanels || 0) * 400) / 1000} // Calculate system size in kW using ONLY manual panels
                batteryCount={batteryCount}
                selectedBatteryDetails={selectedBatteryDetails}
                solarPanelType={
                  panels[0] ? `${panels[0].brand} ${panels[0].model}` : "N/A"
                } // Get panel type
                inverterModel="Microinverter" // Use generic inverter type
                // Add payment option props
                selectedPaymentOption={selectedPaymentOption}
                onSelectPaymentOption={setSelectedPaymentOption}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </>
    );
  };

  // Determine if spotlight should be visible based on current stage
  const isSpotlightVisible = true;

  // If checking profile status, show loading
  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <motion.div
            className="mx-auto w-16 h-16 relative mb-6"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-400 opacity-75"></div>
            <div className="absolute inset-0 rounded-full border-l-2 border-transparent"></div>
            <div className="absolute inset-0 rounded-full border-b-2 border-blue-400 opacity-75"></div>
          </motion.div>
        </div>
      </div>
    );
  }

  // If profile is incomplete, show message
  if (!profileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="mx-auto w-16 h-16 relative mb-6"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="absolute inset-0 rounded-full border-t-2 border-purple-400 opacity-75"></div>
          <div className="absolute inset-0 rounded-full border-l-2 border-transparent"></div>
          <div className="absolute inset-0 rounded-full border-b-2 border-blue-400 opacity-75"></div>
        </motion.div>
      </div>
    );
  }

  // Add effect to detect mobile devices

  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="design-route relative min-h-screen overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Background */}
      <motion.div className="absolute inset-0 z-0 max-w-[2400px] mx-auto overflow-hidden">
        {/* <motion.img
          src="https://i.imgur.com/Hy6j9ar.png"
          alt="Solar Background"
          className="w-full h-[120%] object-cover object-center scale-110"
        /> */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundColor: "rgba(0, 0, 0, 0.38)",
            backdropFilter: "blur(10px)",
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="absolute top-4 right-4 z-[100] flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/40 transition-all duration-200"
      >
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>

      {/* Spotlight effect - only visible for specific stages */}
      {isSpotlightVisible && (
        <>
          {/* Light source in top right corner */}
          <div
            className="absolute z-10 top-0 right-0 w-[100%] h-[100%] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(255, 255, 255, 0.2), transparent 70%)",
              opacity: 0.7,
              mixBlendMode: "screen",
            }}
          />

          {/* Animated light source in top left corner */}
          <motion.div
            className="absolute z-0 top-0 right-0 w-[100%] h-[100%] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(85, 201, 247, 0.2), transparent 70%)",
              mixBlendMode: "screen",
            }}
            animate={{
              opacity: [0.3, 0.3, 0.3],
              background: [
                "radial-gradient(circle at top right, rgba(145, 78, 252, 0.4), transparent 70%)",
                "radial-gradient(circle at top right, rgba(0, 83, 207, 0.6), transparent 70%)",
                "radial-gradient(circle at top right, rgba(145, 78, 252, 0.4), transparent 70%)",
                "radial-gradient(circle at top right, rgba(0, 83, 207, 0.6), transparent 70%)",
                "radial-gradient(circle at top right, rgba(145, 78, 252, 0.4), transparent 70%)",
              ],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Diagonal light beam */}
        </>
      )}

      {/* Session restored notification */}

      {/* Progress Bar with explicit props */}
      <ProgressBar
        currentStage={currentStage}
        onStageClick={handleStageClick}
        completedStages={completedStages}
        className={`absolute ${
          isMobile ? "top-[2%]" : "top-[5%]"
        } left-0 w-full`}
      />

      {/* Step Content */}
      <div
        className={`relative z-5 ${
          isMobile
            ? `pt-[18dvh] max-w-[95dvw] ${
                currentStage === "Design" ? "overflow-y-auto" : ""
              }`
            : "pt-[21dvh] max-w-[88dvw]"
        }  mx-auto`}
      >
        {renderStepContent()}
      </div>

      {/* STANDALONE BUTTON - completely independent from step components */}
      {currentStage === "Batteries" && (
        <AnimatePresence mode="wait">
          <motion.button
            key={`skip-battery-button`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed bottom-[5%] right-[2%] z-50 flex justify-center items-center text-white/60 text-sm"
            whileHover={{
              color: "rgba(255, 255, 255, 1)",
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => {
              setBatteryCount(0);
              setIsBatterySkipped(true);
              setSelectedBatteryDetails(null);
              handleContinue(); // Continue to the next stage
            }}
          >
            Don't need a battery? <span className="underline ml-2 "> Skip</span>
          </motion.button>
        </AnimatePresence>
      )}
      {currentStage !== "Design" && currentStage !== "Batteries" && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`continue-button-${currentStage}`}
            className="fixed bottom-[0%] left-0 right-0 z-30 flex justify-center items-center border-t border-white/10"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute -inset-1 rounded-full"
              animate={{
                opacity: [1, 1, 1],
                scale: [1, 1.03, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1],
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 text-xl blur-[20px] " />
            </motion.div>
            <motion.button
              onClick={handleContinue}
              whileTap={{ scale: 0.98 }}
              className="btn-sheen-full-opacity diagonal-button w-full flex items-center justify-end gap-3 text-white text-xl shadow-xl transition-all duration-300 disabled:opacity-50  relative overflow-hidden"
            >
              {/* Black background with diagonal edge that expands on hover */}
              <div className="diagonal-bg"></div>

              {/* Content container */}
              <div className="relative z-10 flex items-center justify-end w-full">
                <div className="px-8 py-6 flex items-center gap-3 ">
                  <span className="text-white text-xl">
                    {getContinueButtonText()}
                  </span>
                  <ChevronRight className="w-6 h-6 transition-transform duration-300 icon-glow-white" />
                </div>
              </div>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// Panel step component
const PanelStep: React.FC<StepComponentProps> = ({ onContinue }) => {
  return (
    <>
      <DefaultPanelShowcase />
    </>
  );
};

// Inverter step component
const InverterStep: React.FC<StepComponentProps> = ({ onContinue }) => {
  return (
    <>
      <DefaultInverterShowcase />
    </>
  );
};

// Batteries step component
const BatteriesStep: React.FC<StepComponentProps> = ({
  onContinue,
  updateCurrentBatteryName,
  selectedBatteryDetails,
}) => {
  return (
    <>
      <BatteryShowcase
        updateCurrentBatteryName={updateCurrentBatteryName}
        selectedBatteryDetails={selectedBatteryDetails}
        onContinue={onContinue}
      />
    </>
  );
};

// Design step component
const DesignStep: React.FC<StepComponentProps> = ({
  onContinue,
  imageUrl,
  overlayBounds,
  mapCenter,
  solarData,
  panels,
  obstructedPanels,
  onIncreasePanels,
  onDecreasePanels,
  onSetPanels,
  onPanelClick,
  annualUsage,
  // Battery-related props
  batteryCount,
  setBatteryCount,
  isBatterySkipped,
  selectedBatteryDetails,
  navigateToBatteriesTab,
  // Manual panel-related props
  manualPanelsOn,
  setManualPanelsOn,
  manualPanelRegions,
  setManualPanelRegions,
  selectedRegionId,
  setSelectedRegionId,
  totalManualPanels,
  setTotalManualPanels,
  manualPanelEnergy,
  setManualPanelEnergy,
  currentRotation,
  setCurrentRotation,
  // Pass the isAutoPanelsSupported flag from solarData
  isAutoPanelsSupported,
  // Manual panel obstructions
  manualPanelObstructedIds,
  setManualPanelObstructedIds,
  // Add alignment saved props
  alignmentSaved,
  setAlignmentSaved,
  // Add autoPanelOffset props
  autoPanelOffset,
  setAutoPanelOffset,
  // Add roofData prop
  roofData,
}) => {
  return (
    <>
      <NearmapTestingTwo
        onFinalizeDesign={onContinue}
        imageUrl={imageUrl}
        overlayBounds={overlayBounds}
        mapCenter={mapCenter}
        solarData={solarData}
        panels={panels}
        obstructedPanels={obstructedPanels}
        onIncreasePanels={onIncreasePanels}
        onDecreasePanels={onDecreasePanels}
        onSetPanels={onSetPanels}
        onPanelClick={onPanelClick}
        annualUsage={annualUsage}
        // Pass battery-related props
        batteryCount={batteryCount}
        setBatteryCount={setBatteryCount}
        isBatterySkipped={isBatterySkipped}
        selectedBattery={selectedBatteryDetails}
        navigateToBatteriesTab={navigateToBatteriesTab}
        // Pass manual panel-related props
        manualPanelsOn={manualPanelsOn}
        setManualPanelsOn={setManualPanelsOn}
        manualPanelRegions={manualPanelRegions}
        setManualPanelRegions={setManualPanelRegions}
        selectedRegionId={selectedRegionId}
        setSelectedRegionId={setSelectedRegionId}
        totalManualPanels={totalManualPanels}
        setTotalManualPanels={setTotalManualPanels}
        manualPanelEnergy={manualPanelEnergy}
        setManualPanelEnergy={setManualPanelEnergy}
        currentRotation={currentRotation}
        setCurrentRotation={setCurrentRotation}
        // Pass the isAutoPanelsSupported flag from solarData
        isAutoPanelsSupported={isAutoPanelsSupported}
        // Pass manual panel obstructions
        manualPanelObstructedIds={manualPanelObstructedIds}
        setManualPanelObstructedIds={setManualPanelObstructedIds}
        // Add alignment saved props
        alignmentSaved={alignmentSaved}
        setAlignmentSaved={setAlignmentSaved}
        // Add autoPanelOffset props
        autoPanelOffset={
          autoPanelOffset && {
            lat: autoPanelOffset.lat,
            lng: autoPanelOffset.lng,
          }
        }
        setAutoPanelOffset={setAutoPanelOffset}
        // Add roofData prop
        roofData={roofData}
      />
    </>
  );
};

export default SystemDesign;
