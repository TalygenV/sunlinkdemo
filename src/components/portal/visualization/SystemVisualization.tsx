import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, ImageOverlay, Polygon, ZoomControl, useMap, Tooltip } from 'react-leaflet';

import { Sun, Battery, Zap } from 'lucide-react';
import { auth, db } from '../../../lib/firebase';
import { ref, get } from 'firebase/database';
import { ReadOnlyPanelRenderer } from './ReadOnlyPanelRenderer';
import { LoadingState } from '../../ui/loaders';
import { getPanelId } from '../../utils/panelHelpers';
import { InstallationProgressTracker, InstallationStage } from '../progress/InstallationProgressTracker';

// Helper for Leaflet types

// Helper to convert bounds to Leaflet bounds format (using basic array type)
const getLeafletBounds = (overlayBounds: any): [[number, number], [number, number]] => {
  if (
    typeof overlayBounds?.south !== 'number' ||
    typeof overlayBounds?.west !== 'number' ||
    typeof overlayBounds?.north !== 'number' ||
    typeof overlayBounds?.east !== 'number'
  ) {
    console.error("Invalid overlayBounds:", overlayBounds);
    return [[0, 0], [0, 0]];
  }
  return [
    [overlayBounds.south, overlayBounds.west], // Southwest corner
    [overlayBounds.north, overlayBounds.east]  // Northeast corner
  ];
};

// Helper to convert GeoJSON features to Leaflet polygon positions (using basic array type)
const getRoofPolygonsForDisplay = (roofData: any): Array<Array<[number, number][] | [number, number][][]>> => {
  if (!roofData || !roofData.features) return [];
  
  // Find features with "Roof" description
  const roofFeatures = roofData.features.filter(
    (feature: any) => feature.description === "Roof"
  );
  
  if (roofFeatures.length === 0) return [];
  
  // Map features to polygon positions for Leaflet display
  return roofFeatures.map((feature: any) => {
    try {
      // Extract coordinates from geometry
      const coordinates = feature.geometry.coordinates;
      
      // Convert coordinates to Leaflet format [lat, lng]
      if (feature.geometry.type === "Polygon") {
        // Return positions for each polygon ring (typically just one outer ring)
        return coordinates.map((ring: Array<[number, number]>) =>
          ring.map((coord: [number, number]): [number, number] => [coord[1], coord[0]]) // Flip lng/lat, return [number, number]
        );
      } else if (feature.geometry.type === "MultiPolygon") {
        // Handle MultiPolygon: an array of Polygons
        return coordinates.map((polygon: Array<Array<[number, number]>>) =>
          polygon.map((ring: Array<[number, number]>) =>
            ring.map((coord: [number, number]): [number, number] => [coord[1], coord[0]]) // Flip lng/lat, return [number, number]
          )
        );
      } else {
        console.warn(`Unsupported geometry type: ${feature.geometry.type}`);
        return [];
      }
    } catch (error) {
      console.error('Error processing roof polygon:', feature, error);
      return [];
    }
  }).filter((positions: any) => positions && positions.length > 0); // Remove any empty/invalid arrays
};

interface SystemVisualizationProps {
  className?: string;
  customerUid?: string; // Optional customer UID for installer portal use
}

/**
 * Customer portal system visualization component
 * Shows a read-only view of the customer's installed solar system
 * Includes imagery, panel placement, and system statistics
 */
