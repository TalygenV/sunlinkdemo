import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import ManualPanelDrawing, { ManualPanelDrawingRef } from './ManualPanelDrawing';

export interface ManualPanelWrapperRef {
  totalPanels: number;
  totalProduction: number;
  enableDrawMode: () => void;
  disableDrawMode: () => void;
  deleteSelectedRegion: () => void;
  resetAllPanels: () => void;
  handleRotationChange: (rotation: number) => void;
  currentRotation: number;
  regions: { id: number; panelCount: number; coordinates?: number[][]; solarPanelData?: any }[];
  selectedRegionId: number | null;
  handleRegionSelect: (regionId: number) => void;
  // Add obstruction-related methods and properties
  toggleObstructionMode: (enabled: boolean) => void;
  isInObstructionMode: boolean;
  obstructedPanelIds: Set<string>;
  handlePanelObstruction: (panelId: string) => void;
}

interface ManualPanelWrapperProps {
  mapRef: React.RefObject<any>;
  themeColor?: string;
  // State props
  totalPanels: number;
  totalProduction: number;
  currentRotation: number;
  regions: any[]; // Allow full region objects with coordinates and solarPanelData
  selectedRegionId: number | null;
  // Callbacks
  onPanelCountChange?: (count: number) => void;
  onProductionChange?: (production: number) => void;
  onRegionInfoChange?: (regions: any[]) => void;
  onRegionSelect?: (regionId: number) => void;
  onRotationChange?: (rotation: number) => void;
  // Add obstruction-related props
  obstructionMode?: boolean;
  obstructedPanelIds?: Set<string>;
  onObstructedPanelsChange?: (obstructedPanels: Set<string>) => void;
}

