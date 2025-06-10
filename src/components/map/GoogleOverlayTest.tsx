import React, { useState } from "react";
import { fetchDataLayerUrls } from "../../lib/solar";
import { getLayer } from "../../lib/layers";
import L from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import DraggableImageOverlay from "./DraggableImageOverlay";
import "leaflet/dist/leaflet.css";

const GoogleOverlayTest: React.FC = () => {
  const [maskImageUrl, setMaskImageUrl] = useState<string | null>(null);
  const [googleOverlayOpacity, setGoogleOverlayOpacity] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayOffset, setOverlayOffset] = useState({ x: 0, y: 0 });
  const [googleOverlayBounds, setGoogleOverlayBounds] =
    useState<L.LatLngBoundsExpression | null>(null);

  // Default map center and bounds
  const mapCenter = { lat: 26.023736995, lng: -80.4052021 };
  const defaultBounds = [
    [26.02348201, -80.40530902], // Southwest corner
    [26.02399199, -80.40506498], // Northeast corner
  ] as L.LatLngBoundsExpression;

  const fetchGoogleData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create a proper Leaflet LatLng object
      const location = new L.LatLng(mapCenter.lat, mapCenter.lng);

      // Use a placeholder API key - replace with a real key for production
      //const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const dataLayers = await fetchDataLayerUrls(
        location,
        15, // radius in meters
        apiKey
      );

      // Process mask layer
      const maskLayer = await getLayer("mask", dataLayers, apiKey);

      // Get the image URL from the render function
      const [imageUrl] = maskLayer.render(true);

      // Get the bounds
      const bounds = maskLayer.bounds;
      const mapBounds = [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east],
      ] as L.LatLngBoundsExpression;

      // Store the data
      setMaskImageUrl(imageUrl);
      setGoogleOverlayBounds(mapBounds);
    } catch (error) {
      console.error("Error fetching Google data layers:", error);
      setError("Failed to load Google imagery");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Google Overlay Test</h1>

      <div className="mb-4">
        <button
          className={`px-4 py-2 rounded-md ${
            isLoading ? "bg-orange-500" : "bg-orange-500"
          } text-white`}
          onClick={fetchGoogleData}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Load Google Roof Data"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div
        className="border rounded-lg overflow-hidden"
        style={{ height: "500px", width: "100%" }}
      >
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={20}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {maskImageUrl && googleOverlayBounds && (
            <DraggableImageOverlay
              url={maskImageUrl}
              bounds={googleOverlayBounds || defaultBounds}
              opacity={googleOverlayOpacity}
              zIndex={20}
              onDragEnd={(offset) => {
                setOverlayOffset(offset);
                console.log("Overlay offset:", offset);
              }}
            />
          )}
        </MapContainer>
      </div>

      {maskImageUrl && (
        <div className="mt-4">
          <label className="block mb-2">
            Overlay Opacity: {googleOverlayOpacity}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={googleOverlayOpacity}
            onChange={(e) =>
              setGoogleOverlayOpacity(parseFloat(e.target.value))
            }
            className="w-full"
          />

          <div className="mt-4">
            <h3 className="font-bold">Current Offset:</h3>
            <pre className="bg-orange-100 p-2 rounded">
              {JSON.stringify(overlayOffset, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleOverlayTest;
