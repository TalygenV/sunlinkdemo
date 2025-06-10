import { binaryPalette, ironPalette, rainbowPalette, sunlightPalette } from './colors';
import { downloadGeoTIFF, DataLayersResponse, LayerId, Bounds } from './solar';
import { renderPalette, renderRGB } from './visualize';

export interface Palette {
  colors: string[];
  min: string;
  max: string;
}

export interface Layer {
  id: LayerId;
  render: (showRoofOnly: boolean, month?: number, day?: number) => string[];
  bounds: Bounds;
  palette?: Palette;
}

export async function getLayer(
  layerId: LayerId,
  urls: DataLayersResponse,
  googleMapsApiKey: string
): Promise<Layer> {
  const get: Record<LayerId, () => Promise<Layer>> = {
    mask: async () => {
      const mask = await downloadGeoTIFF(urls.maskUrl, googleMapsApiKey);
      const colors = binaryPalette;
      
      return {
        id: layerId,
        bounds: mask.bounds,
        palette: {
          colors: colors,
          min: 'No roof',
          max: 'Roof',
        },
        render: (showRoofOnly) => {
          const canvas = renderPalette({
            data: mask,
            mask: showRoofOnly ? mask : undefined,
            colors: colors,
          });
          
          // Convert canvas to data URL
          return [canvas.toDataURL()];
        },
      };
    },
    // Only implementing the mask layer as requested
    dsm: async () => {
      throw new Error('DSM layer not implemented');
    },
    rgb: async () => {
      const [mask, data] = await Promise.all([
        downloadGeoTIFF(urls.maskUrl, googleMapsApiKey),
        downloadGeoTIFF(urls.rgbUrl, googleMapsApiKey),
      ]);
      
      // Use bounds from the response if available, otherwise use mask bounds
      const bounds = mask.bounds;
      
      return {
        id: layerId,
        bounds,
        render: (showRoofOnly) => {
          const canvas = renderRGB(data, showRoofOnly ? mask : undefined);
          
          // Convert canvas to data URL
          return [canvas.toDataURL()];
        },
      };
    },
    annualFlux: async () => {
      const [mask, data] = await Promise.all([
        downloadGeoTIFF(urls.maskUrl, googleMapsApiKey),
        downloadGeoTIFF(urls.annualFluxUrl, googleMapsApiKey),
      ]);
      
      const colors = ironPalette;
      
      return {
        id: layerId,
        bounds: mask.bounds,
        palette: {
          colors: colors,
          min: 'Shady',
          max: 'Sunny',
        },
        render: (showRoofOnly) => {
          const canvas = renderPalette({
            data: data,
            mask: showRoofOnly ? mask : undefined,
            colors: colors,
            min: 0,
            max: 1800,
          });
          
          // Convert canvas to data URL
          return [canvas.toDataURL()];
        },
      };
    },
    monthlyFlux: async () => {
      throw new Error('Monthly flux layer not implemented');
    },
    hourlyShade: async () => {
      throw new Error('Hourly shade layer not implemented');
    }
  };
  
  try {
    return get[layerId]();
  } catch (e) {
    console.error(`Error getting layer: ${layerId}\n`, e);
    throw e;
  }
}