import React, { useEffect } from 'react';

// This component ensures that all the required dependencies for manual panel drawing are loaded
const ManualPanelDependencies: React.FC = () => {
  useEffect(() => {
    // Load Leaflet Draw CSS
    const loadLeafletDrawCSS = () => {
      const linkId = 'leaflet-draw-css';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
        document.head.appendChild(link);
      }
    };

    // Load Leaflet Draw JS
    const loadLeafletDrawJS = () => {
      const scriptId = 'leaflet-draw-js';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    // Load Turf.js
    const loadTurfJS = () => {
      const scriptId = 'turf-js';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    // Load all dependencies
    loadLeafletDrawCSS();
    loadLeafletDrawJS();
    loadTurfJS();

    // Clean up function to remove the added elements when component unmounts
    return () => {
      // Optional: Remove scripts when component unmounts

      /*
      const leafletDrawCSS = document.getElementById('leaflet-draw-css');
      const leafletDrawJS = document.getElementById('leaflet-draw-js');
      const turfJS = document.getElementById('turf-js');
      
      if (leafletDrawCSS) document.head.removeChild(leafletDrawCSS);
      if (leafletDrawJS) document.body.removeChild(leafletDrawJS);
      if (turfJS) document.body.removeChild(turfJS);
      */
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default ManualPanelDependencies; 