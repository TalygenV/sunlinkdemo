import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw/dist/leaflet.draw.js';
import {
  area, bbox, booleanPointInPolygon, centroid,
  destination, circle, polygon as _polygon
} from '@turf/turf';
import rotate from '@turf/transform-rotate';

// Import types from GeoJSON to avoid conflicts with turf
import { Feature, Point, Polygon } from 'geojson';

// Declare Leaflet.Draw module to fix TypeScript errors
declare module 'leaflet' {
  namespace Draw {
    namespace Event {
      const CREATED: string;
    }
    
    class Polygon {
      constructor(map: L.Map, options?: any);
      enable(): void;
      disable(): void;
    }
  }
  
  namespace Control {
    class Draw extends L.Control {
      constructor(options?: any);
    }
  }
  
  function geoJSON(data: any, options?: any): L.GeoJSON;
  class GeoJSON extends L.Layer {}
  class FeatureGroup extends L.LayerGroup {}
}

// Define types for the component props
interface ManualPanelDrawingProps {
  mapRef: React.RefObject<any>;
  themeColor?: string;
  onRegionsChange?: (regions: Region[]) => void;
  onRegionInfoChange?: (regionInfo: RegionInfo[]) => void;
  onSelectedRegionIdChange?: (id: number | null) => void;
  onTotalPanelsChange?: (count: number) => void;
  initialRegions?: Region[];
  initialRegionInfo?: RegionInfo[];
  initialSelectedRegionId?: number | null;
  initialRotation?: number;
  obstructedPanelIds?: Set<string>;
  onPanelObstruction?: (panelId: string) => void;
}

// Define types for the regions and region info
interface Region {
  id: number;
  coordinates: number[][];
  solarPanelData: any;
  rotation: number;
  selectedPanels: any[];
  selectedIds: { id: number; selected: boolean }[];
}

interface RegionInfo {
  id: number;
  panelCount: number;
  rotation: number;
  shadeStatus: number;
  orientationNumber: number;
  orientation: string;
}

// Define the ref interface
export interface ManualPanelDrawingRef {
  regions: Region[];
  regionInfo: RegionInfo[];
  selectedRegionId: number | null;
  rotation: number;
  totalPanels: number;
  deleteRegion: (regionId: number) => void;
  handleSolarPanelRotation: (newRotation: number) => void;
  enableDrawMode: () => void;
  disableDrawMode: () => void;
  handleRegionButtonClick: (regionId: number) => void;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
}

