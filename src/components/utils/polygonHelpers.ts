// Import Turf.js functions for polygon operations
import { booleanPointInPolygon, polygon as turfPolygon } from '@turf/turf';

// Check if a point is exactly on a line segment
export const isPointOnLineSegment = (
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number],
  epsilon: number = 1e-9
): boolean => {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  // Check if the point is on the line (using cross product)
  const crossProduct = Math.abs((y - y1) * (x2 - x1) - (x - x1) * (y2 - y1));
  if (crossProduct > epsilon) return false;
  
  // Check if the point is within the bounding box of the line segment
  const dotProduct = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
  const squaredLength = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  
  return dotProduct >= 0 && dotProduct <= squaredLength;
};

// Check if a point is on the boundary of a polygon
export const isPointOnPolygonBoundary = (
  point: [number, number],
  polygon: [number, number][],
  epsilon: number = 1e-9
): boolean => {
  // Check each edge of the polygon
  for (let i = 0; i < polygon.length - 1; i++) {
    if (isPointOnLineSegment(point, polygon[i], polygon[i + 1], epsilon)) {
      return true;
    }
  }
  
  // Check the edge between the last and first points
  if (polygon.length > 1) {
    return isPointOnLineSegment(
      point, 
      polygon[polygon.length - 1], 
      polygon[0], 
      epsilon
    );
  }
  
  return false;
};

// Check if a point is inside a polygon using Turf.js
export const isPointInPolygon = (
  point: [number, number],
  polygonCoords: [number, number][]
): boolean => {
  if (polygonCoords.length < 3) return false;
  
  // Ensure polygon is closed (first and last points are the same)
  const coordinates = [...polygonCoords];
  if (coordinates[0][0] !== coordinates[coordinates.length-1][0] || 
      coordinates[0][1] !== coordinates[coordinates.length-1][1]) {
    coordinates.push(coordinates[0]);
  }
  
  // Create a Turf polygon
  const poly = turfPolygon([coordinates]);
  
  // Check if point is inside polygon using Turf
  return booleanPointInPolygon(point, poly);
};

// Check if a point is strictly inside a polygon (not on the boundary)
export const isPointStrictlyInPolygon = (
  point: [number, number],
  polygon: [number, number][]
): boolean => {
  return isPointInPolygon(point, polygon) && !isPointOnPolygonBoundary(point, polygon);
};

// Flatten a potentially deeply nested array structure to get polygon coordinates
const extractPolygonCoordinates = (roofFeature: any): [number, number][][] => {
  const result: [number, number][][] = [];
  
  // Debug the incoming structure
 
  if (typeof roofFeature === 'object') {
   
  }
  
  // Helper function to process structures recursively
  const processFeature = (feature: any) => {
    if (!feature) {
     
      return;
    }
    
    try {
      // Case 1: It's a simple array of coordinates ([lat, lng])
      if (Array.isArray(feature) && feature.length > 0 && 
          Array.isArray(feature[0]) && feature[0].length === 2 && 
          typeof feature[0][0] === 'number' && typeof feature[0][1] === 'number') {
        result.push(feature as [number, number][]);
        
        return;
      }
      
      // Case 2: It's an array of arrays (simple polygon from getRoofPolygons)
      if (Array.isArray(feature) && feature.length > 0 && Array.isArray(feature[0])) {
        if (feature[0].length > 0 && 
            Array.isArray(feature[0][0]) && feature[0][0].length === 2 &&
            typeof feature[0][0][0] === 'number') {
          // This is a polygon ring array, add it directly
          result.push(feature[0] as [number, number][]);
         
        } else {
          // Recurse into each element
         
          feature.forEach(subFeature => processFeature(subFeature));
        }
        return;
      }
      
      // Case 3: GeoJSON feature with geometry
      if (feature && feature.geometry && feature.geometry.coordinates) {
       
        
        if (feature.geometry.type === "Polygon") {
          // Process each ring of the polygon
          feature.geometry.coordinates.forEach((ring: number[][], ringIndex: number) => {
            // Convert from GeoJSON [lng, lat] to [lat, lng] format
            const convertedRing = ring.map(
              (coord: number[]) => [coord[1], coord[0]] as [number, number]
            );
            result.push(convertedRing);
            
          });
        } else if (feature.geometry.type === "MultiPolygon") {
          // Process each polygon in the MultiPolygon
          feature.geometry.coordinates.forEach((polygon: number[][][], polyIndex: number) => {
            polygon.forEach((ring: number[][], ringIndex: number) => {
              // Convert from GeoJSON [lng, lat] to [lat, lng] format
              const convertedRing = ring.map(
                (coord: number[]) => [coord[1], coord[0]] as [number, number]
              );
              result.push(convertedRing);
              
            });
          });
        } else {
         
        }
      } else if (feature && feature.description === "Roof") {
        // This is likely a roof feature from propRoofData.features
       
        if (feature.geometry) {
          processFeature(feature); // Re-process with the same function to handle the geometry
        } else {
         
        }
      } else if (typeof feature === 'object') {
        // If we got here, it's an object but not in any known format
        // Try to find any properties that might lead to coordinates
       
        // Try common property names that might contain geometry
        ['geometry', 'coordinates', 'rings', 'points', 'features']
          .filter(key => feature[key])
          .forEach(key => {
            
            processFeature(feature[key]);
          });
      }
    } catch (error) {
  
    }
  };
  
  processFeature(roofFeature);
  return result;
};