export const SystemVisualization: React.FC<SystemVisualizationProps> = ({
  className = '',
  customerUid = '' // If provided, use this instead of current user's UID
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // System data states
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [solarData, setSolarData] = useState<any>(null);
  const [panels, setPanels] = useState<any[]>([]);
  const [obstructedPanels, setObstructedPanels] = useState<Set<string>>(new Set());
  const [roofData, setRoofData] = useState<any>(null);
  const [manualPanelRegions, setManualPanelRegions] = useState<any[]>([]);
  const [autoPanelOffset, setAutoPanelOffset] = useState<{ lat: number; lng: number } | null>(null);
  
  // System stats
  const [systemSizeKw, setSystemSizeKw] = useState<number>(0);
  const [annualProduction, setAnnualProduction] = useState<number>(0);
  const [panelCount, setPanelCount] = useState<number>(0);
  const [batteryCount, setBatteryCount] = useState<number>(0);
  const [selectedBattery, setSelectedBattery] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState<InstallationStage>('siteSurveyApproval');
  
  // Map reference
  const mapRef = useRef<L.Map | null>(null);
  
  // Cleanup effect for the map
  useEffect(() => {
    // Cleanup function for when component unmounts
    return () => {
      if (mapRef.current) {
        // Allow map to be garbage collected
        mapRef.current = null;
      }
    };
  }, []);
  
  // Add Google Maps satellite layer

  
  // Fetch user's system data from Firebase
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        setLoading(true);
        
        let uid;
        
        // If customerUid is provided (installer portal view), use that
        if (customerUid) {
          uid = customerUid;
        } else {
          // Otherwise use current user's UID (customer portal view)
          const user = auth.currentUser;
          if (!user) {
            throw new Error('User not authenticated');
          }
          uid = user.uid;
        }
        
        // Get system data from database using the appropriate UID
        const userRef = ref(db, `users/${uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          
          // Extract system data
          if (userData.imageUrl) setImageUrl(userData.imageUrl);
          if (userData.overlayBounds) setOverlayBounds(userData.overlayBounds);
          if (userData.solarData) setSolarData(userData.solarData);
          if (userData.panels) setPanels(userData.panels);
          if (userData.roofData) setRoofData(userData.roofData);
          if (userData.batteryCount !== undefined) setBatteryCount(userData.batteryCount);
          if (userData.selectedBatteryDetails) setSelectedBattery(userData.selectedBatteryDetails);
          if (userData.autoPanelOffset) setAutoPanelOffset(userData.autoPanelOffset);
          
          // Convert obstructed panels array to Set
          if (userData.obstructedPanels && Array.isArray(userData.obstructedPanels)) {
            setObstructedPanels(new Set(userData.obstructedPanels));
          }
          
          // Extract manual panel regions if available
          if (userData.manualPanelRegions && Array.isArray(userData.manualPanelRegions)) {
            setManualPanelRegions(userData.manualPanelRegions);
          }
          
          // Calculate map center based on panels
          let calculatedCenter = null;
          if (userData.panels && userData.panels.length > 0) {
            let minLat = Infinity;
            let maxLat = -Infinity;
            let minLng = Infinity;
            let maxLng = -Infinity;
            
            userData.panels.forEach((panel: any) => {
              if (panel.center && typeof panel.center.latitude === 'number' && typeof panel.center.longitude === 'number') {
                const lat = panel.center.latitude;
                const lng = panel.center.longitude;
                
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
              }
            });

            if (minLat !== Infinity) { // Check if any valid panels were found
              const boundsArray = [
                [minLat, minLng], // Southwest corner
                [maxLat, maxLng]  // Northeast corner
              ] as [number, number][];
              
              // Create Leaflet bounds using array directly
              // Create bounds using alternative approach to avoid TypeScript errors
              // @ts-ignore - Leaflet types are not fully recognized
              const southWest = new L.LatLng(boundsArray[0][0], boundsArray[0][1]);
              // @ts-ignore - Leaflet types are not fully recognized
              const northEast = new L.LatLng(boundsArray[1][0], boundsArray[1][1]);
              // @ts-ignore - Leaflet types are not fully recognized
              const leafletBounds = new L.LatLngBounds(southWest, northEast);
              const center = leafletBounds.getCenter();
              calculatedCenter = { lat: center.lat, lng: center.lng };
            }
          }

          // Fallback to userData.mapCenter if calculation failed or no panels
          if (calculatedCenter) {
            setMapCenter(calculatedCenter);
          } else if (userData.mapCenter) {
            setMapCenter(userData.mapCenter);
          } else {
            // Handle case where no center can be determined (optional: set default or error)
            console.warn("Could not determine map center from panels or userData.");
            // setMapCenter({ lat: 0, lng: 0 }); // Example default
          }
          
          // Calculate system stats
          calculateSystemStats(userData);
          
          // Determine current installation stage
          if (userData.progress) {
            const stageOrder: InstallationStage[] = [
              'siteSurveyApproval', 
              'hicContract', 
              'installation', 
              'interconnection', 
              'service'
            ];
            
            // Find the last completed stage
            let lastCompletedStageIndex = -1;
            
            for (let i = 0; i < stageOrder.length; i++) {
              const stageName = stageOrder[i];
              if (userData.progress[stageName] && userData.progress[stageName].date) {
                lastCompletedStageIndex = i;
              } else {
                break;
              }
            }
            
            // The current stage is the next one after the last completed
            // If no stages are completed, default to the first stage
            const currentStageIndex = Math.min(lastCompletedStageIndex + 1, stageOrder.length - 1);
            setCurrentStage(stageOrder[currentStageIndex]);
          }
        } else {
          setError('No system data found');
        }
      } catch (err) {
        console.error('Error fetching system data:', err);
        setError('Failed to load system visualization data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSystemData();
  }, []);
  
  // Calculate system stats based on user data (Aligning logic with NearmapTestingTwo)
  const calculateSystemStats = (userData: any) => {
    // Use the obstructedPanels state variable for filtering
    const currentObstructedPanels = userData.obstructedPanels && Array.isArray(userData.obstructedPanels) ? new Set(userData.obstructedPanels) : obstructedPanels;

    const activePanels = userData.panels ? userData.panels.filter((panel: any) => {
      const panelId = getPanelId(panel);
      return panel.isActiveInCurrentConfig &&
        !currentObstructedPanels.has(panelId); // Use the Set for check
    }) : [];
    
    // Set panel count
    setPanelCount(activePanels.length);
    
    // Calculate system size (kW)
    const panelWattage = userData.panels && userData.panels[0]?.wattage ? 
      userData.panels[0].wattage : 400; // Default to 400W if not specified
    
    const totalSystemSizeKw = (activePanels.length * panelWattage) / 1000;
    setSystemSizeKw(totalSystemSizeKw);
    
    // Calculate annual production
    let totalProduction = 0;
    
    // Use panel-specific production data if available
    activePanels.forEach((panel: any) => {
      if (panel.yearlyEnergyDcKwh) {
        totalProduction += panel.yearlyEnergyDcKwh;
      }
    });
    
    // Fall back to estimate based on system size if no panel-specific data
    if (totalProduction === 0 && totalSystemSizeKw > 0) {
      // Estimate 1,300 kWh per kW of system size (average U.S. value)
      totalProduction = totalSystemSizeKw * 1300;
    }
    
    setAnnualProduction(totalProduction);
  };
  
  // Render error state
  if (error) {
    return (
      <div className={`p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-red-500/20 ${className}`}>
        <h3 className="text-xl font-medium text-white mb-2">System Visualization Error</h3>
        <p className="text-white/70">{error}</p>
        <p className="mt-4 text-white/50 text-sm">
          Please contact support if this issue persists.
        </p>
      </div>
    );
  }
  
  // Render loading state
  if (loading) {
    return <LoadingState />;
  }
  
  // Filter out obstructed panels
  const activePanels = panels.filter(panel => {
    const panelId = getPanelId(panel);
    return panel.isActiveInCurrentConfig && !obstructedPanels.has(panelId);
  });
  
  const panelWidth = solarData?.solarPotential?.panelWidthMeters || 1.045;
  const panelHeight = solarData?.solarPotential?.panelHeightMeters || 1.879;
  const latOffset = autoPanelOffset?.lat || 0;
  const lngOffset = autoPanelOffset?.lng || 0;
  
  return (
    <div className={`${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 "
      >
        {/* Map Visualization */}
       
        
        {/* Installation Progress Tracker - Mobile view for all screen sizes */}
        <div className=" rounded-xl shadow-xl">
          <h3 className="text-xl font-medium text-white mb-4 pb-4">Installation Progress</h3>
          
          <InstallationProgressTracker 
            compact={true}
            currentStage={currentStage}
          />
        </div>
        <div className="min-h-[340px]  bg-black/30 rounded-xl overflow-hidden shadow-2xl relative">
          {imageUrl && overlayBounds && mapCenter ? (
            <MapContainer
              style={{
                height: "100%",
                width: "100%",
                background: "transparent",
                borderRadius: "0.75rem",
              }}
              // @ts-ignore - center is a valid prop but TypeScript doesn't recognize it
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={21}
              scrollWheelZoom={true}
              zoomControl={false}
              attributionControl={true}
              maxZoom={24}
              minZoom={10}
              className="leaflet-container-transparent"
              whenCreated={(map: L.Map) => {
                mapRef.current = map;
              }}
            >
              <ZoomControl position="topright" />
              
              {/* Base map tiles */}
            
              
              {/* Aerial imagery */}
              <ImageOverlay
                url={imageUrl}
                bounds={getLeafletBounds(overlayBounds)}
              />
              
              {/* Roof outlines from data - REMOVED */}
              {/* 
              {roofData && getRoofPolygonsForDisplay(roofData).map((polygonSet, polyIndex) => (
                <React.Fragment key={`roof-poly-${polyIndex}`}>
                  {polygonSet.map((positions, ringIndex) => (
                    <Polygon
                      key={`roof-outline-${polyIndex}-${ringIndex}`}
                      positions={positions as [number, number][]} // Ensure positions are valid
                      pathOptions={{
                        color: '#8A2BE2', // Purple outline
                        weight: 3,
                        opacity: 0.8,
                        fillColor: '#8A2BE2', // Purple fill
                        fillOpacity: 0.1, // Slightly transparent fill
                      }}
                    />
                  ))}
                </React.Fragment>
              ))}
              */}
              
              {/* Panel visualization */}
              {activePanels.map((panel) => (
                <ReadOnlyPanelRenderer
                  key={`panel-${getPanelId(panel)}`}
                  panel={panel}
                  solarPanelData={solarData}
                  panelWidth={panelWidth}
                  panelHeight={panelHeight}
                  obstructedPanels={obstructedPanels}
                  latOffset={latOffset}
                  lngOffset={lngOffset}
                  panelScaleFactor={0.7}
                />
              ))}
              
              {/* Manual panel regions visualization */}
              {manualPanelRegions && manualPanelRegions.length > 0 && manualPanelRegions.map((region) => (
                <React.Fragment key={`manual-region-${region.id}`}>
                  {region.solarPanelData && region.solarPanelData.features &&
                    region.solarPanelData.features.map((panel: any, index: number) => {
                      // Create a unique ID for the panel
                      const panelId = panel.properties?.id || `manual-panel-${region.id}-${index}`;
                      
                      // Check if panel is obstructed in its properties
                      const isObstructed = panel.properties?.isObstructed === true;
                      console.log(isObstructed)
                      
                      // Skip if the panel is not marked as active
                      if (panel.properties?.selected === false) {
                        return null;
                      }
                      
                      // Get panel geometry
                      const coords = panel.geometry.coordinates[0];
                      if (!coords || coords.length < 3) return null;
                      
                      // Convert coordinates to Leaflet format [lat, lng]
                      const positions = coords.map((coord: [number, number]) => [coord[1], coord[0]]);
                      
                      // Calculate energy data if available
                      const yearlyEnergyDcKwh = panel.properties?.yearlyEnergyDcKwh || 400; // Default estimate
                      const azimuthDegrees = panel.properties?.azimuthDegrees || 180; // Default south-facing
                            
                      return (
                        <Polygon
                          key={`manual-panel-${region.id}-${index}`}
                          positions={positions}
                          pathOptions={{
                            color: isObstructed ? 'transparent' : '#FFFFFF00', // Grey for obstructed
                            fillColor: isObstructed ? 'transparent' : '#000000', // Transparent for obstructed
                            fillOpacity: isObstructed ? 0 : 0.9, // No fill for obstructed
                            weight: isObstructed ? 1.5 : 1,
                            opacity: isObstructed ? 0.8 : 0 // Visible border for obstructed
                          }}
                        >
                          {/* @ts-ignore - Tooltip props are valid but TypeScript doesn't recognize them */}
                          <Tooltip direction="top" permanent={false} sticky={true}>
                            <div className="text-xs">
                              <p className="font-medium text-gray-900">Panel {panelId}</p>
                              <p className="text-gray-700">
                                Energy: {yearlyEnergyDcKwh?.toFixed(2)} kWh/year
                              </p>
                              <p className="text-gray-700">
                                Azimuth: {azimuthDegrees?.toFixed(1)}°
                              </p>
                            </div>
                          </Tooltip>
                        </Polygon>
                      );
                    })
                  }
                </React.Fragment>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-white/60">System imagery not available</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};