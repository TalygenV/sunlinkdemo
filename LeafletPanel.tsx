import React, { useRef, useState, useEffect } from 'react';
import { Polygon as LeafletPolygon } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { panelVariants } from '../utils/animations';

interface LeafletPanelProps {
  panel: {
    segmentIndex: number;
    yearlyEnergyDcKwh: number;
    orientation: string;
    isActiveInCurrentConfig: boolean;
    center: {
      latitude: number;
      longitude: number;
    };
  };
  isNew?: boolean;
  positions: L.LatLngExpression[];
  obstructionMode: boolean;
  isObstructed: boolean;
  onPanelClick?: () => void;
}

export const LeafletPanel = ({
  panel,
  positions,
  obstructionMode,
  isObstructed,
  onPanelClick,
  isNew = false
}: LeafletPanelProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Validate positions before rendering
  if (!positions || positions.length === 0) {
    return null;
  }
  
  // Get panel colors based on state
  const getPanelColors = () => {
    if (isObstructed && obstructionMode) {
      return {
        fillColor: 'transparent',
        outlineColor: "red",
        glowColor: 'transparent',
        opacity: 0
      };
    }
    
    if (!panel.isActiveInCurrentConfig && !obstructionMode) {
      return {
        fillColor: '#000000',
        outlineColor: 'transparent',
        glowColor: 'rgba(0, 0, 0, 0.1)',
        opacity: 0
      };
    }
    if (!isObstructed && obstructionMode) {
      return {
        fillColor: '#000000',
        outlineColor: 'transparent',
        glowColor: 'rgba(0, 0, 0, 0.1)',
        opacity: 0.3
      };
    }
    // Single color scheme for all active panels
    return {
      fillColor: isHovered ? '#1a1a1a' : '#000000',
      outlineColor: 'transparent',
      glowColor: 'rgba(0, 0, 0, 0.1)',
      opacity: isHovered ? 0.9 : 1
    };
  };
  
  const colors = getPanelColors();
  
  // Base opacity adjusted by mode and state
  const baseOpacity = obstructionMode && !isObstructed 
    ? 0.3  // All panels in obstruction mode (not obstructed) are 0.2
    : colors.opacity; // Use colors.opacity for all other cases
  
  // Weight (border thickness) based on hover state and mode
  const weight = isHovered ? 2 : (isObstructed && obstructionMode ? 1.5 : 0.5);
  
  // Apply glow effect when hovered
  const createGlowFilter = () => {
    if (!isHovered && !isAnimating) return '';
    
    const intensity = isAnimating ? '8px' : '4px';
    return `drop-shadow(0 0 ${intensity} ${colors.glowColor})`;
  };
  
  // Trigger animation when panel is clicked
  const handlePanelClick = (e: L.LeafletMouseEvent) => {
    e.originalEvent.stopPropagation();
    
    // Animate the panel briefly
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);
    
    // Call the passed onClick handler
    onPanelClick?.();
  };
  
  // Calculate dynamic fill pattern for premium visual effect
  const getFillPattern = () => {
    if (isObstructed) return null;
    
    // Only create patterns for active panels to save resources
    if (!panel.isActiveInCurrentConfig && !obstructionMode) return null;
    
    const patternOptions = {
      color: colors.outlineColor,
      fillColor: colors.fillColor,
      opacity: 0.4,
      weight: 0.5
    };
    
    return L.SVG.create('pattern');
  };

  // Helper function to build className string
  const getPanelClassNames = () => {
    const classes = [];
    
    if (isNew) {
      classes.push('panel-appear');
    }
    
    if (isAnimating) {
      classes.push('panel-flash-purple');
    }
    
    // Only return className if we have classes to add
    return classes.length > 0 ? classes.join(' ') : undefined;
  };

  return (
    <>
      <LeafletPolygon
        positions={positions}
        interactive={true}
        pathOptions={{
          color: colors.outlineColor,
          weight: weight,
          opacity: isHovered ? 0.9 : 0.6,
          fillColor: colors.fillColor,
          fillOpacity: baseOpacity,
          // Only add className if we have classes to add
          className: getPanelClassNames(),
          fillRule: 'evenodd',
          lineCap: 'round',
          lineJoin: 'round'
        }}
        eventHandlers={{
          click: handlePanelClick,
          mouseover: () => setIsHovered(true),
          mouseout: () => setIsHovered(false)
        }}
      />
      
      {/* Shadow/glow effect for premium look - only visible on active panels */}
      {(panel.isActiveInCurrentConfig || obstructionMode) && (
        <LeafletPolygon
          positions={positions}
          interactive={false}
          pathOptions={{
            color: 'transparent',
            fillColor: colors.glowColor,
            fillOpacity: isHovered ? 0.3 : 0.1,
            // Only add className if hovered
            className: isHovered ? 'animate-pulse-slow' : undefined
          }}
        />
      )}
    </>
  );
}