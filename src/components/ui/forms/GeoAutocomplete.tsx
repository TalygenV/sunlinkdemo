import React, { useState, useEffect, useRef } from 'react';
import { geocodeAddress } from '../../../lib/geo';
import type { GeoParts } from '../../../lib/geo';

interface GeoAutocompleteProps {
  label?: string;
  placeholder?: string;
  /**
   * Google Places Autocomplete "types" option.
   * When omitted defaults to ['(regions)'] which limits results to ZIP / city / county / state.
   * Pass ['address'] (or another valid value) to allow full street-level addresses.
   */
  types?: string[];
  onResolved: (result: Awaited<ReturnType<typeof geocodeAddress>>) => void;
}

/**
 * Thin wrapper around a plain <input/> that resolves the address once the user
 * presses Enter. A fully-fledged implementation would integrate with Google or
 * Mapbox Places Autocomplete APIs – this stub keeps things tiny yet useful for
 * the Region management workflow.
 */
export const GeoAutocomplete: React.FC<GeoAutocompleteProps> = ({
  label = 'Address',
  placeholder = '123 Main St, Houston, TX 77001',
  types = ['(regions)'],
  onResolved
}) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Google Places Autocomplete integration
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = (window as any).google;
    if (!inputRef.current || !g?.maps?.places) return;

    const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address'],
      types
    });

    const listener = autocomplete.addListener('place_changed', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const place: any = autocomplete.getPlace();
      const parts: Partial<GeoParts> = {};

      (place.address_components || []).forEach((component: any) => {
        const types: string[] = component.types;
        if (types.includes('postal_code')) parts.zip = component.long_name;
        if (types.includes('locality')) parts.city = component.long_name;
        if (types.includes('administrative_area_level_2'))
          parts.county = component.long_name.replace(/ County$/i, '');
        if (types.includes('administrative_area_level_1'))
          parts.state = component.short_name.toLowerCase();
      });

      // Update input with formatted address for clarity
      if (place.formatted_address) {
        setValue(place.formatted_address);
      }

      onResolved(parts as GeoParts);
    });

    return () => {
      if (listener && listener.remove) listener.remove();
    };
  }, [onResolved]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !loading) {
      setLoading(true);
      try {
        const parts = await geocodeAddress(value.trim());
        onResolved(parts);
      } catch (err) {
        console.error('Geocode failed', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1 text-sm text-white/70">{label}</label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && <p className="text-xs text-white/50 mt-1">Resolving…</p>}
    </div>
  );
}; 