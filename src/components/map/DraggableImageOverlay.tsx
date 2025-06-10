import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { ImageOverlay } from 'react-leaflet';

interface DraggableImageOverlayProps {
  url: string;
  bounds: L.LatLngBoundsExpression;
  opacity: number;
  zIndex: number;
  onDragStart?: () => void;
  onDragEnd?: (newBounds: L.LatLngBounds) => void;
}

const DraggableImageOverlay: React.FC<DraggableImageOverlayProps> = ({
  url,
  bounds,
  opacity,
  zIndex,
  onDragStart,
  onDragEnd,
}) => {
  const map = useMap();
  const overlayRef = useRef<L.ImageOverlay>(null);
  const initialClickRef = useRef<L.Point | null>(null);
  const initialBoundsRef = useRef<L.LatLngBounds | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Set up draggable functionality
  useEffect(() => {
    if (!overlayRef.current) return;

    const overlay = overlayRef.current;
    const container = overlay.getElement();
    if (!container) return;

    // Set up pointer events and cursor
    container.style.pointerEvents = 'auto';
    container.style.cursor = 'move';
    container.style.userSelect = 'none';
     
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    // Track mouse movement for dragging
    const onMouseDown = (e: MouseEvent) => {
      // Prevent default browser drag behavior
      e.preventDefault();
      e.stopPropagation(); 
      
      // Set dragging state immediately
      isDraggingRef.current = true;
      
      // Save initial state
      initialClickRef.current = L.point(e.clientX, e.clientY);
      initialBoundsRef.current = overlay.getBounds();
      
      // Disable map interactions immediately
    
      
      // Add event listeners for dragging
      document.addEventListener('mousemove', onMouseMove, { capture: true });
      document.addEventListener('mouseup', onMouseUp, { capture: true });
      
      // Call the drag start callback
      onDragStart?.();
      
      return false; // Ensure the event doesn't propagate further
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !initialClickRef.current || !initialBoundsRef.current) return;
      
      // Stop propagation to prevent other handlers
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate the distance moved in pixels
      const currentPoint = L.point(e.clientX, e.clientY);
      const offset = currentPoint.subtract(initialClickRef.current);
      
      // Convert pixel offset to geographical coordinates
      const sw = initialBoundsRef.current.getSouthWest();
      const ne = initialBoundsRef.current.getNorthEast();
      
      // Calculate the geographical distance per pixel
      const mapBounds = map.getBounds();
      const mapSize = map.getSize();
      
      const latPerPixel = (mapBounds.getNorth() - mapBounds.getSouth()) / mapSize.y;
      const lngPerPixel = (mapBounds.getEast() - mapBounds.getWest()) / mapSize.x;
      
      // Calculate new bounds
      const newSw = L.latLng(
        sw.lat - offset.y * latPerPixel,
        sw.lng + offset.x * lngPerPixel
      );
      const newNe = L.latLng(
        ne.lat - offset.y * latPerPixel,
        ne.lng + offset.x * lngPerPixel
      );
      
      // Update the overlay bounds directly using Leaflet
      overlay.setBounds(L.latLngBounds(newSw, newNe));
    };

    const onMouseUp = (e: MouseEvent) => {
      // Stop the event from propagating
      e.preventDefault();
      e.stopPropagation();
      
      // Reset dragging state
      isDraggingRef.current = false;
      
      // Re-enable map interactions
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      
      // Remove event listeners
      document.removeEventListener('mousemove', onMouseMove, { capture: true });
      document.removeEventListener('mouseup', onMouseUp, { capture: true });
      
      // Pass the new bounds to the parent component
      if (onDragEnd && overlayRef.current) {
        onDragEnd(overlayRef.current.getBounds());
      }
      
      // Reset initial values
      initialClickRef.current = null;
      initialBoundsRef.current = null;
    };

    // Add mouse down listener with capture phase to ensure it catches the event first
    container.addEventListener('mousedown', onMouseDown, { capture: true });
    
    return () => {
      // Clean up
      container.removeEventListener('mousedown', onMouseDown, { capture: true });
      document.removeEventListener('mousemove', onMouseMove, { capture: true });
      document.removeEventListener('mouseup', onMouseUp, { capture: true });
    };
  }, [map]);

  return (
    <ImageOverlay
      ref={overlayRef}
      url={url}
      bounds={bounds}
      opacity={opacity}
      zIndex={zIndex}
    />
  );
};

export default DraggableImageOverlay;