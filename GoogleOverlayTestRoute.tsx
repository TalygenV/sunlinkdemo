import React from 'react';
import GoogleOverlayTest from './testing/GoogleOverlayTest';

const GoogleOverlayTestRoute: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Google Overlay Test Page</h1>
      <p className="mb-6 text-gray-700">
        This page demonstrates the Google Solar API integration with a draggable mask overlay.
        The overlay can be positioned over the map to align with the actual roof position.
      </p>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <GoogleOverlayTest />
      </div>
    </div>
  );
};

export default GoogleOverlayTestRoute;