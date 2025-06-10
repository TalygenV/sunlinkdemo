import React, { useEffect, useState } from 'react';
import { runPolygonTest } from './testPolygonHelpers';

interface PolygonDiagnosticProps {
  roofData?: any;
}

const PolygonDiagnostic: React.FC<PolygonDiagnosticProps> = ({ roofData }) => {
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([]);
  
  useEffect(() => {
    // Run the tests
    const results: string[] = [];
    results.push("Running polygon helper tests...");
    
    // Log the roof data structure
    if (roofData) {
      results.push(`Roof data available: ${roofData.features?.length || 0} features`);
      
      // Count features with "Roof" description
      const roofFeatures = roofData.features?.filter(
        (feature: any) => feature.description === "Roof"
      ) || [];
      
      results.push(`Found ${roofFeatures.length} roof features with "Roof" description`);
      
      // Check each roof feature's structure
      roofFeatures.forEach((feature: any, index: number) => {
        results.push(`Roof feature #${index + 1}:`);
        results.push(`  - Description: ${feature.description}`);
        results.push(`  - Geometry type: ${feature.geometry?.type || 'unknown'}`);
        
        if (feature.geometry?.coordinates) {
          if (feature.geometry.type === "Polygon") {
            const rings = feature.geometry.coordinates;
            results.push(`  - Polygon with ${rings.length} rings`);
            results.push(`  - Outer ring has ${rings[0]?.length || 0} points`);
          } else if (feature.geometry.type === "MultiPolygon") {
            const polygons = feature.geometry.coordinates;
            results.push(`  - MultiPolygon with ${polygons.length} polygons`);
            results.push(`  - First polygon has ${polygons[0]?.length || 0} rings`);
            results.push(`  - First ring has ${polygons[0]?.[0]?.length || 0} points`);
          }
        } else {
          results.push(`  - No coordinates found`);
        }
      });
      
      // Also run the test function
      try {
        const testResult = runPolygonTest();
        results.push(`Polygon test result: ${testResult ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        results.push(`Error running polygon test: ${error}`);
      }
    } else {
      results.push("No roof data available");
    }
    
    setDiagnosticResults(results);
  }, [roofData]);
  
  return (
    <div className="p-4 border border-yellow-500 bg-yellow-100 text-black rounded-lg my-4">
      <h2 className="text-lg font-bold mb-2">Polygon Diagnostic Results</h2>
      <pre className="text-xs overflow-auto max-h-60 bg-white p-2 rounded">
        {diagnosticResults.join('\n')}
      </pre>
    </div>
  );
};

export default PolygonDiagnostic; 