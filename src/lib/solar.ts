import { LatLng } from "leaflet";
import * as geotiff from "geotiff";
import * as geokeysToProj4 from "geotiff-geokeys-to-proj4";
import proj4 from "proj4";

export interface DataLayersResponse {
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  imageryProcessedDate: {
    year: number;
    month: number;
    day: number;
  };
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
  monthlyFluxUrl: string;
  hourlyShadeUrls: string[];
  imageryQuality: string;
}

export type LayerId =
  | "mask"
  | "dsm"
  | "rgb"
  | "annualFlux"
  | "monthlyFlux"
  | "hourlyShade";

export interface Bounds {
  north: number;
  east: number;
  south: number;
  west: number;
}

/**
 * Fetches the data layers information from the Solar API.
 *
 * @param  {LatLng} location      Point of interest as latitude longitude.
 * @param  {number} radiusMeters  Radius of the data layer size in meters.
 * @param  {string} apiKey        Google Cloud API key.
 * @return {Promise<DataLayersResponse>}  Data Layers response.
 */
export async function fetchDataLayerUrls(
  location: LatLng,
  radiusMeters: number,
  apiKey: string
): Promise<DataLayersResponse> {
  const args = {
    "location.latitude": location.lat.toFixed(5),
    "location.longitude": location.lng.toFixed(5),
    radius_meters: Math.min(1000, Math.max(10, radiusMeters)).toString(),
    required_quality: "LOW",
  };

  const params = new URLSearchParams({ ...args, key: apiKey });

  // Log the full URL for debugging (without the API key)

  const response = await fetch(
    `https://solar.googleapis.com/v1/dataLayers:get?${params}`
  );
  const data = await response.json();

  if (response.status !== 200) {
    console.error("fetchDataLayerUrls error:", data);
    throw new Error(`Error fetching data layer URLs: ${response.status}`);
  }

  return data;
}

// For backward compatibility
export const getDataLayerUrls = fetchDataLayerUrls;

export async function downloadGeoTIFF(
  url: string,
  apiKey: string
): Promise<any> {
  const solarUrl = url.includes("solar.googleapis.com")
    ? `${url}&key=${apiKey}`
    : url;

  const response = await fetch(solarUrl);

  if (response.status !== 200) {
    const error = await response.json();

    throw error;
  }

  // Get the GeoTIFF rasters, which are the pixel values for each band.
  const arrayBuffer = await response.arrayBuffer();
  const tiff = await geotiff.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters();

  // Reproject the bounding box into lat/lon coordinates.
  const geoKeys = image.getGeoKeys();
  const projObj = geokeysToProj4.toProj4(geoKeys);
  const projection = proj4(projObj.proj4, "WGS84");
  const box = image.getBoundingBox();
  const sw = projection.forward([box[0], box[1]]);
  const ne = projection.forward([box[2], box[3]]);

  // Convert rasters to regular arrays
  const processedRasters = [];
  for (let i = 0; i < rasters.length; i++) {
    processedRasters.push(
      Array.from(rasters[i] as unknown as ArrayLike<number>)
    );
  }

  return {
    width: image.getWidth(),
    height: image.getHeight(),
    rasters: processedRasters,
    bounds: {
      north: ne[1],
      south: sw[1],
      east: ne[0],
      west: sw[0],
    },
  };
}