/**
 * Checks if all corners of a panel are strictly inside any of the roof polygons.
 * 
 * @param corners - Array of [lat, lng] coordinates representing the corners of the panel
 * @param roofPolygons - Array of GeoJSON Polygon or MultiPolygon features
 * @returns True if all corners are inside any of the roof polygons, false otherwise
 */
export const isPanelStrictlyWithinRoofBoundaries = (
  corners: [number, number][],
  roofPolygons: any[]
): boolean => {

  
  if (!corners || !Array.isArray(corners) || corners.length < 3) {
    
    return false;
  }

  if (!roofPolygons || !Array.isArray(roofPolygons) || roofPolygons.length === 0) {
  
    return false;
  }

  // Sample first roof polygon for debugging
  const firstRoofPolygon = roofPolygons[0];
  
 

  // Check if all corners are within at least one roof polygon
  let allCornersInside = true;
  const cornerResults: boolean[] = [];
  
  for (const corner of corners) {
    // Try both coordinate orderings to compensate for potential format inconsistencies
    // First try with panel corner as [lat, lng] and converting to turf's expected [lng, lat]
    let turfPoint = [corner[1], corner[0]]; // Convert [lat, lng] -> [lng, lat]
    
    // Second format to try if first fails - assume corner is already [lng, lat]
    let turfPointAlt = [...corner]; // Clone corner
    
  
    
    let cornerInside = false;
    
    for (let i = 0; i < roofPolygons.length; i++) {
      const roofPolygon = roofPolygons[i];
      try {
        // Handle both direct geometry objects and feature objects with geometry property
        const geometry = roofPolygon.geometry ? roofPolygon.geometry : roofPolygon;
        
        if (!geometry || !geometry.type || !geometry.coordinates) {
          
          continue;
        }
        
        // Try first coordinate ordering
        let pointInside = booleanPointInPolygon(turfPoint, geometry);
        
        // If first ordering failed, try the alternative
        if (!pointInside) {
          try {
            pointInside = booleanPointInPolygon(turfPointAlt, geometry);
            if (pointInside) {
          
            }
          } catch (error) {
          
          }
        } else {
          
        }
        
        if (pointInside) {
          cornerInside = true;
          break;
        }
      } catch (error) {
     
      }
    }
    
    cornerResults.push(cornerInside);
    if (!cornerInside) {
      allCornersInside = false;
   
    }
  }
  
  
  
  return allCornersInside;
};

// Add a test function to validate polygon boundary checking
export const testPolygonBoundaryChecking = (roofPolygons: any[]): boolean => {
 
  
  if (!roofPolygons || !Array.isArray(roofPolygons) || roofPolygons.length === 0) {
   
    return false;
  }
  
  try {
    // Get a point that should be inside the roof polygon
    const firstPolygon = roofPolygons[0];
    
    if (!firstPolygon || !firstPolygon.geometry || !firstPolygon.geometry.coordinates) {
      
      return false;
    }
    
    // Create test points - one guaranteed to be inside (center of polygon)
    // and one likely outside (far away)
    const coordinates = firstPolygon.geometry.coordinates;
    
    // Calculate center point of the first polygon
    const ring = coordinates[0];
    let sumLat = 0;
    let sumLng = 0;
    
    ring.forEach((coord: [number, number]) => {
      sumLng += coord[0];
      sumLat += coord[1];
    });
    
    const centerLng = sumLng / ring.length;
    const centerLat = sumLat / ring.length;
    
    // Use this center point as a test point that should be inside
    const insideTestPoint: [number, number] = [centerLat, centerLng];
    
    // Create a test point that should be outside (far away)
    const outsideTestPoint: [number, number] = [centerLat + 1, centerLng + 1];
    
   
    const isInsideResult = isPanelStrictlyWithinRoofBoundaries([insideTestPoint], roofPolygons);
    const isOutsideResult = !isPanelStrictlyWithinRoofBoundaries([outsideTestPoint], roofPolygons);
    
  
    
    return isInsideResult && isOutsideResult;
  } catch (error) {
 
    return false;
  }
};