const ManualPanelWrapper = forwardRef<ManualPanelWrapperRef, ManualPanelWrapperProps>(({
  mapRef,
  themeColor = '#38cab3',
  // Use props instead of state
  totalPanels,
  totalProduction,
  currentRotation,
  regions,
  selectedRegionId,
  // Callbacks
  onPanelCountChange,
  onProductionChange,
  onRegionInfoChange,
  onRegionSelect,
  onRotationChange,
  // Obstruction-related props
  obstructionMode = false,
  obstructedPanelIds = new Set<string>(),
  onObstructedPanelsChange
}, ref) => {
  // Create a ref to access the ManualPanelDrawing methods
  const manualPanelDrawingRef = useRef<ManualPanelDrawingRef>(null);
  // Keep track of whether initial regions were already loaded
  const [initialRegionsLoaded, setInitialRegionsLoaded] = useState(false);
  const [fullRegionData, setFullRegionData] = useState<any[]>([]);
  const hasTriedInitialization = useRef(false);
  
  // Use refs to track update source to prevent loops
  const isInternalUpdate = useRef(false);
  const lastUpdateTimestamp = useRef(0);

  // Add obstruction-related state
  const [isInObstructionMode, setIsInObstructionMode] = useState(obstructionMode);
  const [localObstructedPanelIds, setLocalObstructedPanelIds] = useState<Set<string>>(obstructedPanelIds);
  
  // Update obstruction mode when prop changes

  
  // Update obstructed panel IDs when prop changes
  useEffect(() => {
    setLocalObstructedPanelIds(obstructedPanelIds);
  }, [obstructedPanelIds]);

  // Handle panel count changes from the ManualPanelDrawing component
  const handleTotalPanelsChange = (count: number) => {
    if (onPanelCountChange) {
      onPanelCountChange(count);
    }
    
    // Calculate production based on panel count
    const estimatedProduction = 390
    if (onProductionChange) {
      onProductionChange(estimatedProduction);
    }
  };

  // Toggle obstruction mode
  const toggleObstructionMode = (enabled: boolean) => {
    setIsInObstructionMode(enabled);
    if (manualPanelDrawingRef.current) {
      manualPanelDrawingRef.current.setObstructionMode?.(enabled);
    }
  };
  
  // Handle panel obstruction toggling
  const handlePanelObstruction = (panelId: string) => {
    setLocalObstructedPanelIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(panelId)) {
        newSet.delete(panelId);
      } else {
        newSet.add(panelId);
      }
      
      // Notify parent component
      if (onObstructedPanelsChange) {
        onObstructedPanelsChange(newSet);
      }
      
      return newSet;
    });
  };

  // Enable draw mode
  const enableDrawMode = () => {
    console.log("ManualPanelWrapper: enableDrawMode called");
    // Add a small delay to ensure the map is fully loaded
    setTimeout(() => {
      if (manualPanelDrawingRef.current) {
        console.log("ManualPanelDrawingRef exists, enabling draw mode");
        manualPanelDrawingRef.current.enableDrawMode();
      } else {
        console.error("ManualPanelDrawingRef is null");
      }
    }, 100);
  };

  // Disable draw mode
  const disableDrawMode = () => {
    if (manualPanelDrawingRef.current) {
      manualPanelDrawingRef.current.disableDrawMode();
    }
  };

  // Delete selected region
  const deleteSelectedRegion = () => {
    if (manualPanelDrawingRef.current && manualPanelDrawingRef.current.selectedRegionId !== null) {
      const regionIdToDelete = manualPanelDrawingRef.current.selectedRegionId;
      
      // First remove from full region data to ensure the button and state get updated
      setFullRegionData(prev => prev.filter(region => region.id !== regionIdToDelete));
      
      // Then delete the actual region in the drawing component
      manualPanelDrawingRef.current.deleteRegion(regionIdToDelete);
      
      // Explicitly update parent component if needed
      if (onRegionInfoChange) {
        // Get the updated regions after deletion (filter out the deleted one)
        const updatedRegions = fullRegionData.filter(r => r.id !== regionIdToDelete);
        onRegionInfoChange(updatedRegions);
      }
    }
  };

  // Reset all panels by deleting all regions
  const resetAllPanels = () => {
    if (manualPanelDrawingRef.current) {
      // Get all region IDs
      const regionsToDelete = [...fullRegionData]; // Make a copy of the regions array
      
      // Clear our local state first
      setFullRegionData([]);
      
      // Delete each region in the drawing component
      regionsToDelete.forEach(region => {
        if (manualPanelDrawingRef.current) {
          manualPanelDrawingRef.current.deleteRegion(region.id);
        }
      });
      
      // Explicitly update parent component
      if (onRegionInfoChange) {
        onRegionInfoChange([]);
      }
      
      // Reset total panels
      if (onPanelCountChange) {
        onPanelCountChange(0);
      }
      
      // Reset total production
      if (onProductionChange) {
        onProductionChange(0);
      }
    }
  };

  // Handle rotation change
  const handleRotationChange = (rotation: number) => {
    if (manualPanelDrawingRef.current) {
      // Get the current rotation from the drawing component
      const currentDrawingRotation = manualPanelDrawingRef.current.rotation;
      
      // Only apply the rotation if it has actually changed
      if (rotation !== currentDrawingRotation) {
        // Notify parent component first
        if (onRotationChange) {
          onRotationChange(rotation);
        }
        
        // Apply the rotation in the drawing component
        manualPanelDrawingRef.current.handleSolarPanelRotation(rotation);
        
        // Wait a short time for the rotation to complete and panels to update
        setTimeout(() => {
          // Get the updated regions directly from the drawing component
          if (manualPanelDrawingRef.current) {
            const updatedRegions = manualPanelDrawingRef.current.regions;
            
            // Process and update the full region data with the latest panel counts
            const processedRegions = updatedRegions.map(region => {
              let panelCount = 0;
              
              // Get the actual panel count from the features if available
              if (region.solarPanelData && region.solarPanelData.features) {
                panelCount = region.solarPanelData.features.length;
              } else if (region.selectedIds && Array.isArray(region.selectedIds)) {
                panelCount = region.selectedIds.filter((item: any) => item.selected !== false).length;
                
                // If all panels are deselected, use the total count
                if (panelCount === 0 && region.selectedIds.length > 0) {
                  panelCount = region.selectedIds.length;
                }
              }
              
              return {
                ...region,
                calculatedPanelCount: panelCount
              };
            });
            
            // Update the local state
            setFullRegionData(processedRegions);
            
            // Pass the updated region data to the parent component
            if (onRegionInfoChange) {
              onRegionInfoChange(processedRegions);
            }
          }
        }, 100); // Short delay to ensure the drawing component has finished updating
      }
    }
  };

  // Handle region selection
  const handleRegionSelect = (regionId: number) => {
    if (onRegionSelect) {
      onRegionSelect(regionId);
    }
    if (manualPanelDrawingRef.current) {
      manualPanelDrawingRef.current.handleRegionButtonClick(regionId);
    }
  };

  // Save complete region data when it changes in ManualPanelDrawing
  const handleRegionsChange = useCallback((updatedRegions: any[]) => {
    // Add debounce and loop prevention
    const now = Date.now();
    if (now - lastUpdateTimestamp.current < 200) {
      // Skip rapid updates (debounce)
      return;
    }
    lastUpdateTimestamp.current = now;
    
    // Mark this as an internal update
    isInternalUpdate.current = true;
    
    // Process the updated regions to ensure panel counts are correct
    const processedRegions = updatedRegions.map(region => {
      // Calculate the panel count based on selected panels
      let panelCount = 0;
      
      // Count selected panels if selectedIds exists
      if (region.selectedIds && Array.isArray(region.selectedIds)) {
        panelCount = region.selectedIds.filter((item: any) => item.selected !== false).length;
        
        // If all panels are deselected, use the total number of panels
        if (panelCount === 0 && region.selectedIds.length > 0) {
          // Get visible panel count from solarPanelData if available
          if (region.solarPanelData && region.solarPanelData.features) {
            panelCount = region.solarPanelData.features.length;
          }
        }
      } else if (region.solarPanelData && region.solarPanelData.features) {
        // If no selectedIds, use all panels
        panelCount = region.solarPanelData.features.length;
      }
      
      return {
        ...region,
        calculatedPanelCount: panelCount,
        isActiveInCurrentConfig: true // Add this property to make panels appear in CustomerPortal
      };
    });
    
    setFullRegionData(processedRegions);
    
    // Store the full regions in parent component via callback
    if (onRegionInfoChange) {
      // Include both simple format (for UI) and full format (for storage)
      const regionInfo = processedRegions.map(region => ({
        id: region.id,
        panelCount: region.calculatedPanelCount,
        coordinates: region.coordinates,
        solarPanelData: region.solarPanelData,
        rotation: region.rotation,
        selectedIds: region.selectedIds,
        isActiveInCurrentConfig: true // Add this property to ensure all region data includes it
      }));
      
      onRegionInfoChange(regionInfo);
    }
    
    // Clear the internal update flag after a delay
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 0);
  }, [onRegionInfoChange]);

  // Memoize the callback to prevent infinite loops
  const handleRegionInfoChange = useCallback((regionInfo: any[]) => {
    // Skip empty callbacks or internal updates
    if (regionInfo.length === 0 || isInternalUpdate.current) {
      return;
    }
    
    // Add debounce
    const now = Date.now();
    if (now - lastUpdateTimestamp.current < 200) {
      return;
    }
    lastUpdateTimestamp.current = now;
    
    // We'll use this for the panelCount and other metadata
    const mappedRegions = regionInfo.map(r => ({
      id: r.id,
      panelCount: r.panelCount
    }));
    
    if (onRegionInfoChange && fullRegionData.length > 0) {
      // Merge regionInfo with fullRegionData to ensure we have complete data
      const completeRegions = regionInfo.map(info => {
        const fullRegion = fullRegionData.find(r => r.id === info.id);
        if (fullRegion) {
          return {
            ...info,
            coordinates: fullRegion.coordinates,
            solarPanelData: fullRegion.solarPanelData,
            selectedIds: fullRegion.selectedIds,
            selectedPanels: fullRegion.selectedPanels,
            isActiveInCurrentConfig: true // Add this property to make manual panels visible in CustomerPortal
          };
        }
        return info;
      });
      
      // Mark this as an internal update
      isInternalUpdate.current = true;
      
      onRegionInfoChange(completeRegions);
      
      // Clear the internal update flag after a delay
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    }
  }, [onRegionInfoChange, fullRegionData]);

  // Expose methods and properties to parent via ref
  useImperativeHandle(ref, () => ({
    totalPanels,
    totalProduction,
    enableDrawMode,
    disableDrawMode,
    deleteSelectedRegion,
    resetAllPanels,
    handleRotationChange,
    currentRotation,
    regions: fullRegionData.length > 0 ? fullRegionData : regions,
    selectedRegionId,
    handleRegionSelect,
    // Add obstruction-related methods and properties
    toggleObstructionMode,
    isInObstructionMode,
    obstructedPanelIds: localObstructedPanelIds,
    handlePanelObstruction
  }));

  // Initialize fullRegionData from props if available or set an empty array to start
  useEffect(() => {
    // If regions exist and have complete data, use them
    if (regions && regions.length > 0 && fullRegionData.length === 0) {
      // Check if regions have complete data (coordinates and solarPanelData)
      const hasCompleteData = regions.some(r => r.coordinates && r.coordinates.length > 0 && r.solarPanelData);
      if (hasCompleteData) {
        setFullRegionData(regions);
      }
    } 
    // Even if no regions with complete data, mark as loaded after a delay
    if (fullRegionData.length === 0) {
      setTimeout(() => {
        setInitialRegionsLoaded(true);
      }, 300);
    }
  }, [regions, fullRegionData]);

  return (
    <ManualPanelDrawing
      ref={manualPanelDrawingRef}
      mapRef={mapRef}
      themeColor={themeColor}
      onTotalPanelsChange={handleTotalPanelsChange}
      onRegionInfoChange={handleRegionInfoChange}
      onRegionsChange={handleRegionsChange}
      onSelectedRegionIdChange={onRegionSelect ? (id) => {
        if (id !== null) {
          onRegionSelect(id);
        }
      } : undefined}
      initialRegions={regions.filter(r => r.coordinates && r.coordinates.length > 0 && r.solarPanelData)}
      initialRegionInfo={regions.map(r => {
        // Calculate panel count from selectedIds if available, otherwise use the stored panelCount
        let calculatedPanelCount = r.panelCount;
        
        // If selectedIds is available, count the number of selected panels
        if (r.selectedIds && Array.isArray(r.selectedIds)) {
          // First try to get exact count of selected panels (active panels)
          const selectedCount = r.selectedIds.filter((item: any) => item.selected !== false).length;
          
          // If no selectedIds are marked as selected, use the total count of selectedIds as fallback
          if (selectedCount === 0 && r.selectedIds.length > 0) {
            calculatedPanelCount = r.selectedIds.length;
          } else {
            calculatedPanelCount = selectedCount;
          }
        }
        
        // Ensure we have at least the panel count we received from the props if the calculation fails
        if (!calculatedPanelCount && r.panelCount) {
          calculatedPanelCount = r.panelCount;
        }
        
        // If still no panel count and we have solarPanelData with features, use the features length
        if (!calculatedPanelCount && r.solarPanelData && r.solarPanelData.features) {
          calculatedPanelCount = r.solarPanelData.features.length;
        }
        
        return {
          id: r.id,
          panelCount: calculatedPanelCount || 0,
          rotation: r.rotation || currentRotation,
          shadeStatus: 1,
          orientationNumber: 1.08,
          orientation: 'N',
        };
      })}
      initialSelectedRegionId={selectedRegionId}
      initialRotation={currentRotation}
      // Pass obstruction-related props
      obstructionMode={isInObstructionMode}
      obstructedPanelIds={localObstructedPanelIds}
      onPanelObstruction={handlePanelObstruction}
    />
  );
});

export default ManualPanelWrapper; 