import L from 'leaflet';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import Leaflet first - before anything else that needs it
import 'leaflet/dist/leaflet.css';


/*
 * USING MAPBOX TILES WITH LEAFLET
 * 
 * 1. Make sure you have a valid Mapbox access token
 * 
 * 2. Use the L.tileLayer with the Mapbox URL format:
 *    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
 *      attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
 *      id: 'mapbox/satellite-v9',
 *      accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN'
 *    })
 * 
 * 3. Make sure to replace 'YOUR_MAPBOX_ACCESS_TOKEN' with your actual Mapbox token
 * 
 * 4. You can choose different Mapbox styles by changing the 'id' parameter:
 *    - mapbox/satellite-v9 (satellite imagery)
 *    - mapbox/streets-v11 (street map)
 *    - mapbox/outdoors-v11 (terrain map)
 *    - mapbox/light-v10 (light theme)
 *    - mapbox/dark-v10 (dark theme)
 */

// Now it's safe to import React-Leaflet and other Leaflet-dependent modules
import { MapContainer, ImageOverlay, useMap, TileLayer } from 'react-leaflet';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ManualPanelControls } from '../manual';

// Local components
import { LoadingState, ImageLoadingState } from '../ui/loaders';
import { ErrorState } from '../common';
import { ConfigurationDetails } from '../configuration';
import { OffsetSelection } from '../manual/OffsetSelection';
import ManualPanelWrapper, { ManualPanelWrapperRef } from '../manual/ManualPanelWrapper';
import ManualPanelDependencies from '../manual/ManualPanelDependencies';

// Utilities
import { containerVariants, itemVariants } from '../utils/animations';

// Type definitions for Leaflet
type LatLngTuple = [number, number];
type LatLngBoundsLiteral = LatLngTuple[];
type BoundsExpression = LatLngBoundsLiteral;
type LatLng = { lat: number; lng: number };

// Function to calculate sorted panel efficiencies
const calculateSortedPanelEfficiencies = (panels: any[], obstructedPanels: Set<string>): number[] => {
  return [];
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
  // Additional data
  solarData?: any;
  // Auto-generated panels related props
  panels?: any[];
  obstructedPanels?: Set<string>;
  onIncreasePanels?: () => void;
  onDecreasePanels?: () => void;
  onSetPanels?: (newCount: number) => void;
  onPanelClick?: (panel: any) => void;

  isAutoPanelsSupported?: boolean;
  roofData?: any;
  // Alignment related props
  alignmentSaved?: boolean;
  setAlignmentSaved?: (saved: boolean) => void;
  autoPanelOffset?: {lat: number, lng: number};
  setAutoPanelOffset?: (offset: {lat: number, lng: number}) => void;
  // Manual panels related props
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
  // Manual panel obstruction props
  manualPanelObstructedIds?: Set<string>;
  setManualPanelObstructedIds?: (ids: Set<string>) => void;
  // Battery-related props
  batteryCount?: number;
  setBatteryCount?: (count: number) => void;
  isBatterySkipped?: boolean;
  selectedBattery?: any;
  navigateToBatteriesTab?: () => void;
  annualUsage?: number;
}

