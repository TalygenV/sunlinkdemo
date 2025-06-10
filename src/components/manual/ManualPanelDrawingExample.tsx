import React, { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import ManualPanelDrawing, { ManualPanelDrawingRef } from './ManualPanelDrawing';

interface ManualPanelDrawingExampleProps {
  mapRef: React.RefObject<any>;
  themeColor?: string;
  onPanelCountChange?: (count: number) => void;
  onProductionChange?: (production: number) => void;
}

const ManualPanelDrawingExample: React.FC<ManualPanelDrawingExampleProps> = ({
  mapRef,
  themeColor = '#38cab3',
  onPanelCountChange,
  onProductionChange
}) => {
  // Create a ref to access the ManualPanelDrawing methods
  const manualPanelDrawingRef = useRef<ManualPanelDrawingRef>(null);
  
  // State for UI controls
  const [rotation, setRotation] = useState<number>(0);
  const [totalPanels, setTotalPanels] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);
  
  // Update rotation in the ManualPanelDrawing component when it changes
  useEffect(() => {
    if (manualPanelDrawingRef.current) {
      manualPanelDrawingRef.current.handleSolarPanelRotation(rotation);
    }
  }, [rotation]);
  
  // Update parent component when total panels change
  useEffect(() => {
    if (onPanelCountChange) {
      onPanelCountChange(totalPanels);
    }
    
    // Calculate production based on panel count (example calculation)
    if (onProductionChange) {
      // Assuming 400W panels with average production factors
      const estimatedProduction = totalPanels * 400 * 1.2; // kWh per year
      onProductionChange(estimatedProduction);
    }
  }, [totalPanels, onPanelCountChange, onProductionChange]);
  
  // Handle panel count changes from the ManualPanelDrawing component
  const handleTotalPanelsChange = (count: number) => {
    setTotalPanels(count);
  };
  
  // Enable draw mode
  const handleEnableDrawMode = () => {
    if (manualPanelDrawingRef.current) {
      manualPanelDrawingRef.current.enableDrawMode();
    }
  };
  
  // Disable draw mode
  const handleDisableDrawMode = () => {
    if (manualPanelDrawingRef.current) {
      manualPanelDrawingRef.current.disableDrawMode();
    }
  };
  
  // Delete selected region
  const handleDeleteRegion = () => {
    if (manualPanelDrawingRef.current && manualPanelDrawingRef.current.selectedRegionId !== null) {
      manualPanelDrawingRef.current.deleteRegion(manualPanelDrawingRef.current.selectedRegionId);
    }
  };
  
  return (
    <div className="manual-panel-drawing-example">
      {/* ManualPanelDrawing component */}
      <ManualPanelDrawing
        ref={manualPanelDrawingRef}
        mapRef={mapRef}
        themeColor={themeColor}
        onTotalPanelsChange={handleTotalPanelsChange}
      />
      
      {/* UI Controls */}
      {showControls && (
        <div className="manual-panel-controls" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <div className="control-group">
            <h4>Drawing Tools</h4>
            <div className="button-group">
              <button onClick={handleEnableDrawMode} className="control-button">
                Draw Polygon
              </button>
              <button onClick={handleDisableDrawMode} className="control-button">
                Cancel Drawing
              </button>
              <button onClick={handleDeleteRegion} className="control-button">
                Delete Region
              </button>
            </div>
          </div>
          
          <div className="control-group">
            <h4>Panel Rotation: {rotation}°</h4>
            <input
              type="range"
              min="0"
              max="359"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="rotation-slider"
            />
          </div>
          
          <div className="control-group">
            <h4>Total Panels: {totalPanels}</h4>
          </div>
          
          <button 
            onClick={() => setShowControls(false)}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Show button to restore controls if hidden */}
      {!showControls && (
        <button 
          onClick={() => setShowControls(true)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: themeColor,
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '5px 10px',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          Show Controls
        </button>
      )}
    </div>
  );
};

export default ManualPanelDrawingExample;