export interface Plan {
  id: string;
  type: 'loan' | 'cash';
  title: string;
  term?: string;
  interestRate?: string;
  amount: number;
  amountWithTaxCredit?: number;
  downPayment?: number;
  features: string[];
  monthlySavings: number;
}

export interface SavingsData {
  fiveYear: number;
  tenYear: number;
  twentyYear: number;
  thirtyYear: number;
  breakEvenYear: number;
}


export interface SolarData {
  name: string;
  estimatedMonthlyKwh?:number;
  targetMonthlyBill?: number;
  center: {
    latitude: number;
    longitude: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  postalCode: string;
  administrativeArea: string;
  isAutoPanelsSupported?: boolean;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    panelCapacityWatts: number;
    panelLifetimeYears: number;
    solarPanelConfigs: Array<{
      panelsCount: number;
      yearlyEnergyDcKwh: number;
      roofSegmentSummaries: Array<{
        pitchDegrees: number;
        azimuthDegrees: number;
        panelsCount: number;
        yearlyEnergyDcKwh: number;
        segmentIndex: number;
      }>;
    }>;
    financialAnalyses?: Array<{
      monthlyBill: {
        currencyCode: string;
        units: string;
      };
      panelConfigIndex: number;
      financialDetails?: {
        initialAcKwhPerYear: number;
        remainingLifetimeUtilityBill: {
          currencyCode: string;
          units: string;
        };
        federalIncentive: {
          currencyCode: string;
          units: string;
        };
        costOfElectricityWithoutSolar: {
          currencyCode: string;
          units: string;
        };
        netMeteringAllowed: boolean;
        solarPercentage: number;
      };
      cashPurchaseSavings?: {
        outOfPocketCost: {
          currencyCode: string;
          units: string;
        };
        upfrontCost: {
          currencyCode: string;
          units: string;
        };
        rebateValue: {
          currencyCode: string;
          units: string;
        };
        paybackYears: number;
        savings: {
          savingsYear1: {
            currencyCode: string;
            units: string;
          };
          savingsYear20: {
            currencyCode: string;
            units: string;
          };
        };
      };
    }>;
  };
  boundingBox?: {
    ne: { latitude: number; longitude: number };
    sw: { latitude: number; longitude: number };
  };
}

export interface GenabilityData {
  utilityName: string;
  pricePerKwh: number;
  estimatedMonthlyKwh: number;
  recommendedSizeKw: number;
  estimatedAnnualSavings: number;
  providerAccountId:String;
  penalCount:number;
}

export interface Tariff {
  rateBands?: Array<{ rateAmount: number }>;
  tariffType?: string;
}

export interface SolarPotentialData {
  name: string;
  targetMonthlyBill?: number;
  center: {
    latitude: number;
    longitude: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  postalCode: string;
  administrativeArea: string;
  isAutoPanelsSupported?: boolean;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    panelCapacityWatts: number;
    panelLifetimeYears: number;
    solarPanelConfigs: Array<{
      panelsCount: number;
      yearlyEnergyDcKwh: number;
      roofSegmentSummaries: Array<{
        pitchDegrees: number;
        azimuthDegrees: number;
        panelsCount: number;
        yearlyEnergyDcKwh: number;
        segmentIndex: number;
      }>;
    }>;
    financialAnalyses?: Array<{
      monthlyBill: {
        currencyCode: string;
        units: string;
      };
      panelConfigIndex: number;
      financialDetails?: {
        initialAcKwhPerYear: number;
        remainingLifetimeUtilityBill: {
          currencyCode: string;
          units: string;
        };
        federalIncentive: {
          currencyCode: string;
          units: string;
        };
        costOfElectricityWithoutSolar: {
          currencyCode: string;
          units: string;
        };
        netMeteringAllowed: boolean;
        solarPercentage: number;
      };
      cashPurchaseSavings?: {
        outOfPocketCost: {
          currencyCode: string;
          units: string;
        };
        upfrontCost: {
          currencyCode: string;
          units: string;
        };
        rebateValue: {
          currencyCode: string;
          units: string;
        };
        paybackYears: number;
        savings: {
          savingsYear1: {
            currencyCode: string;
            units: string;
          };
          savingsYear20: {
            currencyCode: string;
            units: string;
          };
        };
      };
    }>;
  };
  financialAnalyses?: Array<any>; // Keep for backward compatibility
}

export interface CallToActionProps {
  data: SolarPotentialData & GenabilityData;
  monthlyConsumption?: number;
  onContinue: () => void;
  onBack: () => void;
}