import { getPanelCorners } from './mapHelpers';
import { isPanelStrictlyWithinRoofBoundaries } from './polygonHelpers';
import { booleanPointInPolygon } from '@turf/turf';

export const getPanelId = (panel: any): string => {
    return `${panel.segmentIndex}-${panel.center.latitude}-${panel.center.longitude}`;
  };
  
  export const getAllPanels = (
    solarPanelData: any,
    existingPanels?: any[],
    roofPolygons?: any[],
    panelScaleFactor?: number,
    usePanelCentering?: boolean,
    centeringFactor?: number,
    latOffset?: number,
    lngOffset?: number
  ) => {
    // CRITICAL DEBUGGING - Check if we're receiving the roof polygons

    
    if (!solarPanelData) return [];
    if (!solarPanelData.solarPotential) return [];
    if (!solarPanelData.solarPotential.solarPanels) return [];
    
    // Group all panels by segment index
    const segmentPanelsMap = new Map<number, any[]>();
    solarPanelData.solarPotential.solarPanels.forEach((panel: any) => {
      if (!segmentPanelsMap.has(panel.segmentIndex)) {
        segmentPanelsMap.set(panel.segmentIndex, []);
      }
      segmentPanelsMap.get(panel.segmentIndex)!.push(panel);
    });
    
    // Get segment stats
    const segmentStats = solarPanelData.solarPotential.roofSegmentStats || [];
    
    // Find the main segments (usually the largest ones)
    const segmentSizes = Array.from(segmentPanelsMap.entries())
      .map(([index, panels]) => ({ index, count: panels.length }))
      .sort((a, b) => b.count - a.count);
    
    // Take the top 2-3 largest segments as reference
    const mainSegments = segmentSizes.slice(0, 3);
    
    // Get reference orientations from main segments
    const referenceAzimuths = mainSegments
      .map(segment => {
        const stats = segmentStats[segment.index];
        return stats ? stats.azimuthDegrees : null;
      })
      .filter(azimuth => azimuth !== null) as number[];
    
    // Determine which segments to keep based on orientation matching with main segments
    // and minimum panel count
    const validSegmentIndices = new Set<number>();
    
    segmentStats.forEach((segment: any, index: number) => {
      // Check if this segment has at least 3 panels
      const panelsInSegment = segmentPanelsMap.get(index) || [];
     
      
      // For segments with enough panels, check alignment with reference segments
      if (isCloseToReferenceOrientation(segment.azimuthDegrees, referenceAzimuths)) {
        validSegmentIndices.add(index);
      }
    });
    
    // Filter panels to only include those from valid segments
    let filteredPanels = solarPanelData.solarPotential.solarPanels
      .filter((panel: any) => validSegmentIndices.has(panel.segmentIndex))
      .map((panel: any) => {
        // Create temporary panel object with segmentIndex to generate ID
        const tempPanel = {...panel, segmentIndex: panel.segmentIndex};
        
        // If this panel exists in existingPanels, preserve its active state
        if (existingPanels && existingPanels.length > 0) {
          const existingPanel = existingPanels.find(p =>
            getPanelId(p) === getPanelId(tempPanel)
          );
          if (existingPanel) {
            return {
              ...panel,
              isActiveInCurrentConfig: existingPanel.isActiveInCurrentConfig
            };
          }
        }
        
        // Otherwise, default to inactive
        return {
          ...panel,
          isActiveInCurrentConfig: false
        };
      });
    

    // Create a Set to track valid panel IDs (panels that pass all filters)
    const validPanelIds = new Set<string>();

    // Check for roof polygons before attempting to filter
    if (roofPolygons) {
     
      
      if (roofPolygons.length > 0) {
        const sample = roofPolygons[0];
 
        
        if (sample.geometry) {
      
          
          // Sample first coordinate if it exists
          if (Array.isArray(sample.geometry.coordinates) && 
              sample.geometry.coordinates.length > 0 && 
              Array.isArray(sample.geometry.coordinates[0]) &&
              sample.geometry.coordinates[0].length > 0) {
       
            
            // Add additional coordinate system comparison
            if (Array.isArray(sample.geometry.coordinates) && sample.geometry.coordinates.length > 0 && 
                Array.isArray(sample.geometry.coordinates[0]) && sample.geometry.coordinates[0].length > 0) {
              const roofCoord = sample.geometry.coordinates[0][0]; // First polygon, first point
    
              
              // Also get a panel to compare coordinate systems
              if (filteredPanels.length > 0) {
        
                const firstPanel = filteredPanels[0];
                const panelCorners = getPanelCorners(
                  firstPanel,
                  solarPanelData,
                  panelScaleFactor || 0.8,
                  usePanelCentering || true,
                  centeringFactor || 0,
                  latOffset || 0,
                  lngOffset || 0
                );
                
                if (panelCorners && panelCorners.length > 0) {
                  const panelCorner = panelCorners[0];
     
                  
                  // Convert to the same format for direct comparison
                  // If roof is [lng, lat] and panel is [lat, lng], we need to swap
                  const roofForComp = [roofCoord[1], roofCoord[0]]; // Convert to [lat, lng]
                  const panelForComp = panelCorner; // Already [lat, lng]
                  
          
                  
                  // Calculate the distance between the coordinates
                  const latDiff = Math.abs(roofForComp[0] - panelForComp[0]);
                  const lngDiff = Math.abs(roofForComp[1] - panelForComp[1]);
               
                  
                  // Check if they're in the same region by comparing the first few decimal places
                  const sameRegion = (
                    roofForComp[0].toFixed(2) === panelForComp[0].toFixed(2) && 
                    roofForComp[1].toFixed(2) === panelForComp[1].toFixed(2)
                  );
       
                  
                  // Try adding a small offset to make the system work
     
                  // Create test points with the panel corner but turf expects [lng, lat]
                  const turfPoint = [panelCorner[1], panelCorner[0]]; // Convert panel corner to [lng, lat]
             
                  
                  // Test against the first roof polygon
                  try {
                    const isInsideOriginal = booleanPointInPolygon(turfPoint, sample.geometry);
             
                  } catch (e) {
              
                  }
                }
              }
            }
          }
        }
      }
      
      // If roofPolygons is actually an array of GeoJSON features (from Nearmap API)
      // we need to convert it to the format expected by isPanelStrictlyWithinRoofBoundaries
      const processedRoofPolygons = Array.isArray(roofPolygons) && roofPolygons.length > 0 && 
        roofPolygons[0] && typeof roofPolygons[0] === 'object' && 
        roofPolygons[0].geometry ? 
        roofPolygons : // Keep as is if already in GeoJSON format
        undefined;  // Otherwise, don't use it
      
     
      
      // Additional filter for roof boundary check
      if (processedRoofPolygons && processedRoofPolygons.length > 0) {
      
        
        try {
          // Process a small batch of panels as a test
          const maxPanelsToProcess = Math.min(5, filteredPanels.length);

          
          // Track failures for debugging
          const failures = [];
          
          for (let i = 0; i < maxPanelsToProcess; i++) {
            const panel = filteredPanels[i];
           
            
            try {
              // Get the corners of the panel
              const corners = getPanelCorners(
                panel,
                solarPanelData,
                panelScaleFactor || 0.8,
                usePanelCentering || true,
                centeringFactor || 0,
                latOffset || 0,
                lngOffset || 0
              );
              
             
              
              if (!corners || !Array.isArray(corners) || corners.length < 3) {
               
                failures.push({ panel: i, reason: 'invalid corners' });
                continue;
              }
              
              // Check individual corners first
              corners.forEach((corner, cornerIndex) => {
    
                
                // Create a GeoJSON point
                const turfPoint = [corner[1], corner[0]];
                
                // Test against each polygon
                processedRoofPolygons.forEach((poly, polyIndex) => {
                  try {
                    const geometry = poly.geometry;
                    const isInside = booleanPointInPolygon(turfPoint, geometry);
                    if (isInside) {
                
                    }
                  } catch (e) {
                    
                  }
                });
              });
              
              // Now check if the entire panel is inside
              const isWithinBoundaries = isPanelStrictlyWithinRoofBoundaries(corners, processedRoofPolygons);

              
              if (!isWithinBoundaries) {
                failures.push({ panel: i, reason: 'outside boundaries' });
              }
            } catch (e) {
             
              failures.push({ panel: i, reason: 'processing error' });
            }
          }
     
          
          // Now apply the filter to all panels
          const startTime = Date.now();
          let insideCount = 0;
          let outsideCount = 0;
          let errorCount = 0;
          
          const filteredResult = filteredPanels.filter((panel: any, index: number) => {
            // Only log details for a few panels to avoid console spam
            const shouldLogDetailed = index < 3 || index % 50 === 0;
            
            if (shouldLogDetailed) {
           
            }
            
            // Get the corners of the panel
            try {
              const corners = getPanelCorners(
                panel,
                solarPanelData,
                panelScaleFactor || 0.8,
                usePanelCentering || true,
                centeringFactor || 0,
                latOffset || 0,
                lngOffset || 0
              );
              
              if (!corners || !Array.isArray(corners) || corners.length < 3) {
                if (shouldLogDetailed) {

                }
                errorCount++;
                return false;
              }
              
              // Check if all corners are strictly inside the roof polygons
              const isWithinBoundaries = isPanelStrictlyWithinRoofBoundaries(corners, processedRoofPolygons);
              
              if (isWithinBoundaries) {
                insideCount++;
                // Add this panel's ID to the valid panel set
                validPanelIds.add(getPanelId(panel));
               
              } else {
                outsideCount++;
              }
              
              if (shouldLogDetailed) {
             
              }
              
              return isWithinBoundaries;
            } catch (error) {
              if (shouldLogDetailed) {
           
              }
              errorCount++;
              return false;
            }
          });
          
          filteredPanels = filteredResult;
    
          
        } catch (error) {
         
        }
        

      } else {

        
        // Since no roof polygons are available, consider all remaining panels as valid
        filteredPanels.forEach((panel: any) => {
          validPanelIds.add(getPanelId(panel));
        });
      }
    } else {
    
      
      // Since no roof polygons are available, consider all remaining panels as valid
      filteredPanels.forEach((panel: any) => {
        validPanelIds.add(getPanelId(panel));
      });
    }
    
    // CRITICAL: Store the validPanelIds in the solarPanelData for reference
    // This ensures other functions can check if a panel is valid
    solarPanelData._validPanelIds = validPanelIds;
   
    
    return filteredPanels;
  };
  
  // Check if an azimuth is close to any of the reference orientations
  const isCloseToReferenceOrientation = (azimuth: number, referenceAzimuths: number[]): boolean => {
    const normalizedAzimuth = azimuth % 360;
    
    // Very strict threshold of 15° for alignment with main roof segments
    return referenceAzimuths.some(reference => {
      const refNormalized = reference % 360;
      const diff = Math.abs(normalizedAzimuth - refNormalized);
      // Check if the difference is within threshold, accounting for 360° wraparound
      return diff <= 5 || diff >= 355;
    });
  };
  
  export const getSegmentPanels = (allPanels: any[], segmentIndex: number) => {
    return allPanels.filter(panel => panel.segmentIndex === segmentIndex);
  };
  
  export const calculateSegmentStats = (
    panels: any[],
    obstructedPanels: Set<string>
  ) => {
    const activePanels = panels.filter(panel => 
      panel.isActiveInCurrentConfig && !obstructedPanels.has(getPanelId(panel))
    );
    
    return {
      segmentIndex: panels[0]?.segmentIndex,
      panelsCount: activePanels.length,
      yearlyEnergyDcKwh: activePanels.reduce((sum, panel) => sum + panel.yearlyEnergyDcKwh, 0)
    };
  };
  
  export const calculateTotalStats = (
    allPanels: any[],
    obstructedPanels: Set<string>
  ) => {
    const activePanels = allPanels.filter(panel => 
      panel.isActiveInCurrentConfig && !obstructedPanels.has(getPanelId(panel))
    );
    
    return {
      totalPanels: activePanels.length,
      totalEnergyDcKwh: activePanels.reduce((sum, panel) => sum + panel.yearlyEnergyDcKwh, 0),
      roofSegmentSummaries: Array.from(new Set(allPanels.map(p => p.segmentIndex)))
        .map(segmentIndex => {
          const segmentPanels = getSegmentPanels(allPanels, segmentIndex);
          return calculateSegmentStats(segmentPanels, obstructedPanels);
        })
        .filter(summary => summary.panelsCount > 0)
    };
  };
  
  export const updateActivePanels = (panels: any[], targetCount: number, obstructedPanels?: Set<string>) => {
    // First, filter out obstructed panels
    const nonObstructedPanels = panels.filter(panel => !obstructedPanels?.has(getPanelId(panel)));
    
    // Group panels by segment
    const segmentMap = new Map<number, any[]>();
    nonObstructedPanels.forEach(panel => {
      if (!segmentMap.has(panel.segmentIndex)) {
        segmentMap.set(panel.segmentIndex, []);
      }
      segmentMap.get(panel.segmentIndex)!.push(panel);
    });
    
    // Calculate total production for each segment
    const segmentProduction = Array.from(segmentMap.entries()).map(([segmentIndex, segmentPanels]) => {
      const totalProduction = segmentPanels.reduce((sum, panel) => sum + panel.yearlyEnergyDcKwh, 0);
      const averageProductionPerPanel = totalProduction / segmentPanels.length;
      
      // Sort panels within each segment by proximity to each other
      const sortedByProximity = sortPanelsByProximity(segmentPanels);
      
      return {
        segmentIndex,
        panels: sortedByProximity,
        totalProduction,
        averageProductionPerPanel
      };
    });
    
    // Sort segments by average production per panel (highest to lowest)
    segmentProduction.sort((a, b) => b.averageProductionPerPanel - a.averageProductionPerPanel);
    
    // Flatten the sorted segments back into a single array
    const sortedPanels = segmentProduction.flatMap(segment => segment.panels);
    
    // Now apply activation logic
    return panels.map((panel: any) => {
      const panelId = getPanelId(panel);
      
      // If panel is obstructed or if solarPanelData._validPanelIds exists and this panel 
      // is not in the valid set, keep it inactive
      if (
        obstructedPanels?.has(panelId) || 
        (panel.solarPanelData?._validPanelIds && !panel.solarPanelData._validPanelIds.has(panelId))
      ) {
        return { ...panel, isActiveInCurrentConfig: false };
      }
      
      // Find panel's position in sorted array
      const sortedIndex = sortedPanels.findIndex(p => getPanelId(p) === panelId);
      
      // Activate panel if it's within target count
      return {
        ...panel,
        isActiveInCurrentConfig: sortedIndex < targetCount
      };
    });
  };
  
  // Helper function to calculate distance between two panels
  const calculateDistance = (panel1: any, panel2: any): number => {
    const lat1 = panel1.center.latitude;
    const lon1 = panel1.center.longitude;
    const lat2 = panel2.center.latitude;
    const lon2 = panel2.center.longitude;
    
    // Simple Euclidean distance calculation
    // For more accuracy on Earth's surface, you could use the Haversine formula
    return Math.sqrt(
      Math.pow(lat2 - lat1, 2) + 
      Math.pow(lon2 - lon1, 2)
    );
  };
  
  // Helper function to sort panels by proximity using nearest neighbor algorithm
  const sortPanelsByProximity = (panels: any[]): any[] => {
    if (panels.length <= 1) return panels;
    
    const result: any[] = [];
    const unvisited = [...panels];
    
    // Start with the first panel
    let current = unvisited.shift()!;
    result.push(current);
    
    // Find the nearest neighbor until all panels are visited
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;
      
      // Find the closest unvisited panel to the current one
      for (let i = 0; i < unvisited.length; i++) {
        const distance = calculateDistance(current, unvisited[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      
      // Move to the nearest panel
      current = unvisited[nearestIndex];
      result.push(current);
      unvisited.splice(nearestIndex, 1);
    }
    
    return result;
  };
  
  export const togglePanelActive = (
    panels: any[],
    panelToToggle: any
  ) => {
    return panels.map(panel => {
      if (getPanelId(panel) === getPanelId(panelToToggle)) {
        return {
          ...panel,
          isActiveInCurrentConfig: !panel.isActiveInCurrentConfig
        };
      }
      return panel;
    });
  };

  export const testDirectBoundaryChecking = (roofFeatures: any[]): void => {

    if (!roofFeatures || !Array.isArray(roofFeatures) || roofFeatures.length === 0) {
    
      return;
    }
    
    try {
      // Create a sample boundary that should definitely work
      const firstFeature = roofFeatures[0];
      
      if (!firstFeature.geometry || !firstFeature.geometry.coordinates || 
          !firstFeature.geometry.coordinates[0] || !firstFeature.geometry.coordinates[0][0]) {
 
        return;
      }
      
      // Get the coordinates of the first roof polygon
      const coords = firstFeature.geometry.coordinates[0];
      
      // Calculate center point of polygon
      let sumLat = 0;
      let sumLng = 0;
      coords.forEach((coord: [number, number]) => {
        sumLng += coord[0];
        sumLat += coord[1];
      });
      const centerLng = sumLng / coords.length;
      const centerLat = sumLat / coords.length;
      

      
      // Create a tiny test panel entirely inside the roof
      // Use [lat, lng] format like regular panel corners
      const testCorners: [number, number][] = [
        [centerLat - 0.00001, centerLng - 0.00001],
        [centerLat - 0.00001, centerLng + 0.00001], 
        [centerLat + 0.00001, centerLng + 0.00001],
        [centerLat + 0.00001, centerLng - 0.00001],
        [centerLat - 0.00001, centerLng - 0.00001], // Close the polygon
      ];
      
     
      
      // Call the boundary check function directly
      const isInside = isPanelStrictlyWithinRoofBoundaries(testCorners, roofFeatures);

      
      if (!isInside) {
     
      } else {

      }
      
    } catch (error) {

    }
    
  };