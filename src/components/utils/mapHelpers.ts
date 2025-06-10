export const getSegmentCenter = (solarPanelData: any, segmentIndex: number) => {
  if(!solarPanelData || !solarPanelData.solarPotential || !solarPanelData.solarPotential.solarPanels) {
    return null;
  }
    const segmentPanels = solarPanelData.solarPotential.solarPanels.filter(
      (panel: any) => panel.segmentIndex === segmentIndex
    );
  
    const avgLat =
      segmentPanels.reduce((sum: number, panel: any) => sum + panel.center.latitude, 0) /
      segmentPanels.length;
    const avgLng =
      segmentPanels.reduce((sum: number, panel: any) => sum + panel.center.longitude, 0) /
      segmentPanels.length;
  
    return { lat: avgLat, lng: avgLng };
  };
  
  export const getAdjustedPanelCenter = (
    panel: any,
    solarPanelData: any,
    usePanelCentering: boolean,
    centeringFactor: number,
    LAT_OFFSET: number,
    LNG_OFFSET: number
  ) => {
    if(!solarPanelData || !solarPanelData.solarPotential || !solarPanelData.solarPotential.solarPanels) {
      return null;
    }
    const segmentCenter = getSegmentCenter(solarPanelData, panel.segmentIndex);
    const originalCenter = panel.center;
  
    if (!usePanelCentering) {
      return {
        lat: originalCenter.latitude + LAT_OFFSET,
        lng: originalCenter.longitude + LNG_OFFSET,
      };
    }
  
    const centeringStrength = centeringFactor / 100;
  
    return {
      lat: segmentCenter.lat + (originalCenter.latitude - segmentCenter.lat) * (1 - centeringStrength) + LAT_OFFSET,
      lng: segmentCenter.lng + (originalCenter.longitude - segmentCenter.lng) * (1 - centeringStrength) + LNG_OFFSET,
    };
  };
  
  export const getPanelCorners = (
    panel: any,
    solarPanelData: any,
    PANEL_SCALE_FACTOR: number,
    usePanelCentering: boolean,
    centeringFactor: number,
    LAT_OFFSET: number,
    LNG_OFFSET: number
  ): Array<[number, number]> => {
    
    const { orientation } = panel;
  
    const w = (solarPanelData?.solarPotential?.panelWidthMeters / 2 || 0.5225) * 0.93;
    const h = (solarPanelData?.solarPotential?.panelHeightMeters / 2 || 0.9395) * 0.93;
  
    const points = [
      { x: +w, y: +h },
      { x: +w, y: -h },
      { x: -w, y: -h },
      { x: -w, y: +h },
      { x: +w, y: +h },
    ];
  
    const segmentIndex = panel.segmentIndex;
    const roofSegment = solarPanelData?.solarPotential.roofSegmentStats[segmentIndex];
  
    const orientationAngle = orientation === 'PORTRAIT' ? 90 : 0;
    const azimuthAngle = roofSegment?.azimuthDegrees || 0;
    const pitchAngle = roofSegment?.pitchDegrees || 0;
    const pitchCorrectionFactor = Math.cos((pitchAngle * Math.PI) / 180);
  
    const adjustedPoints = points.map(({ x, y }) => {
      if (orientation === 'PORTRAIT') {
        return { x, y: y * pitchCorrectionFactor };
      } else {
        return { x: x * pitchCorrectionFactor, y };
      }
    });
  
    const centerPoint = getAdjustedPanelCenter(
      panel,
      solarPanelData,
      usePanelCentering,
      centeringFactor,
      LAT_OFFSET,
      LNG_OFFSET
    );
  
    return adjustedPoints.map(({ x, y }) => {
      const bearing = (Math.atan2(y, x) * (180 / Math.PI) + orientationAngle + azimuthAngle) * Math.PI / 180;
      const distance = Math.sqrt(x * x + y * y);
      const earthRadius = 6378137;
      
      const latRad = centerPoint?.lat * Math.PI / 180 || 0;
      const lngRad = centerPoint?.lng * Math.PI / 180 || 0;
      
      const newLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(distance / earthRadius) +
        Math.cos(latRad) * Math.sin(distance / earthRadius) * Math.cos(bearing)
      );
      
      const newLngRad = lngRad + Math.atan2(
        Math.sin(bearing) * Math.sin(distance / earthRadius) * Math.cos(latRad),
        Math.cos(distance / earthRadius) - Math.sin(latRad) * Math.sin(newLatRad)
      );
      
      return [
        newLatRad * 180 / Math.PI,
        newLngRad * 180 / Math.PI
      ] as [number, number];
    });
  };