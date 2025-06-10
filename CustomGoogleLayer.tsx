import { useEffect } from 'react';
import { useMap, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import React from 'react';
interface CustomGoogleLayerProps {
  type?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  opacity?: number;
}

/**
 * A Google Maps layer for react-leaflet v4 based on Leaflet.GridLayer.GoogleMutant
 */
const CustomGoogleLayer = ({
  type = 'satellite',
  opacity = 1
}: CustomGoogleLayerProps) => {
  const map = useMap();
  
  useEffect(() => {
    console.log('CustomGoogleLayer: Initializing...');
    
    let googleLayer: any = null;
    
    // Short timeout to ensure Google Maps API is fully loaded
    setTimeout(() => {
      try {
        // Validate that the googleMutant property exists
        if (!(L.gridLayer as any).googleMutant) {
          console.error('googleMutant not found on L.gridLayer');
          console.log('Available L.gridLayer properties:', Object.keys(L.gridLayer));
          return;
        }
        
        // Create the Google layer directly using Leaflet
        googleLayer = (L.gridLayer as any).googleMutant({
          type: type,
          opacity: opacity,
          maxZoom: 24
        });
        
        // Add it to the map
        googleLayer.addTo(map);
        console.log(`CustomGoogleLayer: Added ${type} layer to map`);
      } catch (error) {
        console.error('Error creating GoogleMutant layer:', error);
      }
    }, 500);
    
    // Clean up on unmount
    return () => {
      if (googleLayer) {
        // Use type assertion to access removeLayer method
        (map as any).removeLayer(googleLayer);
      }
    };
  }, [map, type, opacity]);

  // Render a fallback OpenStreetMap layer
  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
};

export default CustomGoogleLayer;