import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, ImageOverlay, useMap, Polygon, Marker, CircleMarker, Popup } from 'react-leaflet';
import proj4 from 'proj4'; // Import proj4 for better coordinate calculations
import { ChevronRight, ChevronLeft, Sun, DollarSign, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import 'leaflet.gridlayer.googlemutant';

// Local components
import solarPanelObject from '../data/solarPanelObject.json'; // Corrected path
import panelOptionsData from '../../products/panels/panel_options.json'; // Corrected path
import batteryOptionsData from '../../products/batteries/battery_options.json'; // Corrected path
import DraggableImageOverlay from '../map/DraggableImageOverlay'; // Corrected path
import { LoadingState, ImageLoadingState } from '../ui/loaders';
import { ErrorState } from '../common';
import { PanelControls } from '../manual/PanelControls'; // Corrected path
import { MapControls, LeafletPanel } from '../map';
import { ConfigurationDetails } from '../configuration';
import { OffsetSelection } from '../manual/OffsetSelection'; // Corrected path
import { SolarPanelShowcase, DefaultPanelShowcase } from '../solar';
import { BatteryShowcase } from '../battery';
import { TechnicalSpecsModal, BatteryTechnicalSpecsModal } from '../ui/modals';
import { ProgressBar } from '../ui/progress';
import ManualPanelWrapper, { ManualPanelWrapperRef } from '../manual/ManualPanelWrapper'; // Corrected path
import ManualPanelDependencies from '../manual/ManualPanelDependencies'; // Corrected path

// Utilities and Libraries
import { getDataLayerUrls } from '../../lib/solar'; // Corrected path
import { getLayer } from '../../lib/layers'; // Corrected path
import { containerVariants, itemVariants } from '../utils/animations'; // Corrected path
import { getPanelCorners } from '../utils/mapHelpers'; // Corrected path
import { getAllPanels, getPanelId, calculateTotalStats, togglePanelActive, updateActivePanels, testDirectBoundaryChecking } from '../utils/panelHelpers'; // Corrected path
import { testPolygonBoundaryChecking } from '../utils/polygonHelpers'; // Corrected path

// Add these type definitions somewhere in your file
type LatLngBoundsExpression = L.LatLngBoundsLiteral | L.LatLngBounds;
type LatLng = { lat: number; lng: number };

// Function to calculate sorted panel efficiencies
const calculateSortedPanelEfficiencies = (panels: any[], obstructedPanels: Set<string>): number[] => {
  return [...panels]
    .filter(panel => !obstructedPanels.has(getPanelId(panel)))
    .sort((a, b) => b.yearlyEnergyDcKwh - a.yearlyEnergyDcKwh)
    .map(panel => panel.yearlyEnergyDcKwh);
};

// Add props for dynamic map data
interface NearmapTestingTwoProps {
  onFinalizeDesign?: () => void;
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
  solarPanelData?: any;
  // Added props for panel state
  panels?: any[];
  obstructedPanels?: Set<string>;
  onIncreasePanels?: () => void;
  onDecreasePanels?: () => void;
  onSetPanels?: (newCount: number) => void;
  onPanelClick?: (panel: any) => void;
  // Added prop for annual usage
  annualUsage?: number;
  // Battery-related props
  batteryCount?: number;
  setBatteryCount?: (count: number) => void;
  isBatterySkipped?: boolean;
  selectedBattery?: any;
  navigateToBatteriesTab?: () => void;
  // Add manual panels related props
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
  // Add flag to indicate if auto panels are supported
  isAutoPanelsSupported?: boolean;
  // Add manual panel obstruction props
  manualPanelObstructedIds?: Set<string>;
  setManualPanelObstructedIds?: (ids: Set<string>) => void;
  // Add alignment saved prop
  alignmentSaved?: boolean;
  setAlignmentSaved?: (saved: boolean) => void;
  // Add autoPanelOffset props
  autoPanelOffset?: {lat: number, lng: number};
  setAutoPanelOffset?: (offset: {lat: number, lng: number}) => void;
  // Add roof data prop
  roofData?: any;
}

const NearmapTestingTwo: React.FC<NearmapTestingTwoProps> = ({
  onFinalizeDesign,
  imageUrl: propImageUrl,
  overlayBounds: propOverlayBounds,
  mapCenter: propMapCenter,
  solarPanelData: propSolarPanelData,
  // Added props
  panels: propPanels,
  obstructedPanels: propObstructedPanels,
  onIncreasePanels,
  onDecreasePanels,
  onSetPanels,
  onPanelClick,
  annualUsage: propAnnualUsage,
  // Battery-related props
  batteryCount: propBatteryCount,
  setBatteryCount: propSetBatteryCount,
  isBatterySkipped: propIsBatterySkipped,
  selectedBattery: propSelectedBattery,
  navigateToBatteriesTab: propNavigateToBatteriesTab,
  // Manual panels props
  manualPanelsOn: propManualPanelsOn,
  setManualPanelsOn: propSetManualPanelsOn,
  manualPanelRegions: propManualPanelRegions,
  setManualPanelRegions: propSetManualPanelRegions,
  selectedRegionId: propSelectedRegionId,
  setSelectedRegionId: propSetSelectedRegionId,
  totalManualPanels: propTotalManualPanels,
  setTotalManualPanels: propSetTotalManualPanels,
  manualPanelEnergy: propManualPanelEnergy,
  setManualPanelEnergy: propSetManualPanelEnergy,
  currentRotation: propCurrentRotation,
  setCurrentRotation: propSetCurrentRotation,
  // Add flag to indicate if auto panels are supported
  isAutoPanelsSupported: propIsAutoPanelsSupported,
  // Add manual panel obstruction props
  manualPanelObstructedIds: propManualPanelObstructedIds,
  setManualPanelObstructedIds: propSetManualPanelObstructedIds,
  // Add alignment saved props
  alignmentSaved: propAlignmentSaved,
  setAlignmentSaved: propSetAlignmentSaved,
  // Add autoPanelOffset props
  autoPanelOffset: propAutoPanelOffset,
  setAutoPanelOffset: propSetAutoPanelOffset,
  // Add roof data prop
  roofData: propRoofData
}) => {
  // State for image and map configuration
  const [imageUrl, setImageUrl] = useState(propImageUrl || null);
  const [imageLoading, setImageLoading] = useState(false); // Always start with loading true
  const [loadProgress, setLoadProgress] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  
  // Default values for overlayBounds and mapState
  const defaultOverlayBounds = {
    north: 26.02399199,
    east: -80.40506498,
    south: 26.02348201,
    west: -80.40530902
  };
  
  const defaultMapState = {
    center: {
      lat: 26.023736995,
      lng: -80.4052021
    },
    zoom: 21
  };
  
  // Use props or default values
  const [overlayBounds, setOverlayBounds] = useState(propOverlayBounds || defaultOverlayBounds);
  const [mapState, setMapState] = useState({
    center: propMapCenter || defaultMapState.center,
    zoom: 21
  });
  const [annualUsage, setAnnualUsage] = useState(propAnnualUsage || 12000); // Use prop or default value
  // Google overlay state
  const [googleImageUrl, setGoogleImageUrl] = useState<string | null>(null);
  const [maskImageUrl, setMaskImageUrl] = useState<string | null>(null);
  const [googleOverlayVisible, setGoogleOverlayVisible] = useState(false);
  const [googleOverlayOpacity, setGoogleOverlayOpacity] = useState(0.5);
  const [isGoogleOverlayDragging, setIsGoogleOverlayDragging] = useState(false);
  const [googleOverlayOffset, setGoogleOverlayOffset] = useState({ x: 0, y: 0 });
  const [isLoadingGoogleData, setIsLoadingGoogleData] = useState(false);
  const [googleOverlayBounds, setGoogleOverlayBounds] = useState<LatLngBoundsExpression | null>(null);
  const [originalOverlayCenter, setOriginalOverlayCenter] = useState<LatLng | null>(null);
  // Add state to track the saved alignment center for visualization
  const [savedAlignmentCenter, setSavedAlignmentCenter] = useState<LatLng | null>(null);
  
  // State to store the lat/lng offsets for panels
  const [latOffset, setLatOffset] = useState(0);
  const [lngOffset, setLngOffset] = useState(0);

  // Update values when props change
  useEffect(() => {
    // Update imageUrl without using a default fallback
    setImageUrl(propImageUrl || null);
    
    if (propOverlayBounds) {
      setOverlayBounds(propOverlayBounds);
    }
    if (propMapCenter) {
      setMapState(prev => ({
        ...prev,
        center: propMapCenter
      }));
    }
  }, [propImageUrl, propOverlayBounds, propMapCenter]);
  
  // Add image preloading effect

  
  // Add an effect to invalidate the map when imageUrl changes
  useEffect(() => {

    
    // Get the map instance
    const map = leafletMapRef.current;
    if (map) {
      // Short delay to let React state update and re-render
      setTimeout(() => {
        // Force the map to recalculate its dimensions
        map.invalidateSize({ animate: true });
        
        // Ensure the bounds are set correctly
        if (propOverlayBounds) {
          try {
            map.fitBounds(getLeafletBounds());
          } catch (e) {

          }
        }
      }, 200);
    }
  }, [propImageUrl, propOverlayBounds]);
  
  // State for solar panel configuration
  const [solarPanelData, setSolarPanelData] = useState<any>(null);
  // Use the isAutoPanelsSupported prop directly instead of inferring it
  const isAutoPanelsSupported = propIsAutoPanelsSupported;
  // Use props for panels and obstructedPanels if provided, otherwise use local state
  const [localPanels, setLocalPanels] = useState<any[]>([]);
  const [localObstructedPanels, setLocalObstructedPanels] = useState<Set<string>>(new Set());

  // Use props if available, otherwise use local state
  const panels = propPanels !== undefined ?  propPanels : localPanels;

  const obstructedPanels = propObstructedPanels !== undefined ? propObstructedPanels : localObstructedPanels;
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for panel selection from SolarPanelShowcase
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  
  // State for technical specifications modal
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  
  // State for battery selection from BatteryShowcase
  const [selectedBattery, setSelectedBattery] = useState<any>(null);
  
  // State for battery technical specifications modal
  const [isBatterySpecsModalOpen, setIsBatterySpecsModalOpen] = useState(false);

  // Layer visibility states
  const [showRoadmap, setShowRoadmap] = useState(true);
  const [showImageOverlay, setShowImageOverlay] = useState(true);
  const [showPanels, setShowPanels] = useState(true);
  
  // Panel adjustment states
  const [usePanelCentering, setUsePanelCentering] = useState(true);
  const [centeringFactor, setCenteringFactor] = useState(2);
  const [obstructionMode, setObstructionMode] = useState(false);
  const [showObstructionHelp, setShowObstructionHelp] = useState(true);
  const [showAlignmentHelp, setShowAlignmentHelp] = useState(true);
  
  // UI state
  const [showControls, setShowControls] = useState(true);
  
  // Add manual panel state
  const [manualPanelsOn, setManualPanelsOn] = useState(propManualPanelsOn || false);
  const [totalManualPanels, setTotalManualPanels] = useState(propTotalManualPanels || 0);
  const [manualPanelEnergy, setManualPanelEnergy] = useState(propManualPanelEnergy || 0);
  const [manualPanelRegions, setManualPanelRegions] = useState<any[]>(propManualPanelRegions || []);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(propSelectedRegionId || null);
  const [currentRotation, setCurrentRotation] = useState<number>(propCurrentRotation || 0);
  const manualPanelWrapperRef = useRef<ManualPanelWrapperRef>(null);
  
  // Update the manualPanelsOn state when the prop changes
  useEffect(() => {
    if (propManualPanelsOn !== undefined) {
      setManualPanelsOn(propManualPanelsOn);
    }
  }, [propManualPanelsOn]);
  
  // Update the parent component when manualPanelsOn changes
  useEffect(() => {
    if (propSetManualPanelsOn) {
      propSetManualPanelsOn(manualPanelsOn);
    }
  }, [manualPanelsOn]);
  
  // Handle manual panel count changes
  const handleManualPanelCountChange = (count: number) => {
    if (propSetTotalManualPanels) {
      propSetTotalManualPanels(count);
    } else {
      setTotalManualPanels(count);
    }
  };
  
  // Handle manual panel production changes
  const handleManualPanelProductionChange = (production: number) => {
    if (propSetManualPanelEnergy) {
      propSetManualPanelEnergy(production);
    } else {
      setManualPanelEnergy(production);
    }
  };
  
  // Handle manual panel reset
  const handleResetManualPanels = () => {
    if (manualPanelWrapperRef.current) {
      manualPanelWrapperRef.current.resetAllPanels();
    }
  };
  
  // Handle delete region
  const handleDeleteRegion = () => {
    if (manualPanelWrapperRef.current) {
      manualPanelWrapperRef.current.deleteSelectedRegion();
    }
  };
  
  // Handle enable draw mode
  const handleEnableDrawMode = () => {
    if (manualPanelWrapperRef.current) {
      manualPanelWrapperRef.current.enableDrawMode();
    }
  };
  
  // Handle rotation change
  const handleRotationChange = (rotation: number) => {
    // Skip processing if rotation hasn't actually changed
    if (currentRotation === rotation) return;
    
    // Prevent cascading updates during rotation
    const prevRotation = currentRotation;
    
    // Update state first
    if (propSetCurrentRotation) {
      propSetCurrentRotation(rotation);
    } else {
      setCurrentRotation(rotation);
    }
    
    // Apply changes to ManualPanelWrapper but only if it's a significant change
    // This reduces the number of expensive operations
    if (Math.abs(prevRotation - rotation) >= 1 && manualPanelWrapperRef.current) {
      // Throttle calls to handleRotationChange to avoid overloading the system
      manualPanelWrapperRef.current.handleRotationChange(rotation);
    }
  };

  // Create a ref to track the initial panel processing
  const initialPanelProcessingRef = useRef(false);

  useEffect(() => {

    if(propRoofData && propSolarPanelData && propImageUrl && propSolarPanelData && propSolarPanelData.solarPotential && propSolarPanelData.solarPotential.solarPanels) {
     
      
    // Skip if we've already processed the panels to prevent infinite loops
    if (initialPanelProcessingRef.current) {
 
      return;
    }
    
    try {
      // Use prop data if available, otherwise use imported file
      const data = propSolarPanelData || solarPanelObject;
      if (!data) {
        throw new Error('Solar panel data not found');
      }
      
      setSolarPanelData(data);
      
      // Check if panels should be initialized 
     
      
      // Always get roof polygons and filter panels, regardless of whether propPanels exists
  
      const roofPolygons = getRoofPolygons();
      
      
      
      // Run a direct test with the roof polygons to verify boundary checking works
      if (roofPolygons && roofPolygons.length > 0) {
     
        testDirectBoundaryChecking(roofPolygons);
        testPolygonBoundaryChecking(roofPolygons);
      }
      
      // Store the roof polygons to ensure they don't get garbage collected or lost
      const safeRoofPolygons = roofPolygons && Array.isArray(roofPolygons) && roofPolygons.length > 0 
        ? [...roofPolygons] // Create a copy to be extra safe
        : [];
      

      
      // Use local state for variables to ensure they're defined
      const currentPanelScale = PANEL_SCALE_FACTOR || 0.7;
      const currentCenteringEnabled = usePanelCentering !== undefined ? usePanelCentering : true;
      const currentCenteringFactor = centeringFactor || 2;
      const currentLatOffset = LAT_OFFSET || 0;
      const currentLngOffset = LNG_OFFSET || 0;
      
      // Filter all panels first (before any activation/deactivation logic)
      const allRawPanels = propPanels || data?.solarPotential?.solarPanels || [];
    
      
      // Call getAllPanels to get panels within roof boundaries
      const filteredPanels = getAllPanels(
        data,
        propPanels, // Pass existing panels if available
        safeRoofPolygons,
        currentPanelScale,
        currentCenteringEnabled,
        currentCenteringFactor,
        currentLatOffset,
        currentLngOffset
      );
      
      // Get all valid panel IDs (panels within roof boundaries) from the stored property
      // created by getAllPanels function
      const validPanelIds = data._validPanelIds || new Set();
      
    
      
      // Mark that we've processed panels to prevent infinite loops
      initialPanelProcessingRef.current = true;
      
      // Only update local panels when we're managing them internally
      if (onSetPanels && onPanelClick && propPanels) {
        // For parent component control, mark panels outside boundaries as obstructed
        const panelsOutsideBoundaries = propPanels.filter((panel: any) => {
          const panelId = getPanelId(panel);
          return !validPanelIds.has(panelId);
        });
        

        
        // Mark each panel outside boundaries as obstructed
        if (panelsOutsideBoundaries.length > 0) {
          panelsOutsideBoundaries.forEach((panel: any) => {
            const panelId = getPanelId(panel);
            if (!obstructedPanels.has(panelId)) {
      
              onPanelClick(panel); // This will toggle the panel to be obstructed
            }
          });
        }
        
        // Let parent know to update active panel count based on valid panels only
        const activePanelCount = propPanels.filter((panel: any) => {
          const panelId = getPanelId(panel);
          return validPanelIds.has(panelId) && panel.isActiveInCurrentConfig && !obstructedPanels.has(panelId);
        }).length;
        
     
        onSetPanels(activePanelCount);
        setLocalPanels(filteredPanels);
      } else {
        // When we're managing panels locally, just use the filtered panels directly
     
        setLocalPanels(filteredPanels);
      }
      
      // Auto-enable manual panels if no auto panel data is available
      if (!data.solarPotential || !data.solarPotential.solarPanels ||
          data.solarPotential.solarPanels.length === 0) {
        setManualPanelsOn(true);
        if (propSetManualPanelsOn) {
          propSetManualPanelsOn(true);
        }
      }
      setLoading(false);
    } catch (err) {
      // Error case - also auto enable manual panels
      setManualPanelsOn(true);
      if (propSetManualPanelsOn) {
        propSetManualPanelsOn(true);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load solar panel data');

    } finally {
      // Only set loading to false if we're not waiting for an image
      // The imageLoading state will control the overall loading state
      if (!imageUrl) {
        setLoading(false);
      }
    }
  } else {
    setLoading(false);
  }
  }, [propSolarPanelData, propImageUrl, propRoofData]);

  // Add centering animation effect
  // useEffect(() => {
  //   if (centeringFactor === 100) {
  //     const startTime = Date.now();
  //     const duration = 2000; // 2 seconds for the animation
      
  //     const animate = () => {
  //       const elapsed = Date.now() - startTime;
  //       const progress = Math.min(elapsed / duration, 1);
        
  //       // Ease-out function for smoother animation
  //       const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  //       const easedProgress = easeOut(progress);
        
  //       // Calculate current value (100 to 4)
  //       const currentValue = Math.round(100 - (98 * easedProgress));
  //       setCenteringFactor(currentValue);
        
  //       if (progress < 1) {
  //         requestAnimationFrame(animate);
  //       }
  //     };
      
  //     requestAnimationFrame(animate);
  //   }
  // }, []);

  const stats = calculateTotalStats(panels, obstructedPanels);
  
  const handleIncreasePanels = () => {
   
    if (onIncreasePanels) {
      onIncreasePanels();
    } else {
      // Pass the solarPanelData to updateActivePanels to ensure it has access to the valid panel IDs
      const updatedPanels = panels.map(panel => ({
        ...panel,
        solarPanelData: propSolarPanelData // Add reference to solarPanelData for each panel
      }));
      setLocalPanels(updateActivePanels(updatedPanels, stats.totalPanels + 1, obstructedPanels));
    }
  };
  
  const handleSetPanels = (newCount: number) => {
   
    
    if (onSetPanels) {
      onSetPanels(newCount);
    } else {
      // Pass the solarPanelData to updateActivePanels to ensure it has access to the valid panel IDs
      const updatedPanels = panels.map(panel => ({
        ...panel,
        solarPanelData: propSolarPanelData // Add reference to solarPanelData for each panel
      }));
      setLocalPanels(updateActivePanels(updatedPanels, newCount, obstructedPanels));
    }
    
    // Add a timeout to check if panels were updated
 
  };
  
  const handleDecreasePanels = () => {
    if (onDecreasePanels) {
      onDecreasePanels();
    } else {
      // Pass the solarPanelData to updateActivePanels to ensure it has access to the valid panel IDs
      const updatedPanels = panels.map(panel => ({
        ...panel,
        solarPanelData: propSolarPanelData // Add reference to solarPanelData for each panel
      }));
      setLocalPanels(updateActivePanels(updatedPanels, Math.max(0, stats.totalPanels - 1), obstructedPanels));
    }
  };

  const panelWidth = propSolarPanelData?.solarPotential?.panelWidthMeters || 1.045;
  const panelHeight = propSolarPanelData?.solarPotential?.panelHeightMeters || 1.879;

  // Constants for panel positioning
  const PANEL_SPACING = 0.1; // 10cm spacing between panels
  
  // Use state values for offset parameters
  const LAT_OFFSET = latOffset; // Adjust north/south (positive moves north)
  const LNG_OFFSET = lngOffset; // Adjust east/west (positive moves east)

  // Add a scaling factor (e.g., 0.9 for 90% of original size)
  const PANEL_SCALE_FACTOR = 0.7;

  // Normalize helper function for color calculation
  const normalize = (value: number, max: number, min: number) => {
    return (value - min) / (max - min);
  };

  // Helper function to calculate segment center
  const getSegmentCenter = (segmentIndex: number): { lat: number; lng: number } => {
    const segmentPanels = propSolarPanelData.solarPotential.solarPanels.filter(
      (panel: any) => panel.segmentIndex === segmentIndex
    );

    const avgLat =
      segmentPanels.reduce((sum: number, panel: any) => sum + panel.center.latitude, 0) /
      segmentPanels.length;
    const avgLng =
      segmentPanels.reduce((sum: number, panel: any) => sum + panel.center.longitude, 0) /
      segmentPanels.length;

    return { lat: avgLat, lng: avgLng };
  };

  // Adjust panel center positions towards segment center
  const getAdjustedPanelCenter = (panel: any): { lat: number; lng: number } => {
    const segmentCenter = getSegmentCenter(panel.segmentIndex);
    const originalCenter = panel.center;

    // If panel centering is disabled, return original center with only offset
    if (!usePanelCentering) {
      return {
        lat: originalCenter.latitude + LAT_OFFSET,
        lng: originalCenter.longitude + LNG_OFFSET,
      };
    }

    // Calculate centering strength (0-1) from the slider value (0-100)
    const centeringStrength = centeringFactor / 100;

    // Otherwise return adjusted center with user-controlled centering factor
    return {
      lat: segmentCenter.lat + (originalCenter.latitude - segmentCenter.lat) * (1 - centeringStrength) + LAT_OFFSET,
      lng: segmentCenter.lng + (originalCenter.longitude - segmentCenter.lng) * (1 - centeringStrength) + LNG_OFFSET,
    };
  };

  const handlePanelClick = (panel: any) => {
    if (obstructionMode) {
      if (onPanelClick) {
        onPanelClick(panel);
      } else {
        const panelId = getPanelId(panel);
        const newObstructedPanels = new Set(obstructedPanels);
        if (obstructedPanels.has(panelId)) {
          newObstructedPanels.delete(panelId);
        } else {
          newObstructedPanels.add(panelId);
        }
        setLocalObstructedPanels(newObstructedPanels);
      }
    }
    // Non-obstruction mode click functionality removed
  };

  // Add this state to track previously rendered panels
  const [previousPanels, setPreviousPanels] = useState<any[]>([]);
  
  const getCurrentPanelsData = () => {
    // Always show all panels in obstruction mode, otherwise filter out obstructed ones
    if (obstructionMode) {
      // In obstruction mode, only show panels that are within the valid roof boundaries
      return panels.filter(panel => {
        const panelId = getPanelId(panel);
        // Only show panels that are within the valid boundaries (stored in propSolarPanelData._validPanelIds)
        return propSolarPanelData && propSolarPanelData._validPanelIds ? 
               propSolarPanelData._validPanelIds.has(panelId) : true;
      });
    }
    
    // In normal mode, only show non-obstructed panels that are either:
    // 1. Active in current config
    // 2. Were previously active (to allow for smooth transitions)
    // AND are within the valid roof boundaries
    return panels.filter(panel => {
      const panelId = getPanelId(panel);
      const isWithinValidBoundaries = propSolarPanelData && propSolarPanelData._validPanelIds ? 
                                     propSolarPanelData._validPanelIds.has(panelId) : true;
      return !obstructedPanels.has(panelId) && isWithinValidBoundaries;
    });
  };
  
  // Update this effect to track panels between renders
  useEffect(() => {
    // We'll update previousPanels AFTER rendering to ensure new panels are detected
    const timeoutId = setTimeout(() => {
      const currentPanels = getCurrentPanelsData();
      setPreviousPanels(currentPanels);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [propSolarPanelData]);

  // Fix Leaflet's default icon paths
  useEffect(() => {
    // Use type assertion to avoid TypeScript errors
    const iconDefault = L.Icon.Default as any;
    if (iconDefault.prototype._getIconUrl) {
      delete iconDefault.prototype._getIconUrl;
    }
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);
  
  // Create reference for Leaflet map and feature group
  const leafletMapRef = useRef<any>(null);
  
  // Convert bounds to Leaflet bounds format
  const getLeafletBounds = () => {
    return [
      [overlayBounds.south, overlayBounds.west], // Southwest corner
      [overlayBounds.north, overlayBounds.east]  // Northeast corner
    ] as L.LatLngBoundsExpression;
  };
  
  // Function to fetch Google data layers
  const fetchGoogleDataLayers = async () => {
    if (!mapState.center) return;

    try {
      setIsLoadingGoogleData(true);
      // Create a proper Leaflet LatLng object
      const location = new L.LatLng(
        mapState.center.lat,
        mapState.center.lng
      );
      
      // Use a placeholder API key for now - this should be replaced with a real key
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      const dataLayers = await getDataLayerUrls(
        location,
        15, // radius in meters
        apiKey
      );
      
      // Process mask layer
      const maskLayer = await getLayer('mask', dataLayers, apiKey);
      
      // Get the image URL from the render function
      const [imageUrl] = maskLayer.render(true);
      
      // Get the bounds
      const bounds = maskLayer.bounds;
      const googleBounds = [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ] as L.LatLngBoundsExpression;
      
      // Store the data
      setMaskImageUrl(imageUrl);
      setGoogleOverlayBounds(googleBounds);
      setGoogleOverlayVisible(true);
      
      // Store the original center coordinates
      const boundsObj = L.latLngBounds(googleBounds as L.LatLngTuple[]);
   
      setOriginalOverlayCenter(boundsObj.getCenter());
      setOverlayReady(true);
 

    } catch (error) {

      setError('Failed to load Google imagery');
    } finally {
      setIsLoadingGoogleData(false);
      setImageLoading(false);
      // Invalidate the map size to ensure proper rendering after loading
      if (leafletMapRef.current) {
        setTimeout(() => {
          leafletMapRef.current.invalidateSize();
        }, 1300);
      }
    }
  };

  // Helper component to set the view for Leaflet
  
  const handleAlignmentSaved = () => {
    // Toggle obstruction mode
    if (googleOverlayBounds && originalOverlayCenter && leafletMapRef.current) {
      const map = leafletMapRef.current;
      
      // Get the current bounds as LatLngBounds object
      const boundsArray = googleOverlayBounds as L.LatLngTuple[];
      const currentBounds = L.latLngBounds(boundsArray[0], boundsArray[1]);
      
      // Get the current center
      const panelCenter = calculateRoofCenterBasedOnPanels();
      const roofCenter = calculateRoofCenter();
      const currentCenter = currentBounds.getCenter();
     
      
      // Store the current center for visualization
      setSavedAlignmentCenter(currentCenter);
      
      // Apply the visual offset from dragging
      // First convert the current center to pixel coordinates
      const centerPoint = map.latLngToContainerPoint(roofCenter);
      
      // Apply the pixel offset
      const offsetPoint = L.point(
        centerPoint.x ,
        centerPoint.y 
      );
      
      // Convert back to geographic coordinates
      const offsetCenter = map.containerPointToLatLng(offsetPoint);
      
      // Calculate the difference between original and current center
      const latDiff = (roofCenter.lat - panelCenter.lat )/ 2;
      const lngDiff = (roofCenter.lng - panelCenter.lng )/ 2;
      
      // Update the offsets
      setLatOffset(latDiff);
      setLngOffset(lngDiff);
      
      // Also update the calculated roof center to match
      // This ensures perfect alignment between the two centers
      if (propRoofData) {
        // Force recalculation of roof center with the new offsets
        setTimeout(() => {
          const updatedCenter = calculateRoofCenter();
          if (updatedCenter) {
            setCalculatedRoofCenter(updatedCenter);
          }
        }, 100);
      }
      
      // Hide overlay after saving alignment
      setGoogleOverlayVisible(false);
      setGoogleOverlayOffset({ x: 0, y: 0 });
      if (propSetAutoPanelOffset) {
        propSetAutoPanelOffset({ lat: latDiff, lng: lngDiff });
      }
    } else {
      alert("Cannot save alignment: Original center or map not available");
    }
    
    if (propSetAlignmentSaved) {
      propSetAlignmentSaved(true);
    }
    
    // Get the map instance - access it via ref
    const map = leafletMapRef.current;
    if (map) {
      // Short delay to let React state update and re-render
      setTimeout(() => {
        // Force the map to recalculate its dimensions
        map.invalidateSize({ animate: true });
        
        // Pan to center and reset zoom
        map.setView([mapState.center.lat, mapState.center.lng], 22, {
          animate: true,
          duration: 0.5
        });
      }, 600);
    }
  };
  // Function to handle obstruction mode toggle with map resize
  const handleObstructionModeToggle = () => {
    // Toggle obstruction mode
    setObstructionMode(!obstructionMode);
    
    // If manual panel wrapper ref exists, toggle its obstruction mode too
    if (manualPanelWrapperRef.current) {
      manualPanelWrapperRef.current.toggleObstructionMode?.(!obstructionMode);
    }
    
    // Show help dialog when entering obstruction mode
    if (!obstructionMode) {
      setShowObstructionHelp(true);
    }
    
    // Get the map instance - access it via ref
    const map = leafletMapRef.current;
    if (map) {
      // Short delay to let React state update and re-render
      setTimeout(() => {
        // Force the map to recalculate its dimensions
        map.invalidateSize({ animate: true });
        
        // Pan to center and reset zoom
        map.setView([mapState.center.lat, mapState.center.lng], 22, {
          animate: true,
          duration: 0.5
        });
      }, 600);
    }
  };

  // Add CSS for animations
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.innerHTML = `
      .panel-appear {
        animation: panelAppear 0.5s ease-out;
      }
      
      @keyframes panelAppear {
        0% { 
          opacity: 0;
          transform: scale(0.8); 
        }
        70% {
          opacity: 0.9;
          transform: scale(1.05);
        }
        100% { 
          opacity: 1;
          transform: scale(1);
        }
      }
      
      /* Purple flash animation */
      .panel-flash-purple {
        animation: flashPurple 1.2s ease-in-out;
      }
      
      @keyframes flashPurple {
        0%, 100% { fill: inherit; }
        16.67% { fill: #9333ea; }
        33.33% { fill: inherit; }
        50% { fill: #9333ea; }
        66.67% { fill: inherit; }
        83.33% { fill: #9333ea; }
      }
      
      /* Transparent Leaflet container */
      .leaflet-container-transparent {
        background: transparent !important;
      }
      
      .leaflet-container-transparent .leaflet-tile-pane {
        opacity: var(--tile-opacity, 1);
      }
      
      /* Remove Leaflet borders */
      .leaflet-container {
        border: none !important;
      }
      
      /* Remove any other potential borders */
      .leaflet-control-container .leaflet-control {
        border: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add this in an effect or after the map is initialized
  useEffect(() => {
    if (leafletMapRef.current) {
      const googleMutantLayer = L.gridLayer.googleMutant({
                type: 'satellite', // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
                maxZoom: 24,
              })

              .addTo(leafletMapRef.current);
        
      // Optional: store reference for later removal
      return () => {
        if (leafletMapRef.current) {
          leafletMapRef.current.removeLayer(googleMutantLayer);
        }
      };
    }
  }, [leafletMapRef.current]);

  // Update local state from props for manual panels
  useEffect(() => {
    if (propManualPanelRegions !== undefined) {
      setManualPanelRegions(propManualPanelRegions);
    }
  }, [propManualPanelRegions]);

  useEffect(() => {
    if (propSelectedRegionId !== undefined) {
      setSelectedRegionId(propSelectedRegionId);
    }
  }, [propSelectedRegionId]);

  useEffect(() => {
    if (propTotalManualPanels !== undefined) {
      setTotalManualPanels(propTotalManualPanels);
    }
  }, [propTotalManualPanels]);

  useEffect(() => {
    if (propManualPanelEnergy !== undefined) {
      setManualPanelEnergy(propManualPanelEnergy);
    }
  }, [propManualPanelEnergy]);

  useEffect(() => {
    if (propCurrentRotation !== undefined) {
      setCurrentRotation(propCurrentRotation);
    }
  }, [propCurrentRotation]);

  // Add state for offset section expansion
  const [isOffsetSectionExpanded, setIsOffsetSectionExpanded] = useState(true);
  
  // Add function to handle section toggling
  const handleOffsetSectionToggle = () => {
    setIsOffsetSectionExpanded(!isOffsetSectionExpanded);
  };

  // Add state for manual panel obstructions
  const [localManualPanelObstructedIds, setLocalManualPanelObstructedIds] = useState<Set<string>>(
    propManualPanelObstructedIds || new Set<string>()
  );

  // Update local state from props for manual panel obstructions
  useEffect(() => {
    if (propManualPanelObstructedIds !== undefined) {
      setLocalManualPanelObstructedIds(propManualPanelObstructedIds);
    }
  }, [propManualPanelObstructedIds]);

  // Function to handle manual panel obstructions
  const handleManualPanelObstructedPanelsChange = (obstructedIds: Set<string>) => {
    setLocalManualPanelObstructedIds(obstructedIds);
    if (propSetManualPanelObstructedIds) {
      propSetManualPanelObstructedIds(obstructedIds);
    }
  };

  // Add this to ensure data is fetched when navigating back
  useEffect(() => {
    // Check if we should be showing overlay but don't have the data
    if (!propAlignmentSaved && isAutoPanelsSupported && 
        (!maskImageUrl || !googleOverlayBounds)) {
      // Add small delay to ensure map is ready
      setTimeout(() => {
     
        fetchGoogleDataLayers();
        
      }, 1000);
    }
  }, [propAlignmentSaved, isAutoPanelsSupported]);

  const [overlayReady, setOverlayReady] = useState(false);

  // Add function to extract roof outline polygons from roof data
  const getRoofPolygons = (): any[] => {
  
    
    // If no propRoofData, return empty array
    if (!propRoofData) {
    
      return [];
    }
    
    // Handle case where propRoofData is the direct NearmapsAiResponse
    if (propRoofData.features) {
   
      
      // Find features with "Roof" description
      const roofFeatures = propRoofData.features.filter(
        (feature: any) => feature.description === "Roof"
      );
      
      if (roofFeatures.length === 0) {
       
     
        return [];
      }
      

      
      // Type check return value
      const result = roofFeatures;

      return result;
    } 
    // Handle case where propRoofData is just a raw array of features
    else if (Array.isArray(propRoofData)) {
      
      
      // Filter for items with "Roof" description
      const roofFeatures = propRoofData.filter(
        (feature: any) => feature.description === "Roof"
      );
      
      if (roofFeatures.length === 0) {
    
        return [];
      }
      

      // Type check return value
      const result = roofFeatures;

      return result;
    }
    // Handle other formats
    else {

      
      // Try to find a features property
      if (propRoofData.roofData && propRoofData.roofData.features) {
       
        // Recursively call with the found data
        const result = getRoofPolygons.call({propRoofData: propRoofData.roofData});
        
        return result;
      }
      
  
      return [];
    }
  };

  // Calculate the roof center using weighted centroid approach
  const calculateRoofCenter = () => {
    if (!propRoofData || !propRoofData.features) return null;
    
    // Find features with "Roof" description
    const roofFeatures = propRoofData.features.filter(
      (feature: any) => feature.description === "Roof"
    );
    
    if (roofFeatures.length === 0) return null;
    
    // Calculate the bounding box
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    
    roofFeatures.forEach((feature: any) => {
      try {
        if (feature.geometry.type === "Polygon") {
          feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
            const lng = coord[0];
            const lat = coord[1];
            
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          });
        } 
        else if (feature.geometry.type === "MultiPolygon") {
          feature.geometry.coordinates.forEach((polygon: any) => {
            polygon[0].forEach((coord: [number, number]) => {
              const lng = coord[0];
              const lat = coord[1];
              
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
            });
          });
        }
      } catch (e) {
   
      }
    });
    
    return {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    };
  };
  
  // Helper function to calculate polygon area from raw GeoJSON coordinates
  // Uses the shoelace formula (Gauss's area formula)
  const calculatePolygonAreaFromRawCoords = (vertices: [number, number][]) => {
    if (!vertices || vertices.length < 3) return 0;
    
    let area = 0;
    
    // Shoelace formula - works for any polygon, even non-convex ones
    for (let i = 0; i < vertices.length - 1; i++) {
      area += vertices[i][0] * vertices[i+1][1] - vertices[i+1][0] * vertices[i][1];
    }
    
    // Close the loop
    const last = vertices.length - 1;
    area += vertices[last][0] * vertices[0][1] - vertices[0][0] * vertices[last][1];
    
    return Math.abs(area / 2);
  };

  // Calculate polygon centroid using the proper geometric formula for irregular polygons
  // This is the true geometric centroid that works for any polygon
  const calculatePolygonCentroidFromRawCoords = (vertices: [number, number][]) => {
    if (!vertices || vertices.length < 3) {
      return { lat: 0, lng: 0 };
    }
    
    let area = 0;
    let cx = 0;
    let cy = 0;
    
    // Loop through all vertices
    for (let i = 0; i < vertices.length - 1; i++) {
      const p1 = vertices[i];
      const p2 = vertices[i+1];
      
      // Partial cross product - important for the formula
      const crossProduct = p1[0] * p2[1] - p2[0] * p1[1];
      
      // Sum for area calculation
      area += crossProduct;
      
      // Sum for centroid calculation
      cx += (p1[0] + p2[0]) * crossProduct;
      cy += (p1[1] + p2[1]) * crossProduct;
    }
    
    // Complete the loop with the last and first vertices
    const last = vertices.length - 1;
    const first = 0;
    const crossProduct = vertices[last][0] * vertices[first][1] - vertices[first][0] * vertices[last][1];
    area += crossProduct;
    cx += (vertices[last][0] + vertices[first][0]) * crossProduct;
    cy += (vertices[last][1] + vertices[first][1]) * crossProduct;
    
    // Finalize the calculations
    // The area needs to be divided by 2
    area = Math.abs(area / 2);
    
    // The centroid formula uses 6 times the area
    const factor = 1 / (6 * area);
    
    // Calculate the centroid coordinates
    const rawX = cx * factor;
    const rawY = cy * factor;
    
    // Debug the raw values

    
    // FLIP THE SIGNS as requested
    return {
      lat: -rawX,  // Negate Y coordinate
      lng: -rawY  // Negate X coordinate
    };
  };

  // Add a RoofCenter component that displays the center of the roof
  interface RoofCenterProps {
    roofData: any;
  }

  const RoofCenter: React.FC<RoofCenterProps> = ({ roofData }) => {
    // Calculate the center of the roof from the roof data
    const calculateCenter = () => {
      if (!roofData || !roofData.features) return null;
      
      // Find features with "Roof" description
      const roofFeatures = roofData.features.filter(
        (feature: any) => feature.description === "Roof"
      );
      
      if (roofFeatures.length === 0) return null;
      
      // Simple approach: calculate the center of the bounding box
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLng = Infinity;
      let maxLng = -Infinity;
      
      // Collect all coordinates from all polygons
      roofFeatures.forEach((feature: any) => {
        try {
          if (feature.geometry.type === "Polygon") {
            // Process each vertex in the polygon's outer ring
            feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
              // In GeoJSON, coordinates are [longitude, latitude]
              const lng = coord[0];
              const lat = coord[1];
              
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
            });
          } 
          else if (feature.geometry.type === "MultiPolygon") {
            // Process each polygon in the multipolygon
            feature.geometry.coordinates.forEach((polygon: any) => {
              // Process each vertex in the polygon's outer ring
              polygon[0].forEach((coord: [number, number]) => {
                // In GeoJSON, coordinates are [longitude, latitude]
                const lng = coord[0];
                const lat = coord[1];
                
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
              });
            });
          }
        } catch (e) {
          
        }
      });
      
      // Calculate the center
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
  
      
      return {
        lat: centerLat,
        lng: centerLng
      };
    };
    
    const center = calculateCenter();
    
    if (!center) return null;
    
    return (
      <>
        {/* Outer glow */}
        <CircleMarker 
          center={[center.lat, center.lng]}
          pathOptions={{
            radius: 35,
            color: '#FF00FF', // Bright magenta
            weight: 5,
            fillColor: '#8A2BE2',
            fillOpacity: 0.2,
            opacity: 0.7
          }}
        />
        {/* Middle ring */}
        <CircleMarker 
          center={[center.lat, center.lng]}
          pathOptions={{
            radius: 20,
            color: '#FFFFFF',
            weight: 3,
            fillColor: '#FF00FF',
            fillOpacity: 0.4,
            opacity: 0.8
          }}
        />
        {/* Inner circle */}
        <CircleMarker 
          center={[center.lat, center.lng]}
          pathOptions={{
            radius: 10,
            color: '#8A2BE2',
            weight: 2,
            fillColor: '#FFFFFF',
            fillOpacity: 1,
            opacity: 1
          }}
        />
      </>
    );
  };

  // Add a function to calculate center from roof data that mimics Google alignment approach
  const calculateGoogleStyleCenter = () => {
    if (!propRoofData || !propRoofData.features) return null;
    
    // Find features with "Roof" description
    const roofFeatures = propRoofData.features.filter(
      (feature: any) => feature.description === "Roof"
    );
    
    if (roofFeatures.length === 0) return null;
    
    // Create bounds similar to how Google data is processed
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    
    // Process all coordinates from all roof polygons
    roofFeatures.forEach((feature: any) => {
      try {
        if (feature.geometry.type === "Polygon") {
          feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
            const lng = coord[0];
            const lat = coord[1];
            
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          });
        } 
        else if (feature.geometry.type === "MultiPolygon") {
          feature.geometry.coordinates.forEach((polygon: any) => {
            polygon[0].forEach((coord: [number, number]) => {
              const lng = coord[0];
              const lat = coord[1];
              
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
            });
          });
        }
      } catch (e) {
      
      }
    });
    
    // Create a Leaflet bounds object
    const boundsArray = [
      [minLat, minLng], // Southwest corner
      [maxLat, maxLng]  // Northeast corner
    ] as L.LatLngTuple[];
    
    const leafletBounds = L.latLngBounds(boundsArray[0], boundsArray[1]);
    
    // Use Leaflet's directional getter methods to match DraggableImageOverlay's approach
    const south = leafletBounds.getSouth();
    const west = leafletBounds.getWest();
    const north = leafletBounds.getNorth();
    const east = leafletBounds.getEast();
    
    // Recreate the bounds using the directional values, matching the format in onDragEnd
    const newBoundsArray = [
      [south, west], // Southwest corner
      [north, east]  // Northeast corner
    ] as L.LatLngTuple[];
    
    // Create a new bounds object from these directions
    const newLeafletBounds = L.latLngBounds(newBoundsArray[0], newBoundsArray[1]);
    
    // Get the center point using Leaflet's getCenter() method
    const currentCenter = newLeafletBounds.getCenter();
    
    // Apply the stored lat/lng offsets directly if needed
    return {
      lat: currentCenter.lat ,
      lng: currentCenter.lng 
    };
  };

  // Add state for calculated Google-style center from roof data
  const [calculatedRoofCenter, setCalculatedRoofCenter] = useState<LatLng | null>(null);

  // Calculate the Google-style center from roof data
  useEffect(() => {
    if (propRoofData) {
    
      const center = calculateGoogleStyleCenter();
      if (center) {
        setCalculatedRoofCenter(center);
      } else {
      
      }
    }
  }, [propRoofData]);

  // Add state for panel-based roof center
  const [panelBasedRoofCenter, setPanelBasedRoofCenter] = useState<LatLng | null>(null);

  // Function to calculate roof center based on all panels
  const calculateRoofCenterBasedOnPanels = () => {
    if (!propSolarPanelData || !propSolarPanelData.solarPotential || !propSolarPanelData.solarPotential.solarPanels || 
        propSolarPanelData.solarPotential.solarPanels.length === 0) {
      return null;
    }
    
    // Calculate the bounding box of all panel centers
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    
    // Process all panel centers
    propSolarPanelData.solarPotential.solarPanels.forEach((panel: any) => {
      const lat = panel.center.latitude;
      const lng = panel.center.longitude;
      
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });
    
    // Create a bounds array using the same format as in calculateGoogleStyleCenter
    const boundsArray = [
      [minLat, minLng], // Southwest corner
      [maxLat, maxLng]  // Northeast corner
    ] as L.LatLngTuple[];
    
    // Create a Leaflet bounds object
    const leafletBounds = L.latLngBounds(boundsArray[0], boundsArray[1]);
    
    // Use Leaflet's directional getter methods to match DraggableImageOverlay's approach
    const south = leafletBounds.getSouth();
    const west = leafletBounds.getWest();
    const north = leafletBounds.getNorth();
    const east = leafletBounds.getEast();
    
    // Recreate the bounds using the directional values
    const newBoundsArray = [
      [south, west], // Southwest corner
      [north, east]  // Northeast corner
    ] as L.LatLngTuple[];
    
    // Create a new bounds object from these directions
    const newLeafletBounds = L.latLngBounds(newBoundsArray[0], newBoundsArray[1]);
    
    // Get the center point using Leaflet's getCenter() method
    const currentCenter = newLeafletBounds.getCenter();
    
    return {
      lat: currentCenter.lat,
      lng: currentCenter.lng
    };
  };
  
  // Calculate the panel-based roof center
  useEffect(() => {
    if (propSolarPanelData) {
      const center = calculateRoofCenterBasedOnPanels();
      if (center) {
        setPanelBasedRoofCenter(center);
      }
    }
  }, [propSolarPanelData]);

  // Add a helper function to convert GeoJSON features to Leaflet polygon positions
  const getRoofPolygonsForDisplay = () => {
    if (!propRoofData) return [];
    
    // Get roof features using the same logic
    const roofFeatures = getRoofPolygons();
    
    if (!roofFeatures || roofFeatures.length === 0) {
  
      return [];
    }
    
    // Map features to polygon positions for Leaflet display
    return roofFeatures.map((feature: any) => {
      try {
        // Extract coordinates from geometry
        const coordinates = feature.geometry.coordinates;
        
        // Convert coordinates to Leaflet format [lat, lng]
        if (feature.geometry.type === "Polygon") {
          // Return positions for each polygon
          return coordinates.map((ring: any) => 
            ring.map((coord: any) => [coord[1], coord[0]])
          );
        } else if (feature.geometry.type === "MultiPolygon") {
          // Return positions for each polygon in the MultiPolygon
          return coordinates.map((polygon: any) => 
            polygon.map((ring: any) => 
              ring.map((coord: any) => [coord[1], coord[0]])
            )
          );
        } else {
         
          return [];
        }
      } catch (error) {
     
        return [];
      }
    }).filter(positions => positions.length > 0); // Remove any empty arrays
  };

  if (loading || (imageLoading || (!propAlignmentSaved && isAutoPanelsSupported && !overlayReady))) {
    return <ImageLoadingState progress={loadProgress} />;
  }

  
  return (
    <>
    
     <div className={`grid ${obstructionMode || (!propAlignmentSaved && isAutoPanelsSupported ) ? 'lg:grid-cols-[1fr_0px]' : 'lg:grid-cols-[1fr_380px]'} gap-20 transition-all duration-500  mt-[-5dvh]`}>
          {/* Left column: Map and Controls */}
          <motion.div
            variants={itemVariants}
            className={` rounded-3xl border border-white/10 p-10 shadow-inner shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] h-[78dvh] transition-all duration-500 ${obstructionMode ? 'w-full' : ''}`}
          >
            
            <div className="solar-map-container overflow-visible h-full relative rounded-lg pt-6">
              {/* Move the button completely outside and use a higher z-index with !important */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
                <motion.button
                  className={`pointer-events-auto absolute -top-7 right-0 px-5  rounded-full text-sm font-medium transition-all shadow-lg h-11 ${
                    obstructionMode
                      ? 'bg-red-500/20 text-red-400 border border-red-600/40'
                      : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-black/40 hover:text-white'
                  }`}
                  style={{ zIndex: 9999 }} 
                  onClick={() => {
                    propAlignmentSaved
                      ? setObstructionMode(prev => !prev)
                      : handleAlignmentSaved();
                   
                  }}
            
                  whileTap={{ scale: 0.95 }}
                >
                  {obstructionMode ? 'Save Changes' : (!propAlignmentSaved && isAutoPanelsSupported) ? 'Save Alignment' : 'Remove Panels'}
                </motion.button>
                
                {/* Offset Selection - positioned on the left side - only show if auto panels are supported */}
                { (!obstructionMode && isAutoPanelsSupported && propAlignmentSaved) ? (
                  <div className="pointer-events-auto absolute -top-7 left-0">
                    <motion.div
                      className="overflow-hidden rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center h-11 text-gray-300 hover:text-white transition-colors shadow-lg"
                    >
                      <div 
                        className="flex items-center cursor-pointer py-1 px-4 h-full"
                        onClick={handleOffsetSectionToggle}
                      >
                        <h3 className="text-sm font-medium whitespace-nowrap">Energy Offset</h3>
                        {!isOffsetSectionExpanded && (
                          <motion.div
                            animate={{ rotate: 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-2"
                          >
                            <ChevronRight className="h-4 w-4 opacity-70" />
                          </motion.div>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {isOffsetSectionExpanded && (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "auto", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center h-full border-l border-white/10"
                          >
                                                        <div className="flex items-center px-3 space-x-3">
                              <OffsetSelection
                                annualUsage={annualUsage}
                                sortedPanelEfficiencies={calculateSortedPanelEfficiencies(panels, obstructedPanels)}
                                currentPanelCount={calculateTotalStats(panels, obstructedPanels).totalPanels}
                                totalPanels={panels.length}
                                onUpdatePanelCount={handleSetPanels}
                                totalManualPanels={totalManualPanels}
                                manualPanelEnergy={manualPanelEnergy}
                              />
                              <motion.div
                                animate={{ rotate: 0 }}
                                transition={{ duration: 0.3 }}
                                className=" cursor-pointer"
                                onClick={handleOffsetSectionToggle}
                              >
                                <ChevronLeft className="h-4 w-4 opacity-70" />
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                ) : null}
              </div>
              
              {/* Premium map overlay effects */}
      
              
              <MapContainer
                ref={leafletMapRef}
                style={{
                  height: "100%",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  overflow: "hidden",
                  transition: "width 0.5s ease-in-out",
                  borderRadius: "1rem",
                }}
                center={[mapState.center.lat, mapState.center.lng]}
                zoom={mapState.zoom}
                scrollWheelZoom={true}
                zoomControl={true}
                maxZoom={24}
                minZoom={10}
                className="leaflet-container-transparent rounded-xl"
              >
                
                
         
                
                {/* Leaflet image overlay */}
                {showImageOverlay && imageUrl && (
                  <ImageOverlay
                    key={imageUrl} // Add key to force re-rendering when URL changes
                    url={imageUrl}
                    bounds={getLeafletBounds()}
                    opacity={1}
                    zIndex={10}
                  />
                )}
                
                {/* Render roof outlines from Nearmap AI data */}
                {propRoofData && (
                  <>
                    {/* Main roof outline */}
                    {getRoofPolygonsForDisplay().map((positions, index) => (
                      <Polygon
                        key={`roof-outline-${index}`}
                        positions={positions}
                        pathOptions={{
                          color: '#8A2BE2', // Brighter purple (BlueViolet)
                          weight: 3,
                          opacity: 0.8,
                          fill: false
                        }}
                      />
                    ))}
                  </>
                )}
                
                {/* Replace the existing roof center circles with the new component */}
                {/* {propRoofData && <RoofCenter roofData={propRoofData} />} */}
                
                {/* Add visual marker for the saved alignment center */}
                {/* {savedAlignmentCenter && (
                  <CircleMarker 
                    center={[savedAlignmentCenter.lat, savedAlignmentCenter.lng]}
                    pathOptions={{
                      radius: 8,
                      color: '#FF4500', // OrangeRed - highly visible
                      weight: 3,
                      fillColor: '#FFFF00', // Yellow
                      fillOpacity: 0.8,
                      opacity: 1
                    }}
                  >
                    <Popup>
                      Saved Alignment Center<br />
                      Lat: {savedAlignmentCenter.lat.toFixed(6)}<br />
                      Lng: {savedAlignmentCenter.lng.toFixed(6)}
                    </Popup>
                  </CircleMarker>
                )} */}
                
                {/* Add visual marker for the original overlay center */}
                {/* {originalOverlayCenter && (
                  <CircleMarker 
                    center={[originalOverlayCenter.lat, originalOverlayCenter.lng]}
                    pathOptions={{
                      radius: 8,
                      color: '#4169E1', // RoyalBlue
                      weight: 3,
                      fillColor: '#87CEEB', // SkyBlue
                      fillOpacity: 0.8,
                      opacity: 1
                    }}
                  >
                    <Popup>
                      Original Overlay Center<br />
                      Lat: {originalOverlayCenter.lat.toFixed(6)}<br />
                      Lng: {originalOverlayCenter.lng.toFixed(6)}
                    </Popup>
                  </CircleMarker>
                )} */}
                
                {/* If both centers exist, draw a line between them to show the offset */}
                {/* {savedAlignmentCenter && originalOverlayCenter && (
                  <Polygon
                    positions={[
                      [savedAlignmentCenter.lat, savedAlignmentCenter.lng],
                      [originalOverlayCenter.lat, originalOverlayCenter.lng]
                    ]}
                    pathOptions={{
                      color: '#800080', // Purple
                      weight: 2,
                      opacity: 0.8,
                      dashArray: '5, 5' // Dashed line
                    }}
                  />
                )} */}
                
                {/* Add visual marker for the calculated roof center (using Google-style calculation) */}
                {/* {calculatedRoofCenter && (
                  <CircleMarker 
                    center={[calculatedRoofCenter.lat, calculatedRoofCenter.lng]}
                    pathOptions={{
                      radius: 8,
                      color: '#00FF00', // Bright green
                      weight: 3,
                      fillColor: '#32CD32', // Lime green
                      fillOpacity: 0.8,
                      opacity: 1
                    }}
                  >
                    <Popup>
                      Calculated Roof Center<br />
                      (Google-style calculation)<br />
                      Lat: {calculatedRoofCenter.lat.toFixed(6)}<br />
                      Lng: {calculatedRoofCenter.lng.toFixed(6)}
                    </Popup>
                  </CircleMarker>
                )} */}

                {/* If both centers exist, draw a line between them for comparison */}
                {/* {calculatedRoofCenter && savedAlignmentCenter && (
                  <Polygon
                    positions={[
                      [calculatedRoofCenter.lat, calculatedRoofCenter.lng],
                      [savedAlignmentCenter.lat, savedAlignmentCenter.lng]
                    ]}
                    pathOptions={{
                      color: '#008000', // Green
                      weight: 2,
                      opacity: 0.8,
                      dashArray: '10, 5' // Dashed line
                    }}
                  />
                )} */}
                
                {/* Add visual marker for the panel-based roof center */}
                {/* {panelBasedRoofCenter && (
                  <CircleMarker 
                    center={[panelBasedRoofCenter.lat, panelBasedRoofCenter.lng]}
                    pathOptions={{
                      radius: 8,
                      color: '#FF1493', // Deep Pink
                      weight: 3,
                      fillColor: '#FF69B4', // Hot Pink
                      fillOpacity: 0.8,
                      opacity: 1
                    }}
                  >
                    <Popup>
                      Panel-Based Roof Center<br />
                      Lat: {panelBasedRoofCenter.lat.toFixed(6)}<br />
                      Lng: {panelBasedRoofCenter.lng.toFixed(6)}
                    </Popup>
                  </CircleMarker>
                )} */}
                
                {/* If both centers exist, draw a line between them for comparison */}
                {/* {calculatedRoofCenter && panelBasedRoofCenter && (
                  <Polygon
                    positions={[
                      [calculatedRoofCenter.lat, calculatedRoofCenter.lng],
                      [panelBasedRoofCenter.lat, panelBasedRoofCenter.lng]
                    ]}
                    pathOptions={{
                      color: '#FF1493', // Deep Pink
                      weight: 2,
                      opacity: 0.8,
                      dashArray: '8, 8' // Dashed line
                    }}
                  />
                )} */}
                
                {/* Google Imagery overlay with mask */}
                {/* {googleOverlayVisible && maskImageUrl && googleOverlayBounds && (
                  <DraggableImageOverlay
                    url={maskImageUrl}
                    bounds={googleOverlayBounds}
                    opacity={googleOverlayOpacity}
                    zIndex={20}
                    onDragStart={() => setIsGoogleOverlayDragging(true)}
                    onDragEnd={(newBounds) => {
                      setIsGoogleOverlayDragging(false);
                      setGoogleOverlayBounds([
                        [newBounds.getSouth(), newBounds.getWest()],
                        [newBounds.getNorth(), newBounds.getEast()]
                      ]);
                    }}
                  />
                )} */}
                
                {/* Leaflet Draw for obstructions */}
                {/* Help Modal */}
                {obstructionMode && showObstructionHelp && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1001] p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-md"
                    >
                      <h3 className="text-xl font-light text-white mb-8 text-center">Remove Panels</h3>
                      <p className="text-gray-300 mb-6 text-left">
                        Got something on your roof preventing panels from being placed?<br />
                        Or simply want to remove a panel for any reason?<br />
                        Click on any panel to remove it from any possible configurations. <br />
                        This works for both auto-placed and manual panels.<br />
                        Removed panels will:
                      </p>
                      <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6 pl-8 text-left">
                        <li>Become transparent with a red border </li>
                        <li>Be removed from all configurations</li>
                        <li>Not contribute to energy production</li>
                      </ul>
                      <p className="text-gray-300 mb-8 ">
                        Click a marked panel again to remove the obstruction.
                      </p>
                      <div className="px-5 py-5 pb-3 border-t border-white/10">
                        <div className="relative">
                          <motion.div
                            className="absolute -inset-1 rounded-full z-0"
                            animate={{
                              opacity: [0.4, 0.6, 0.4],
                              scale: [1, 1.03, 1]
                            }}
                            transition={{
                              duration: 6,
                              repeat: Infinity,
                              ease: "easeInOut",
                              times: [0, 0.5, 1]
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[20px]" />
                          </motion.div>
                          <motion.button
                            onClick={() => setShowObstructionHelp(false)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-sheen relative z-10 w-full h-[52px] flex items-center rounded-full justify-center gap-3 px-8 text-white shadow-xl transition-all duration-500 text-sm font-medium tracking-wider group"
                          >
                            Got it
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
                  { !propAlignmentSaved && showAlignmentHelp && isAutoPanelsSupported ? (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1001] p-4 rounded-2xl">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-md"
                    >
                      <h3 className="text-xl font-light text-white mb-8 text-center">Alignment Mode</h3>
                      <p className="text-gray-300 mb-6 text-center">
                      Drag the blue overlay to align as perfectly as possible over your roof. <br />
                      Once you're happy with the alignment, click the "Save Alignment" button. <br />
                      This will help us place your panels as accurately as possible.
                      </p>
                      <div className="px-5 py-5 pb-3 border-t border-white/10">
                        <div className="relative">
                          <motion.div
                            className="absolute -inset-1 rounded-full z-0"
                            animate={{
                              opacity: [0.4, 0.6, 0.4],
                              scale: [1, 1.03, 1]
                            }}
                            transition={{
                              duration: 6,
                              repeat: Infinity,
                              ease: "easeInOut",
                              times: [0, 0.5, 1]
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[20px]" />
                          </motion.div>
                          <motion.button
                            onClick={() => setShowAlignmentHelp(false)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-sheen relative z-10 w-full h-[52px] flex items-center rounded-full justify-center gap-3 px-8 text-white shadow-xl transition-all duration-500 text-sm font-medium tracking-wider group"
                          >
                            Got it
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : null}
                {/* Leaflet solar panels with animation - only show when not in obstruction mode and manual panels are off */}
                {showPanels && !googleOverlayVisible && propSolarPanelData && propSolarPanelData.solarPotential && propSolarPanelData.solarPotential.solarPanels && propSolarPanelData.solarPotential.solarPanels.length > 0 && (
                  <React.Fragment>
                    {getCurrentPanelsData().map((panel, index) => {
                      // Check if this panel was in the previous configuration
                      const isNewPanel = !previousPanels.some(
                        prevPanel =>
                          prevPanel.segmentIndex === panel.segmentIndex &&
                          prevPanel.center.latitude === panel.center.latitude &&
                          prevPanel.center.longitude === panel.center.longitude
                      );
                      
                      return (
                        <LeafletPanel
                          key={index}
                          panel={panel}
                          positions={getPanelCorners(
                            panel,
                            solarPanelData,
                            PANEL_SCALE_FACTOR,
                            usePanelCentering,
                            centeringFactor,
                            LAT_OFFSET,
                            LNG_OFFSET
                          )}
                          obstructionMode={obstructionMode}
                          isObstructed={obstructedPanels.has(getPanelId(panel))}
                          onPanelClick={obstructionMode ? () => handlePanelClick(panel) : undefined}
                        />
                      );
                    })}
                  </React.Fragment>
                )}
                
                {/* Manual Panel Drawing Component - only show when manual panels are on */}
             
                  <ManualPanelWrapper
                    ref={manualPanelWrapperRef}
                    mapRef={leafletMapRef}
                    themeColor="#9333ea" // Use the same purple color theme
                    // Pass props from parent
                    totalPanels={totalManualPanels}
                    totalProduction={manualPanelEnergy}
                    currentRotation={propCurrentRotation || currentRotation}
                    regions={propManualPanelRegions || manualPanelRegions || []}
                    selectedRegionId={propSelectedRegionId || selectedRegionId || null}
                    // Pass callbacks
                    onPanelCountChange={handleManualPanelCountChange}
                    onProductionChange={handleManualPanelProductionChange}
                    onRegionInfoChange={(newRegions) => {
                      // Simple update prevention
                      if (!newRegions) return;
                      
                      // Limit console logging to prevent console spam
                      if (newRegions.length > 0 && newRegions[0].id) {
                      
                      } else if (newRegions.length === 0) {
            
                      }
                      
                      // Make sure we're preserving all the full region data
                      if (propSetManualPanelRegions) {
                        propSetManualPanelRegions(newRegions);
                      } else {
                        setManualPanelRegions(newRegions);
                      }
                      
                      // If regions were deleted and none remain, also update selectedRegionId and totalManualPanels
                      if (newRegions.length === 0) {
                        if (propSetSelectedRegionId) {
                          propSetSelectedRegionId(null);
                        } else {
                          setSelectedRegionId(null);
                        }
                        
                        if (propSetTotalManualPanels) {
                          propSetTotalManualPanels(0);
                        } else {
                          setTotalManualPanels(0);
                        }
                      }
                    }}
                    onRegionSelect={(regionId) => {
                      if (propSetSelectedRegionId) {
                        propSetSelectedRegionId(regionId);
                      } else {
                        setSelectedRegionId(regionId);
                      }
                    }}
                    onRotationChange={(rotation) => {
                      if (propSetCurrentRotation) {
                        propSetCurrentRotation(rotation);
                      } else {
                        setCurrentRotation(rotation);
                      }
                    }}
                    obstructionMode={obstructionMode}
                    obstructedPanelIds={localManualPanelObstructedIds}
                    onObstructedPanelsChange={handleManualPanelObstructedPanelsChange}
                  />
              
              </MapContainer>
              
              {/* Google Overlay Controls */}
        {/* { !propAlignmentSaved && isAutoPanelsSupported &&     <div className="absolute top-2 right-2 bg-black/50 rounded-lg p-2 z-30">
                <div className="flex items-center space-x-2 text-white text-sm">
                  <button
                    className={`px-2 py-1 ${isLoadingGoogleData ? 'bg-orange-600' : 'bg-orange-600'} rounded-md`}
                    onClick={fetchGoogleDataLayers}
                    disabled={isLoadingGoogleData}
                  >
                    {isLoadingGoogleData ? 'Loading...' : 'Load Google Roof Data'}
                  </button>
                  
                  {googleOverlayVisible && (
                    <>
                      <label>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={googleOverlayOpacity}
                        onChange={(e) => setGoogleOverlayOpacity(parseFloat(e.target.value))}
                        className="w-24"
                      />
                      
                      <button
                        className="px-2 py-1 bg-green-600 rounded-md"
                        onClick={() => {
                          // Calculate the offset based on the difference between original and current center
                          if (googleOverlayBounds && originalOverlayCenter && leafletMapRef.current) {
                            const map = leafletMapRef.current;
                            
                            // Get the current bounds as LatLngBounds object
                            const boundsArray = googleOverlayBounds as L.LatLngTuple[];
                            const currentBounds = L.latLngBounds(boundsArray[0], boundsArray[1]);
                            
                            // Get the current center
                            const currentCenter = currentBounds.getCenter();
                            
                            // Apply the visual offset from dragging
                            // First convert the current center to pixel coordinates
                            const centerPoint = map.latLngToContainerPoint(currentCenter);
                            
                            // Apply the pixel offset
                            const offsetPoint = L.point(
                              centerPoint.x + googleOverlayOffset.x,
                              centerPoint.y + googleOverlayOffset.y
                            );
                            
                            // Convert back to geographic coordinates
                            const offsetCenter = map.containerPointToLatLng(offsetPoint);
                            
                            // Calculate the difference between original and current center
                            const latDiff = offsetCenter.lat - originalOverlayCenter.lat;
                            const lngDiff = offsetCenter.lng - originalOverlayCenter.lng;
                            
                            // Update the offsets
                            setLatOffset(latDiff);
                            setLngOffset(lngDiff);
                            
                            console.log('Alignment saved:', {
                              originalCenter: originalOverlayCenter,
                              currentCenter: currentCenter,
                              offsetCenter: offsetCenter,
                              pixelOffset: googleOverlayOffset,
                              latOffset: latDiff,
                              lngOffset: lngDiff
                            });
                            
                            alert(`Alignment saved successfully! Lat offset: ${latDiff.toFixed(6)}, Lng offset: ${lngDiff.toFixed(6)}`);
                            
                            // Hide overlay after saving alignment
                            setGoogleOverlayVisible(false);
                            setGoogleOverlayOffset({ x: 0, y: 0 });
                            handleAlignmentSaved();
                            setAutoPanelOffset({ lat: latDiff, lng: lngDiff });
                          } else {
                            alert("Cannot save alignment: Original center or map not available");
                          }
                        }}
                      >
                        Save Alignment
                      </button>
                      
                      <button
                        className="px-2 py-1 bg-red-600 rounded-md"
                        onClick={() => {
                          setGoogleOverlayVisible(false);
                          setGoogleOverlayOffset({ x: 0, y: 0 });
                        }}
                      >
                        Hide Overlay
                      </button>
                    </>
                  )}
                </div>
              </div>} */}
        
            </div>
          
            {/* Map Controls Section */}
            {/* <MapControls
              showRoadmap={showRoadmap}
              showImageOverlay={showImageOverlay}
              showPanels={showPanels}
              usePanelCentering={usePanelCentering}
              centeringFactor={centeringFactor}
              obstructionMode={obstructionMode}
              onShowRoadmapChange={setShowRoadmap}
              onShowImageOverlayChange={setShowImageOverlay}
              onShowPanelsChange={setShowPanels}
              onUsePanelCenteringChange={setUsePanelCentering}
              onCenteringFactorChange={setCenteringFactor}
              onObstructionModeToggle={() => {
                setObstructionMode(!obstructionMode);
                if (!obstructionMode) {
                  setShowObstructionHelp(true);
                }
              }}
            /> */}
            {/* <div className="solar-panel-showcase">
            <SolarPanelShowcase
              panelData={panelOptionsData}
              selectedPanel={selectedPanel}
              onSelectPanel={setSelectedPanel}
              onViewModels={() => setIsSpecsModalOpen(true)}
            />
            </div> */}
            
            {/* Battery Showcase Section */}
            {/* <div className="battery-showcase mt-6">
            <BatteryShowcase
              batteryData={batteryOptionsData}
              selectedBattery={selectedBattery}
              onSelectBattery={setSelectedBattery}
              onViewModels={() => setIsBatterySpecsModalOpen(true)}
            />
            </div> */}
          </motion.div>

          {/* Right column: Configuration Details */}
          <div className={`transition-all duration-500 ${obstructionMode || (!propAlignmentSaved && isAutoPanelsSupported) ? 'hidden' : 'block'} -mt-[5%]`}>
            <ConfigurationDetails
              stats={calculateTotalStats(panels, obstructedPanels)}
              obstructedPanels={localManualPanelObstructedIds}
              onDecreasePanels={handleDecreasePanels}
              onIncreasePanels={handleIncreasePanels}
              onSetPanels={handleSetPanels}
              totalPanels={panels.length}
              panelOptions={panelOptionsData?.solarPanels || []}
              selectedPanel={selectedPanel}
              onSelectPanel={setSelectedPanel}
              batteryOptions={batteryOptionsData || []}
              selectedBattery={propSelectedBattery || selectedBattery}
              onSelectBattery={setSelectedBattery}
              obstructionMode={obstructionMode}
              onFinalizeDesign={onFinalizeDesign}
              annualUsage={annualUsage}
              sortedPanelEfficiencies={calculateSortedPanelEfficiencies(panels, obstructedPanels)}
              isAutoPanelsSupported={isAutoPanelsSupported}
              batteryCount={propBatteryCount}
              setBatteryCount={propSetBatteryCount}
              isBatterySkipped={propIsBatterySkipped}
              navigateToBatteriesTab={propNavigateToBatteriesTab}
              manualPanelsOn={manualPanelsOn}
              setManualPanelsOn={setManualPanelsOn}
              totalManualPanels={totalManualPanels}
              manualPanelEnergy={manualPanelEnergy}
              onResetManualPanels={handleResetManualPanels}
              onDeleteRegion={handleDeleteRegion}
              onEnableDrawMode={handleEnableDrawMode}
              onRotationChange={handleRotationChange}
              currentRotation={manualPanelWrapperRef.current?.currentRotation || 0}
              manualPanelWrapperRef={manualPanelWrapperRef}
              regions={manualPanelWrapperRef.current?.regions || []}
              selectedRegionId={manualPanelWrapperRef.current?.selectedRegionId}
              onRegionSelect={(regionId) => manualPanelWrapperRef.current?.handleRegionSelect(regionId)}
            />
          </div>
        
        </div>
    
    {/* Load manual panel dependencies */}
    <ManualPanelDependencies />
    </>
  );
};

export default NearmapTestingTwo;
