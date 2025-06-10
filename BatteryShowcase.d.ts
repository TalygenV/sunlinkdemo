import React from 'react';

interface BatteryData {
  name: string;
  capacity: number;
  warranty: number;
  warrantyUnit: string;
  price: number;
}

interface BatteryShowcaseProps {
  // Optional props
  updateCurrentBatteryName?: (battery: any) => void;
  selectedBatteryDetails?: any;
  onContinue?: () => void;
}

declare const BatteryShowcase: React.FC<BatteryShowcaseProps>;

export default BatteryShowcase;