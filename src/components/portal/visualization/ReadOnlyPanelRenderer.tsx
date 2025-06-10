import React, { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { getPanelCorners } from '../../utils/mapHelpers';
import { getPanelId } from '../../utils/panelHelpers';

interface ReadOnlyPanelRendererProps {
  panel: any;
  solarPanelData: any;
  panelWidth: number;
  panelHeight: number;
  obstructedPanels?: Set<string>;
  latOffset?: number;
  lngOffset?: number;
  panelScaleFactor?: number;
}

/**
 * Read-only panel renderer for customer portal visualization
 * Displays solar panels without interactive capabilities
 */
export const ReadOnlyPanelRenderer: React.FC<ReadOnlyPanelRendererProps> = ({
  panel,
  solarPanelData,
  panelWidth,
  panelHeight,
  obstructedPanels = new Set(),
  latOffset = 0,
  lngOffset = 0,
  panelScaleFactor = 0.7
}) => {
  // Get panel ID for checking obstructions
  const panelId = getPanelId(panel);
  const isObstructed = obstructedPanels.has(panelId);
  
  // Calculate opacity based on panel status
  const getOpacity = () => {
    // Obstructed panels are semi-transparent
    if (isObstructed) return 0.3;
    // Active panels are fully opaque
    if (panel.isActiveInCurrentConfig) return 0.9;
    // Inactive panels are semi-transparent
    return 0.5;
  };
  
  // Get panel color based on yearly energy production
  const getPanelColor = () => {
    // Return black color for all panels
    return '#000000'; 

    // Default color if no energy data
    /* if (!panel.yearlyEnergyDcKwh) return '#4682B4'; // SteelBlue
    
    // Get energy value and convert to color
    const energy = panel.yearlyEnergyDcKwh;
    
    // Color scale from blue (low) to green (mid) to yellow (high)
    if (energy < 200) return '#6495ED'; // CornflowerBlue - Low production
    if (energy < 300) return '#4682B4'; // SteelBlue - Below average
    if (energy < 400) return '#2E8B57'; // SeaGreen - Average
    if (energy < 500) return '#9ACD32'; // YellowGreen - Above average
    return '#FFD700'; */ // Gold - High production
  };
  
  // Calculate panel corners for visualization
  const corners = useMemo(() => {
    return getPanelCorners(
      panel,
      solarPanelData,
      panelScaleFactor,
      false,
      0,
      latOffset,
      lngOffset
    );
  }, [panel, solarPanelData, panelScaleFactor, latOffset, lngOffset]);

  return (
    <Polygon
      positions={corners}
      pathOptions={{
        color: isObstructed ? '#FF450000' : '#FFFFFF00', // Made border colors transparent
        fillColor: getPanelColor(),
        fillOpacity: getOpacity(),
        
        weight: 1,
        opacity: 0.8
      }}
    >
      <Tooltip direction="top" permanent={false} sticky={true}>
        <div className="text-xs">
          <p className="font-medium text-gray-900">Panel {panelId}</p>
          <p className="text-gray-700">
            Energy: {panel.yearlyEnergyDcKwh?.toFixed(2)} kWh/year
          </p>
          <p className="text-gray-700">
            Azimuth: {panel.azimuthDegrees?.toFixed(1)}°
          </p>
        </div>
      </Tooltip>
    </Polygon>
  );
};