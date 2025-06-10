export function renderPalette(options: {
  data: any;
  mask?: any;
  colors: string[];
  min?: number;
  max?: number;
  index?: number;
}): HTMLCanvasElement {
  const { data, mask, colors, min = 0, max = 1, index = 0 } = options;
  
  const canvas = document.createElement('canvas');
  canvas.width = data.width || 512;
  canvas.height = data.height || 512;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Create an ImageData object
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const raster = data.rasters[index];
  const maskRaster = mask?.rasters[0];
  
  // Fill the ImageData
  for (let i = 0; i < raster.length; i++) {
    // Skip if masked out
    if (maskRaster && !maskRaster[i]) {
      continue;
    }
    
    // Normalize the value
    const value = Math.max(0, Math.min(1, (raster[i] - min) / (max - min)));
    
    // Map to color
    const colorIndex = Math.floor(value * (colors.length - 1));
    const color = colors[colorIndex];
    
    // Parse the color
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    
    // Set the pixel
    const pixelIndex = i * 4;
    imageData.data[pixelIndex] = r;
    imageData.data[pixelIndex + 1] = g;
    imageData.data[pixelIndex + 2] = b;
    imageData.data[pixelIndex + 3] = 255; // Alpha
  }
  
  // Put the ImageData on the canvas
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
}

export function renderRGB(data: any, mask?: any): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = data.width || 512;
  canvas.height = data.height || 512;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Create an ImageData object
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const rasterR = data.rasters[0];
  const rasterG = data.rasters[1];
  const rasterB = data.rasters[2];
  const maskRaster = mask?.rasters[0];
  
  // Fill the ImageData
  for (let i = 0; i < rasterR.length; i++) {
    // Skip if masked out
    if (maskRaster && !maskRaster[i]) {
      continue;
    }
    
    // Set the pixel
    const pixelIndex = i * 4;
    imageData.data[pixelIndex] = rasterR[i];
    imageData.data[pixelIndex + 1] = rasterG[i];
    imageData.data[pixelIndex + 2] = rasterB[i];
    imageData.data[pixelIndex + 3] = 255; // Alpha
  }
  
  // Put the ImageData on the canvas
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
}