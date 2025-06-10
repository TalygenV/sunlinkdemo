import { ref, get } from 'firebase/database';
import { GeoParts, slug } from './geo';

type RegionType = 'zip' | 'city' | 'county' | 'state';

/**
 * Resolve the installer responsible for the provided geographic parts. The
 * function walks from the most specific (ZIP) to the broadest (state)
 * assignment until it finds a match.
 *
 * Returns the installerId *or* null when no responsible installer could be
 * found.
 */
export async function resolveInstaller(
  geo: GeoParts,
  db: any
): Promise<string | null> {
  const lookups: Array<[RegionType, string | undefined]> = [
    ['zip', geo.zip],
    ['city', geo.city ? slug(geo.city) : undefined],
    ['county', geo.county ? slug(geo.county) : undefined],
    ['state', geo.state ? geo.state.toLowerCase() : undefined]
  ];

  for (const [type, code] of lookups) {
    if (!code) continue;
    const snap = await get(ref(db, `/regionAssignments/${type}/${code}`));
    if (snap.exists()) {
      const val = snap.val() as { installerId?: string } | null;
      if (val && val.installerId) {
        return val.installerId;
      }
    }
  }

  return null;
} 