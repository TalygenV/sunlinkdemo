/// <reference types="vite/client" />

interface Window {
  google: {
    maps: {
      places: {
        Autocomplete: new (
          input: HTMLInputElement,
          options?: {
            componentRestrictions?: { country: string };
            fields?: string[];
            types?: string[];
          }
        ) => {
          addListener: (event: string, callback: () => void) => void;
          getPlace: () => {
            formatted_address?: string;
            address_components?: Array<{
              long_name: string;
              short_name: string;
              types: string[];
            }>;
            geometry?: {
              location: { lat: () => number; lng: () => number };
            };
          };
        };
      };
    };
  };
  recaptchaVerifier: any;
}