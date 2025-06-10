// Test implementation to verify polygon helper functions
import { isPanelStrictlyWithinRoofBoundaries } from './polygonHelpers';
import nearMapData from '../NearmapsAiResponse.json';

// Test function to check if polygon helpers are working with NearmapsAiResponse data
export const testPanelInBoundaries = () => {
  // Extract the roof feature from the NearmapsAiResponse
  const roofFeatures = nearMapData.features.filter(
    feature => feature.description === "Roof"
  );
  
  if (roofFeatures.length === 0) {
    console.error('No roof features found in test data');
    return false;
  }
  
  console.log(`Found ${roofFeatures.length} roof features`);
  
  // Create test panel corners - first set should be inside, second outside
  const testPanelInsideCorners: [number, number][] = [
    [41.327, -111.973], // Inside the roof
    [41.3271, -111.973],
    [41.3271, -111.9731],
    [41.327, -111.9731]
  ];
  
  const testPanelOutsideCorners: [number, number][] = [
    [41.327, -111.973], // One corner inside
    [41.328, -111.973], // Far outside the roof
    [41.328, -111.974],
    [41.327, -111.974]
  ];
  
  // Test the helper function
  const isInside = isPanelStrictlyWithinRoofBoundaries(testPanelInsideCorners, roofFeatures);
  const isOutside = !isPanelStrictlyWithinRoofBoundaries(testPanelOutsideCorners, roofFeatures);
  
  console.log('Test panel inside result:', isInside);
  console.log('Test panel outside result:', isOutside);
  
  // Test with direct NearmapsAiResponse format using getRoofPolygons-like transformation
  // This mimics the transformation in NearmapTestingTwo.tsx's getRoofPolygons()
  const roofPolygonsFromGetRoofPolygons: any[] = [];
  
  roofFeatures.forEach(feature => {
    const coordinates = feature.geometry.coordinates;
    
    if (feature.geometry.type === "Polygon") {
      // Create a structure similar to what getRoofPolygons returns
      const polygonPositions = coordinates[0].map(
        (coord: any) => [coord[1], coord[0]] as [number, number]
      );
      roofPolygonsFromGetRoofPolygons.push(polygonPositions);
    } 
    else if (feature.geometry.type === "MultiPolygon") {
      // Process each polygon in the MultiPolygon
      coordinates.forEach((polygon: any) => {
        const polygonPositions = polygon[0].map(
          (coord: any) => [coord[1], coord[0]] as [number, number]
        );
        roofPolygonsFromGetRoofPolygons.push(polygonPositions);
      });
    }
  });
  
  const isInsideWithConvertedData = isPanelStrictlyWithinRoofBoundaries(
    testPanelInsideCorners, 
    roofPolygonsFromGetRoofPolygons
  );
  
  console.log('Test with converted roof data:', isInsideWithConvertedData);
  
  return isInside && isOutside;
};

// Export a helper to run the test from anywhere in the app
export const runPolygonTest = () => {
  console.log('Running polygon helper tests...');
  const result = testPanelInBoundaries();
  console.log('Test result:', result ? 'PASSED' : 'FAILED');
  return result;
}; 