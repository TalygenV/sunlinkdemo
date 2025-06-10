import React, { useState, useMemo } from 'react';
import { geocodeAddress } from '../../../../lib/geo';
import { resolveInstaller } from '../../../../lib/regionResolver';
import { db } from '../../../../lib/firebase';
import { MapPin } from 'lucide-react';
import { GeoAutocomplete } from '../../../ui/forms/GeoAutocomplete';
import { useInstallers } from './hooks';

export const CoverageTester: React.FC = () => {
  const [result, setResult] = useState<{ installerId: string | null; matchedBy?: string }>({
    installerId: null
  });

  const [lookedUp, setLookedUp] = useState(false);

  // Fetch installer list to map IDs → readable names
  const [installers] = useInstallers();

  const installerNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    installers.forEach((ins) => {
      m[ins.id] = ins.companyName || ins.name || ins.id;
    });
    return m;
  }, [installers]);

  const handleResolved = async (parts: Awaited<ReturnType<typeof geocodeAddress>>) => {
    const installerId = await resolveInstaller(parts, db);
    // Find which part was matched – naive check order
    const matchedBy = parts.zip
      ? `ZIP ${parts.zip}`
      : parts.city
      ? `city '${parts.city}'`
      : parts.county
      ? `county '${parts.county}'`
      : parts.state
      ? `state '${parts.state.toUpperCase()}'`
      : undefined;
    setResult({ installerId, matchedBy });
    setLookedUp(true);
  };

  return (
    <div className="mt-10 bg-black border border-white/10 rounded-xl p-6 w-full max-w-xl mx-auto">
      <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
        <MapPin size={18} /> Coverage Tester
      </h4>

      <GeoAutocomplete onResolved={handleResolved} types={['address']} />

      {lookedUp && (
        <p className="mt-4 text-white/90">
          {result.installerId ? (
            <>
              Responsible installer:{' '}
              <span className="font-medium">
                {installerNameMap[result.installerId] || result.installerId}
              </span>
              {result.matchedBy && (
                <span className="text-white/60 text-sm"> (matched by {result.matchedBy})</span>
              )}
            </>
          ) : (
            'No matching installer found'
          )}
        </p>
      )}
    </div>
  );
}; 