const ManualPanelDrawing = forwardRef<ManualPanelDrawingRef, ManualPanelDrawingProps>((props, ref) => {
  const {
    mapRef,
    themeColor = '#38cab3',
    onRegionsChange,
    onRegionInfoChange,
    onSelectedRegionIdChange,
    onTotalPanelsChange,
    initialRegions,
    initialRegionInfo,
    initialSelectedRegionId,
    initialRotation,
    obstructedPanelIds = new Set<string>(),
    onPanelObstruction
  } = props;

  // State for regions, region info, and selected region
  const [regions, setRegions] = useState<Region[]>(initialRegions || []);
  const [regionInfo, setRegionInfo] = useState<RegionInfo[]>(initialRegionInfo || []);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(initialSelectedRegionId || null);
  const [rotation, setRotation] = useState<number>(initialRotation || 0);
  const [totalPanels, setTotalPanels] = useState<number>(0);
  const [localObstructedPanelIds, setLocalObstructedPanelIds] = useState<Set<string>>(new Set());

  // Refs for drawing controls and next region ID
  const drawControlRef = useRef<any>(null);
  const nextRegionIdRef = useRef<number>(1);
  const manualPanelLayerRef = useRef<Map<number, L.GeoJSON<any>>>(new Map());
  const polygonDrawRef = useRef<L.Draw.Polygon | null>(null);

  // Constants for panel dimensions
  const panelWidthMeters = 0.8; // Match the auto panel width
  const panelHeightMeters = 1.43; // Match the auto panel height
  const PANEL_SPACING_FACTOR = 1.1; // This will create space between panels 
  const PANEL_SPACING = 0.05; // 10cm spacing between panels

  // Add initialization flag
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize drawing controls
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = mapRef.current;
    
    // Create a feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    mapInstance.addLayer(drawnItems);

    // Create drawing control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          repeatMode: false,
          shapeOptions: {
            lineCap: 'round',
            weight: 4,
            opacity: 1,
            color: themeColor,
            fillColor: 'black',
            fillOpacity: 1,
          },
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
    });
    
    drawControlRef.current = drawControl;
    mapInstance.addControl(drawControlRef.current);

    // Handle polygon creation event
    mapInstance.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layerType === 'polygon' ? event.layer : null;

      if (layer) {
        const polygonCoords = [...layer.getLatLngs()[0]];
        const _coords = polygonCoords.map((coord: any) => [
          Number(coord.lng),
          Number(coord.lat),
        ]);
        const polygonCoordinates = [..._coords, _coords[0]];
        const regionId = nextRegionIdRef.current;
        updateSolarPanels(polygonCoordinates, regionId);
        nextRegionIdRef.current += 1;
      }
    });

    // Create polygon draw handler
    const drawPolygonOptions = {
      allowIntersection: false,
      showArea: true,
      repeatMode: false,
      shapeOptions: {
        lineCap: 'round',
        weight: 4,
        opacity: 1,
        color: themeColor,
        fillColor: 'black',
        fillOpacity: 0.5,
      },
    };
    
    const drawPolygonHandler = new L.Draw.Polygon(
      mapInstance,
      drawPolygonOptions
    );
    
    polygonDrawRef.current = drawPolygonHandler;

    // Cleanup on unmount
    return () => {
      if (mapInstance) {
        mapInstance.removeControl(drawControlRef.current);
        mapInstance.off(L.Draw.Event.CREATED);
      }
    };
  }, [mapRef, themeColor]);

  // Update local state when initialRegions or initialRegionInfo changes
  useEffect(() => {
    if (!isInitializing) return; // Skip after initial load
    
    if (initialRegions && initialRegions.length > 0) {

      
      // Find the highest region ID to set the next ID counter
      const highestId = Math.max(...initialRegions.map(r => r.id), 0);
      nextRegionIdRef.current = highestId + 1;
      
      // Check if initialRegions contains complete data
      const hasCompleteData = initialRegions.some(r => 
        r.coordinates && r.coordinates.length > 0 && r.solarPanelData
      );
      
      if (hasCompleteData) {
        // If regions array is empty, set it directly and recreate panels
        if (regions.length === 0) {
          setRegions(initialRegions);
          
          // Clear any existing layers first
          if (mapRef.current) {
            manualPanelLayerRef.current.forEach(layer => {
              mapRef.current.removeLayer(layer);
            });
            manualPanelLayerRef.current.clear();
            
            // Add panels for each region with complete data
            initialRegions.forEach(region => {
              if (region.coordinates && region.coordinates.length > 0 && region.solarPanelData) {
                addSolarPanelsToMap(region.solarPanelData, region.id);
                
                // Also restore the selected state of panels
                if (region.selectedIds && region.selectedIds.length > 0) {
                  // For each panel, set its correct visibility state
                  const layer = manualPanelLayerRef.current.get(region.id);
                  if (layer) {
                    layer.eachLayer((panelLayer: any) => {
                      const panelId = panelLayer.feature.id;
                      const selectedItem = region.selectedIds.find((item: any) => item.id === panelId);
                      
                      if (selectedItem && !selectedItem.selected) {
                        // If the panel should be invisible, make it transparent
                        panelLayer.setStyle({ fillOpacity: 0 });
                      }
                    });
                  }
                }
              }
            });
          }
          
          // Mark initialization as complete after successful load
          setIsInitializing(false);
        }
      }
    }
  }, [initialRegions, regions.length, mapRef, isInitializing]);

  useEffect(() => {
    if (!isInitializing) return; // Skip after initial load
    
    if (initialRegionInfo && initialRegionInfo.length > 0) {
 
      
      // If regionInfo array is empty, set it directly
      if (regionInfo.length === 0) {
        setRegionInfo(initialRegionInfo);
      }
    }
  }, [initialRegionInfo, regionInfo.length, isInitializing]);

  useEffect(() => {
    if (!isInitializing) return; // Skip after initial load
    
    if (initialSelectedRegionId !== null && initialSelectedRegionId !== undefined) {
      setSelectedRegionId(initialSelectedRegionId);
    }
  }, [initialSelectedRegionId, isInitializing]);

  useEffect(() => {
    if (!isInitializing) return; // Skip after initial load
    
    if (initialRotation !== undefined) {
      setRotation(initialRotation);
    }
  }, [initialRotation, isInitializing]);

  // Update parent component when regions change - with initialization guard
  useEffect(() => {
    if (isInitializing) return; // Skip during initialization
    
    if (onRegionsChange) {
      onRegionsChange(regions);
    }
  }, [regions, onRegionsChange, isInitializing]);

  // Update parent component when region info changes
  useEffect(() => {
    if (isInitializing) return; // Skip during initialization
    
    if (onRegionInfoChange) {
      // Calculate accurate panel counts before sending to parent
      const updatedRegionInfo = regionInfo.map(region => {
        let panelCount = region.panelCount;
        
        // Find the corresponding region in regions array to get actual panel data
        const fullRegion = regions.find(r => r.id === region.id);
        if (fullRegion) {
          // Count visible panels (those without selectedIds or with selected=true)
          if (fullRegion.selectedIds && fullRegion.selectedIds.length > 0) {
            const selectedCount = fullRegion.selectedIds.filter(item => item.selected !== false).length;
            // If no panels are explicitly selected, use the total panel count
            panelCount = selectedCount > 0 ? selectedCount : 
                         (fullRegion.solarPanelData?.features?.length || region.panelCount);
          } else if (fullRegion.solarPanelData && fullRegion.solarPanelData.features) {
            // If no selectedIds array, use all panels from solarPanelData
            panelCount = fullRegion.solarPanelData.features.length;
          }
        }
        
        
        
        return {
          ...region,
          panelCount
        };
      });
      
      onRegionInfoChange(updatedRegionInfo);
    }
  }, [regionInfo, onRegionInfoChange, isInitializing, regions]);

  // Update parent component when selected region changes
  useEffect(() => {
    if (isInitializing) return; // Skip during initialization
    
    if (onSelectedRegionIdChange) {
      onSelectedRegionIdChange(selectedRegionId);
    }
  }, [selectedRegionId, onSelectedRegionIdChange, isInitializing]);

  // Update parent component when total panels change
  useEffect(() => {
    if (isInitializing) return; // Skip during initialization
    
    if (onTotalPanelsChange) {
      onTotalPanelsChange(totalPanels);
    }
  }, [totalPanels, onTotalPanelsChange, isInitializing]);

  // Calculate total panels when region info changes
  useEffect(() => {
    const newTotalPanels = regionInfo.reduce((sum, region) => sum + region.panelCount, 0);
    setTotalPanels(newTotalPanels);
  }, [regionInfo]);

  // Convert meters to degrees for panel dimensions with spacing factor
  const metersToDegrees = (widthMeters: number, heightMeters: number, latitude: number): [number, number] => {
    // Apply spacing factor to create gaps between panels
    const adjustedWidth = widthMeters * PANEL_SPACING_FACTOR;
    const adjustedHeight = heightMeters * PANEL_SPACING_FACTOR;

    const startPoint = [0, latitude]; 

    // Calculate with adjusted dimensions
    const widthDestination = destination(startPoint, adjustedWidth / 1000, 90, {
      units: 'kilometers',
    });
    const heightDestination = destination(startPoint, adjustedHeight / 1000, 0, {
      units: 'kilometers',
    });

    // Calculate the change in degrees
    const widthDegrees = Math.abs(
      widthDestination.geometry.coordinates[0] - startPoint[0]
    );
    const heightDegrees = Math.abs(
      heightDestination.geometry.coordinates[1] - startPoint[1]
    );

    return [widthDegrees, heightDegrees];
  };

  // Check if a panel is completely inside the polygon
  const isPanelInsidePolygon = (
    panelCenter: number[],
    panelWidthMeters: number,
    panelHeightMeters: number,
    latitude: number,
    rotation: number,
    turfPolygon: any
  ): boolean => {
    const [widthDegrees, heightDegrees] = metersToDegrees(
      panelWidthMeters / 2,
      panelHeightMeters / 2,
      latitude
    );

    const corners = [
      [panelCenter[0] - widthDegrees, panelCenter[1] - heightDegrees],
      [panelCenter[0] + widthDegrees, panelCenter[1] - heightDegrees],
      [panelCenter[0] + widthDegrees, panelCenter[1] + heightDegrees],
      [panelCenter[0] - widthDegrees, panelCenter[1] + heightDegrees],
    ];

    // Rotate the corners around the panel center
    const rotatedCorners = corners.map((corner) => {
      const cornerPt = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: corner,
        },
      };
      const centerPt = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: panelCenter,
        },
      };
      const rotatedCorner = rotate(
        cornerPt as any,
        rotation,
        { pivot: centerPt as any }
      );
      return (rotatedCorner as Feature<Point>).geometry.coordinates;
    });

    // Check if all corners are inside the polygon
    return rotatedCorners.every((corner) =>
      booleanPointInPolygon(corner, turfPolygon)
    );
  };

  // Generate solar panels within the polygon
  const generateSolarPanels = (
    turfPolygon: any,
    panelWidthMeters: number,
    panelHeightMeters: number,
    newRotation: number
  ): number[][] => {
    const bounds = bbox(turfPolygon);
    const latitude = (bounds[1] + bounds[3]) / 2;

    // Add spacing to the step size calculation - this is the key change
    const [stepSizeX, stepSizeY] = [
      panelWidthMeters + PANEL_SPACING, 
      panelHeightMeters + PANEL_SPACING
    ];

    const [stepSizeXDegrees, stepSizeYDegrees] = metersToDegrees(
      stepSizeX,
      stepSizeY,
      latitude
    );

    const numCols = Math.ceil((bounds[2] - bounds[0]) / stepSizeXDegrees);
    const numRows = Math.ceil((bounds[3] - bounds[1]) / stepSizeYDegrees);

    const points = [];

    // Generate the grid of panels
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = bounds[0] + stepSizeXDegrees * col;
        const y = bounds[1] + stepSizeYDegrees * row;

        const pt = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [x, y],
          },
        };

        points.push(pt);
      }
    }

    // Rotate the entire grid of panels
    const rotatedPoints = points.map((pt) => {
      return rotate(
        pt as any,
        newRotation,
        {
          pivot: centroid(turfPolygon),
        }
      );
    });

    // Filter out panels outside the polygon
    const filteredPoints = rotatedPoints.filter((rotatedPt) => {
      const panelCenter = (rotatedPt as Feature<Point>).geometry.coordinates;
      return (
        booleanPointInPolygon(rotatedPt, turfPolygon) &&
        isPanelInsidePolygon(
          panelCenter,
          panelWidthMeters,
          panelHeightMeters,
          latitude,
          newRotation,
          turfPolygon
        )
      );
    });

    return filteredPoints.map((filteredPt) => (filteredPt as Feature<Point>).geometry.coordinates);
  };

  // Create GeoJSON features for each panel
  const createSolarPanelData = (
    panelCoordinates: number[][],
    panelWidthMeters: number,
    panelHeightMeters: number,
    latitude: number,
    newRotation: number,
    turfPolygon: any
  ): any => {
    const features = panelCoordinates.map((coord, index) => {
      const [widthDegrees, heightDegrees] = metersToDegrees(
        panelWidthMeters / 2,
        panelHeightMeters / 2,
        latitude
      );

      const corners = [
        [
          (coord[0] - widthDegrees).toFixed(7),
          (coord[1] - heightDegrees).toFixed(7),
        ],
        [
          (coord[0] + widthDegrees).toFixed(7),
          (coord[1] - heightDegrees).toFixed(7),
        ],
        [
          (coord[0] + widthDegrees).toFixed(7),
          (coord[1] + heightDegrees).toFixed(7),
        ],
        [
          (coord[0] - widthDegrees).toFixed(7),
          (coord[1] + heightDegrees).toFixed(7),
        ],
      ];

      // Rotate the corners around the panel center
      const rotatedCorners = corners.map((corner) => {
        const cornerPt = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: corner,
          },
        };
        const centerPt = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coord,
          },
        };
        const rotatedCorner = rotate(
          cornerPt as any,
          newRotation,
          {
            pivot: centerPt as any,
          }
        );
        return (rotatedCorner as Feature<Point>).geometry.coordinates;
      });

      rotatedCorners.push(rotatedCorners[0]); // Close the polygon

      // Generate a unique ID for each panel
      const panelId = `manual-panel-${Date.now()}-${index}`;

      return {
        type: 'Feature',
        id: index,
        properties: {
          id: panelId,
          selected: true,
          isObstructed: obstructedPanelIds.has(panelId)
        },
        geometry: {
          type: 'Polygon',
          coordinates: [rotatedCorners],
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features: features,
    };
  };

  // Add solar panels to the map
  const addSolarPanelsToMap = (solarPanelData: any, regionId: number): void => {
    if (!mapRef.current) return;
    if (solarPanelData && solarPanelData.features.length > 0) {
      const mapInstance = mapRef.current;
      
      // Create a GeoJSON layer for the solar panels
      const solarPanelLayer = L.geoJSON(solarPanelData, {
        regionId: regionId,
        style: (feature) => {
          // If the panel is obstructed, use the obstruction style
          if (feature?.properties?.isObstructed || obstructedPanelIds.has(feature?.properties.id)) {
            return {
              color: 'rgba(204, 204, 204, 1)',
              weight: 1.5,
              fillColor: 'transparent',
              fillOpacity: 0,
              opacity: 0.8
            };
          }
          
          // Default style
          return {
            color: "transparent",
            weight: 1.5,
            fillColor: '#000000',
            fillOpacity: 0.8,
          };
        },
        onEachFeature: (feature, layer) => {
          layer.on({
            click: (event: any) => {
              const panelId = feature.properties.id;
              
              if (onPanelObstruction) {
                onPanelObstruction(panelId);
              } else {
                // Maintain local set of obstructed panels if no callback provided
                const newObstructedPanelIds = new Set(localObstructedPanelIds);
                if (localObstructedPanelIds.has(panelId)) {
                  newObstructedPanelIds.delete(panelId);
                } else {
                  newObstructedPanelIds.add(panelId);
                }
                setLocalObstructedPanelIds(newObstructedPanelIds);
              }
              
              // Toggle the visual appearance immediately for better UX
              const isCurrentlyObstructed = feature?.properties?.isObstructed ||
                                           obstructedPanelIds.has(panelId) ||
                                           localObstructedPanelIds.has(panelId);
              
              if (feature && feature.properties) {
                feature.properties.isObstructed = !isCurrentlyObstructed;
              }
              
              const newIsObstructed = !isCurrentlyObstructed;
              
              event.target.setStyle({
                color: newIsObstructed ? 'rgba(71, 71, 71, 0.5)' : 'transparent',
                weight: newIsObstructed ? 1.5 : 0,
                fillColor: newIsObstructed ? 'transparent' : '#000000',
                fillOpacity: newIsObstructed ? 0 : 0.8,
                opacity: newIsObstructed ? 0.8 : 0
              });
            },
          });
        },
      });

      // Store the manual panel layer reference
      manualPanelLayerRef.current.set(regionId, solarPanelLayer);
      mapInstance.addLayer(solarPanelLayer);
    }
  };

  // Update solar panels when a polygon is drawn
  const updateSolarPanels = (polygonCoordinates: number[][], regionId: number): void => {
    // Create turfPolygon object
    const turfPolygon = _polygon([polygonCoordinates]);

    const panelCoordinates = generateSolarPanels(
      turfPolygon,
      panelWidthMeters,
      panelHeightMeters,
      parseFloat(rotation.toString())
    );

    const latitude =
      (turfPolygon.geometry.coordinates[0][0][1] +
        turfPolygon.geometry.coordinates[0][2][1]) /
      2;
      
    const solarPanelData = createSolarPanelData(
      panelCoordinates,
      panelWidthMeters,
      panelHeightMeters,
      latitude,
      parseFloat(rotation.toString()),
      turfPolygon
    );

    setRegions((prevRegions) => [
      ...prevRegions,
      {
        id: regionId,
        coordinates: polygonCoordinates,
        solarPanelData,
        rotation,
        selectedPanels: [],
        selectedIds: [],
      },
    ]);
    
    setRegionInfo((prevRegions) => [
      ...prevRegions,
      {
        id: regionId,
        panelCount: Number(solarPanelData.features.length),
        rotation: rotation,
        shadeStatus: 1,
        orientationNumber: 1.08,
        orientation: 'N',
      },
    ]);
    
    setSelectedRegionId(regionId);

    addSolarPanelsToMap(solarPanelData, regionId);
  };

  // Delete a region
  const deleteRegion = (regionId: number): void => {
    if (!mapRef.current) return;
    
    const mapInstance = mapRef.current;
    
    // Remove the layer from the map
    const layerToRemove = manualPanelLayerRef.current.get(regionId);
    if (layerToRemove) {
 
      mapInstance.removeLayer(layerToRemove);
      manualPanelLayerRef.current.delete(regionId);
    } else {
     
    }
    
    // Find all layers with this regionId and remove them
    mapInstance.eachLayer((layer: any) => {
      if (layer.options && layer.options.regionId === regionId) {
     
        mapInstance.removeLayer(layer);
      }
    });
    
    const regionIndex = regions.findIndex((r) => r.id === regionId);
    if (regionIndex === -1) {
   
      return;
    }
    
    // Update selectedRegionId
    if (regions.length === 1) {
      // If this is the last region, set selectedRegionId to null
      setSelectedRegionId(null);
    } else if (regionId === selectedRegionId) {
      // If we're deleting the currently selected region, select another one
      if (regionIndex === 0 && regions.length > 1) {
        setSelectedRegionId(regions[1].id);
      } else {
        setSelectedRegionId(regions[0].id);
      }
    }
    
    // Update regions and regionInfo
  
    setRegions((prev) => prev.filter((r) => r.id !== regionId));
    setRegionInfo((prev) => prev.filter((r) => r.id !== regionId));
  };

  // Update solar panel rotation
  const updateSolarPanelRotation = async (newRotation: number, coordinates: number[][]): Promise<void> => {
    if (!mapRef.current) return;
    
    const turfPolygon = _polygon([coordinates]);

    const panelCoordinates = generateSolarPanels(
      turfPolygon,
      panelWidthMeters,
      panelHeightMeters,
      parseFloat(newRotation.toString())
    );

    let solarPanelData;

    const latitude = (coordinates[0][1] + coordinates[2][1]) / 2;
    solarPanelData = createSolarPanelData(
      panelCoordinates,
      panelWidthMeters,
      panelHeightMeters,
      latitude,
      parseFloat(newRotation.toString()),
      turfPolygon
    );
    
    const mapInstance = mapRef.current;
    mapInstance.eachLayer((layer: any) => {
      if (layer.options && layer.options.regionId === selectedRegionId) {
        mapInstance.removeLayer(layer);
      }
    });

    if (panelCoordinates && solarPanelData && selectedRegionId !== null) {
      addSolarPanelsToMap(solarPanelData, selectedRegionId);
    }

    setRegions((prevRegions) =>
      prevRegions.map((region) =>
        region.id === selectedRegionId
          ? {
              ...region,
              solarPanelData,
              rotation: newRotation,
              selectedIds: [],
            }
          : region
      )
    );
    
    if (solarPanelData.features && selectedRegionId !== null) {
      setRegionInfo((prevRegions) =>
        prevRegions.map((region) =>
          region.id === selectedRegionId
            ? {
                ...region,
                panelCount: solarPanelData.features.length,
              }
            : region
        )
      );
    }
  };

  // Handle solar panel rotation
  const handleSolarPanelRotation = (newRotation: number): void => {
    if (selectedRegionId === null) return;
    
    const region = regions.find((r) => r.id === selectedRegionId);
    if (!region) return;
    
    const coordinates = region.coordinates;
    if (isNaN(newRotation)) return;
    
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        updateSolarPanelRotation(newRotation, coordinates)
      )
    );
  };

  // Enable draw mode
  const enableDrawMode = (): void => {
    // Make sure initialization is complete
    if (isInitializing) {
  
      setIsInitializing(false);
      // Wait a moment for initialization to complete
      setTimeout(() => {
        if (polygonDrawRef.current) {
      
          polygonDrawRef.current.enable();
        } else {
        
        }
      }, 300);
    } else if (polygonDrawRef.current) {
 
      polygonDrawRef.current.enable();
    } else {
   
    }
  };

  // Disable draw mode
  const disableDrawMode = (): void => {
    if (polygonDrawRef.current) {
      polygonDrawRef.current.disable();
    }
  };

  // Handle region button click
  const handleRegionButtonClick = (regionId: number): void => {
    const selectedRegion = regions.find((region) => region.id === regionId);
    if (selectedRegion) {
      setSelectedRegionId(regionId);
      setRotation(selectedRegion.rotation);
    }
  };

  // Function to recreate panels in the map from saved regions
  const recreatePanelsFromSavedRegions = useCallback(() => {
    if (!mapRef.current || regions.length === 0) return;

    // Clear existing layers first
    manualPanelLayerRef.current.forEach((layer) => {
      if (mapRef.current) {
        mapRef.current.removeLayer(layer);
      }
    });
    manualPanelLayerRef.current.clear();

    // Recreate panels for each region
    regions.forEach((region) => {
      if (region.coordinates.length > 0 && region.solarPanelData) {
        // Add panels to map
        addSolarPanelsToMap(region.solarPanelData, region.id);
      } else if (region.id > 0) {
        // For regions without coordinates (placeholder data), set selectedRegionId
        // but don't try to render panels since we don't have the actual data
       
      }
    });
  }, [regions, mapRef]);

  // Effect to recreate panels when regions change or map is available
  useEffect(() => {
    if (mapRef.current && regions.length > 0) {
      recreatePanelsFromSavedRegions();
    }
  }, [recreatePanelsFromSavedRegions, mapRef, regions]);

  // Add effect to complete initialization even when there are no regions
  useEffect(() => {
    // If we're still initializing but there are no regions to load, complete the initialization
    if (isInitializing && (!initialRegions || initialRegions.length === 0)) {
   
      // Small delay to ensure all other effects have a chance to run
      const timeoutId = setTimeout(() => {
        setIsInitializing(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isInitializing, initialRegions]);


  // Add an effect to update the visual appearance of panels when obstructedPanelIds changes
  useEffect(() => {
    // For each region, update the visual appearance of obstructed panels
    regions.forEach(region => {
      const layer = manualPanelLayerRef.current.get(region.id);
      if (layer) {
        layer.eachLayer((l: any) => {
          const feature = l.feature;
          if (feature && feature.properties) {
            const panelId = feature.properties.id;
            const isObstructed = obstructedPanelIds.has(panelId) || localObstructedPanelIds.has(panelId);
            
            // Update the feature property
            feature.properties.isObstructed = isObstructed;
            
            // Update the visual style
            l.setStyle({
              color: isObstructed ? 'rgba(71, 71, 71, 0.5)' : 'transparent',
              weight: isObstructed ? 1.5 : 0,
              fillColor: isObstructed ? 'transparent' : '#000000',
              fillOpacity: isObstructed ? 0 : (feature.properties.selected === false ? 0 : 0.8),
              opacity: isObstructed ? 1 : 0
            });
          }
        });
      }
    });
  }, [obstructedPanelIds, regions, localObstructedPanelIds]);

  // Add an effect to update the total panels count excluding obstructed panels
  useEffect(() => {
    // Calculate total panels (excluding obstructed ones)
    let panelCount = 0;
    
    regions.forEach(region => {
      if (region.solarPanelData && region.solarPanelData.features) {
        // Count only non-obstructed panels
        const activePanels = region.solarPanelData.features.filter(
          (feature: any) =>
            !obstructedPanelIds.has(feature.properties.id) &&
            !localObstructedPanelIds.has(feature.properties.id) &&
            feature.properties.selected !== false
        );
        panelCount += activePanels.length;
      }
    });
    
    setTotalPanels(panelCount);
    
    // Notify parent of panel count change
    if (onTotalPanelsChange) {
      onTotalPanelsChange(panelCount);
    }
  }, [regions, obstructedPanelIds, onTotalPanelsChange]);

  // Expose methods and properties via ref
  useImperativeHandle(ref, () => ({
    regions,
    regionInfo,
    selectedRegionId,
    rotation,
    totalPanels,
    deleteRegion,
    handleSolarPanelRotation,
    enableDrawMode,
    disableDrawMode,
    handleRegionButtonClick,
    setRotation
  }));

  // The component doesn't render anything visible
  return null;
});

export default ManualPanelDrawing;