const NearmapTestingTwo: React.FC<NearmapTestingTwoProps> = ({
  onFinalizeDesign,
  imageUrl: propImageUrl,
  overlayBounds: propOverlayBounds,
  mapCenter: propMapCenter,
  annualUsage: propAnnualUsage,
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
  
  // Manual panel obstruction props
  batteryCount: propBatteryCount,
  setBatteryCount: propSetBatteryCount,
  isBatterySkipped: propIsBatterySkipped,
  selectedBattery: propSelectedBattery,
  navigateToBatteriesTab: propNavigateToBatteriesTab,
  manualPanelObstructedIds: propManualPanelObstructedIds,
  setManualPanelObstructedIds: propSetManualPanelObstructedIds,
}) => {
  const leafletMapRef = useRef<any>(null);
  // State for image and map configuration
  const [imageUrl, setImageUrl] = useState(propImageUrl || null);
  const [imageLoading, setImageLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [annualUsage, setAnnualUsage] = useState(propAnnualUsage || 12000)
  // Debug state for toggling overlay
  const [showImageOverlay, setShowImageOverlay] = useState(true);
  const [imageOpacity, setImageOpacity] = useState(0.8);
  
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

  // Error handling state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add manual panel state
  const [manualPanelsOn, setManualPanelsOn] = useState(false);
  const [totalManualPanels, setTotalManualPanels] = useState(propTotalManualPanels || 0);
  const [manualPanelEnergy, setManualPanelEnergy] = useState(propManualPanelEnergy || 0);
  const [manualPanelRegions, setManualPanelRegions] = useState<any[]>(propManualPanelRegions || []);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(propSelectedRegionId || null);
  const [currentRotation, setCurrentRotation] = useState<number>(propCurrentRotation || 0);
  const manualPanelWrapperRef = useRef<ManualPanelWrapperRef>(null);
  const initialIsMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [viewerKey, setViewerKey] = useState(0); // Add a key to force re-render
  // Add state for manual panel obstructions
  const [localManualPanelObstructedIds, setLocalManualPanelObstructedIds] = useState<Set<string>>(
    propManualPanelObstructedIds || new Set<string>()
  );
  useLayoutEffect(() => {
    const checkIfMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        // Force re-render of viewer component when switching modes
        setViewerKey(prevKey => prevKey + 1);
        // Reset expanded card when switching to/from mobile
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [isMobile]);
  
  // Trigger a global resize event when isMobile changes to force WebGL resize
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isMobile, viewerKey]);
  // UI state
  const [showControls, setShowControls] = useState(true);
  const [obstructionMode, setObstructionMode] = useState(false);
  const [showObstructionHelp, setShowObstructionHelp] = useState(true);
  // State to handle the expand/collapse of the floating Manual Panel Controls card
  const [isManualPanelSectionExpanded, setIsManualPanelSectionExpanded] = useState<boolean>(false);

  // Update values when props change
  useEffect(() => {
    // Update imageUrl without using a default fallback
    setImageUrl(propImageUrl || null);
    console.log(propImageUrl, propMapCenter);
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
  
  // Set loading state to false when image URL is available
  useEffect(() => {
    if (imageUrl) {
      setLoading(false);
    } else if (imageUrl === null && propImageUrl === null) {
      // If both the prop and state are explicitly null, set a timeout to show loading is complete
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000); // Give a short delay to ensure transitions are smooth
      
      return () => clearTimeout(timer);
    }
  }, [imageUrl, propImageUrl]);
  
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
            // Handle error silently
          }
        }
        
     
        
        // Optional: store reference for later removal
      }, 200);
    }
  }, [propImageUrl, propOverlayBounds, L]);
 
  // Update the manualPanelsOn state when the prop changes

  
  // Update the parent component when manualPanelsOn changes

  
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

  // No need to create a separate imperative tile layer
  // We'll use the React-Leaflet TileLayer component instead
  
  // Convert bounds to Leaflet bounds format
  const getLeafletBounds = () => {
    // Create a LatLngBounds instance directly from corner coordinates
    return [
      [overlayBounds.south, overlayBounds.west], // Southwest corner
      [overlayBounds.north, overlayBounds.east]  // Northeast corner
    ] as any; // Use 'any' to avoid type issues
  };

  // Add helper to toggle manual panel controls section (place near other handlers)
  const handleManualPanelSectionToggle = () => {
    setIsManualPanelSectionExpanded(prev => !prev);
  };

  if (loading || imageLoading) {
    return (
      <div className="pt-[20%] flex flex-col items-center justify-center text-white p-4 ">
        <div className="text-center">
          <motion.div 
            className="mx-auto w-16 h-16 relative mb-6"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-400 opacity-75"></div>
            <div className="absolute inset-0 rounded-full border-l-2 border-transparent"></div>
            <div className="absolute inset-0 rounded-full border-b-2 border-blue-400 opacity-75"></div>
          </motion.div>
          <h2 className="text-xl font-semibold mb-4">Loading map data...</h2>
          <p className="text-gray-400">Please wait while we prepare your design interface.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`grid ${obstructionMode ? 'lg:grid-cols-[1fr_0px]' : 'lg:grid-cols-[1fr_380px]'}  transition-all duration-500  ${isMobile ? 'mt-[3dvh] gap-0 px-8' : 'mt-[-5dvh] gap-20'} `}>
          {/* Left column: Map and Controls */}
          <motion.div
            variants={itemVariants}
            className={` rounded-3xl border border-white/10 p-5 shadow-inner shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] ${isMobile?` h-[700px]`: ` h-[78dvh]`} transition-all duration-500 ${obstructionMode ? 'w-full' : ''}`}
          >
            
            <div className="solar-map-container overflow-visible h-full relative rounded-lg ">
              {/* Remove panel button */}
              {/* <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
                <motion.button
                  className={`pointer-events-auto absolute -top-7 right-0 px-5 rounded-full text-sm font-medium transition-all shadow-lg h-11 ${
                    obstructionMode
                      ? 'bg-red-500/20 text-red-400 border border-red-600/40'
                      : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-black/40 hover:text-white'
                  }`}
                  style={{ zIndex: 9999 }} 
                  onClick={handleObstructionModeToggle}
                  whileTap={{ scale: 0.95 }}
                >
                  {obstructionMode ? 'Save Changes' : 'Remove Panels'}
                </motion.button>
              </div> */}
              
              {/* Map component with proper type assertions */}
              <MapContainer
                ref={leafletMapRef}
                style={{
                  height: "100%",
                  width: "100%",
                  border: "none",
                  overflow: "hidden",
                  transition: "width 0.5s ease-in-out",
                  borderRadius: "1rem",
                  background: "transparent", // Ensure background is transparent
                  position: "relative" // Make sure position is set
                }}
                // Using type assertion to satisfy TypeScript
                {...{
                  center: [mapState.center.lat, mapState.center.lng],
                  zoom: mapState.zoom,
                  scrollWheelZoom: true,
                  zoomControl: false, // Disable zoom controls to avoid z-index issues
                  maxZoom: 24,
                  minZoom: 10,
                } as any}
                className="leaflet-container-transparent rounded-xl"
              >
                {/* Add Mapbox TileLayer with properly structured props */}
                <TileLayer
                  url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2Vld2VlZDEyMzQ1IiwiYSI6ImNtYTRtMHl6czA4ZmwybG9sajZ1ZXc4d2gifQ.LlxCetKw2TcQXBOfqt5M-w"
                  // @ts-ignore - TileLayer typing issues
                  attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                  // @ts-ignore - TileLayer typing issues
                  id="mapbox/satellite-v9"
                  // @ts-ignore - TileLayer typing issues
                  accessToken="pk.eyJ1Ijoic2Vld2VlZDEyMzQ1IiwiYSI6ImNtYTRtMHl6czA4ZmwybG9sajZ1ZXc4d2gifQ.LlxCetKw2TcQXBOfqt5M-w" // Replace with your actual Mapbox token
                  // @ts-ignore - TileLayer typing issues
                  tileSize={512}
                  // @ts-ignore - TileLayer typing issues
                  zoomOffset={-1}
                  maxZoom={24}
                />
                
                {/* Leaflet image overlay */}
                {imageUrl && (
                  <ImageOverlay
                    key={imageUrl}
                    url={imageUrl}
                    bounds={getLeafletBounds()}
                    // @ts-ignore - interactive is valid but TypeScript doesn't recognize it
                    interactive={false}
                    opacity={0.8} // Reduce opacity to see if Google layers are underneath
                  />
                )}
                
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
                        This works for manual panels.<br />
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
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
 
                {/* Manual Panel Drawing Component */}
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
                  onRegionSelect={(regionId: number) => {
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

              {/* Floating Manual Panel Controls */}
              <div className={`pointer-events-none absolute ${isMobile ? 'top-[2%] ml-[5%]' : 'top-4 right-4'}  z-[1002] w-[320px] max-w-[80vw]`}>
                <motion.div
                  className="pointer-events-auto overflow-hidden rounded-xl bg-black/80 border border-white/20 "
                >
                  <div
                    className="flex items-center cursor-pointer p-4 relative"
                    onClick={handleManualPanelSectionToggle}
                  >
                    <h3 className="text-white text-sm font-medium w-full text-center">Manual Panel Controls</h3>
                    <motion.div
                      animate={{ rotate: isManualPanelSectionExpanded ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute right-4"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {isManualPanelSectionExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-visible"
                      >
                        <div className="px-4 pb-4">
                          <ManualPanelControls
                            totalManualPanels={totalManualPanels}
                            onResetManualPanels={handleResetManualPanels}
                            onDeleteRegion={handleDeleteRegion}
                            onEnableDrawMode={handleEnableDrawMode}
                            onRotationChange={handleRotationChange}
                            currentRotation={currentRotation}
                            regions={manualPanelRegions}
                            selectedRegionId={selectedRegionId}
                            onRegionSelect={(regionId: number) => manualPanelWrapperRef.current?.handleRegionSelect(regionId)}
                            obstructedPanelIds={localManualPanelObstructedIds}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right column: Configuration Details */}
          <div className={`transition-all duration-500 ${obstructionMode ? 'hidden' : 'block'} ${isMobile ? 'pb-[100px]' : ''}`}>
            {/* @ts-ignore - Adding required props with empty callbacks */}
            <ConfigurationDetails
              stats={{
                totalPanels: 0,  // Changed from totalManualPanels to 0 to prevent double-counting
                totalEnergyDcKwh: manualPanelEnergy || 0,
                roofSegmentSummaries: []
              }}
              obstructedPanels={localManualPanelObstructedIds}
              totalPanels={0}
              panelOptions={[]}
              onSelectPanel={() => {}}
              batteryOptions={[]}
              selectedBattery={propSelectedBattery}
              onSelectBattery={() => {}}
              obstructionMode={obstructionMode}
              onFinalizeDesign={onFinalizeDesign}
              onDecreasePanels={() => {}}
              onIncreasePanels={() => {}}
              isAutoPanelsSupported={false}
              onSetPanels={() => {}}
              batteryCount={propBatteryCount}
              setBatteryCount={propSetBatteryCount}
              isBatterySkipped={propIsBatterySkipped}
              navigateToBatteriesTab={propNavigateToBatteriesTab}
              manualPanelsOn={manualPanelsOn}
              setManualPanelsOn={(value) => setManualPanelsOn(value)}
              totalManualPanels={totalManualPanels}
              manualPanelEnergy={manualPanelEnergy}
              onResetManualPanels={handleResetManualPanels}
              onDeleteRegion={handleDeleteRegion}
              annualUsage={annualUsage}
              onEnableDrawMode={handleEnableDrawMode}
              onRotationChange={handleRotationChange}
              currentRotation={manualPanelWrapperRef.current?.currentRotation || 0}
              manualPanelWrapperRef={manualPanelWrapperRef}
              regions={manualPanelWrapperRef.current?.regions || []}
              selectedRegionId={manualPanelWrapperRef.current?.selectedRegionId}
              onRegionSelect={(regionId: number) => manualPanelWrapperRef.current?.handleRegionSelect(regionId)}
              isMobile={isMobile}
            />
          </div>
        
        </div>
    
    {/* Load manual panel dependencies */}
    <ManualPanelDependencies />
    </>
  );
};

export default NearmapTestingTwo;
