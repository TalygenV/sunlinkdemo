import React from 'react';

interface PanelData {
  solarPanels: {
    brand: string;
    model: string;
    wattage: number;
    efficiency: number;
    warranty: string;
    price?: number;
  }[];
}

interface SolarPanelShowcaseProps {
  panelData: PanelData;
  selectedPanel?: any;
  onSelectPanel?: (panel: any) => void;
  onViewModels?: () => void;
}

declare const SolarPanelShowcase: React.FC<SolarPanelShowcaseProps>;

export default SolarPanelShowcase;