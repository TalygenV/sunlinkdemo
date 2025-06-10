export interface GeoParts {
  zip?: string;
  city?: string;
  county?: string;
  state?: string;
}

/**
 * Very small helper to generate URL-friendly slugs from arbitrary strings.
 * Note: this is NOT a full featured slugifier – it is only intended for
 * producing the simple lowercase keys described in the region assignment
 * design doc ( e.g. "Harris County"  →  "harris-county" ).
 */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace groups of non-alphanumerics with «-»
    .replace(/^-+|-+$/g, '');    // Trim leading / trailing «-»
}

/**
 * geocodeAddress – Thin wrapper around an external geocoder (Google, Mapbox, …)
 * returning the individual geographic parts we care about. In production you
 * would proxy this request through Cloud Functions so that API keys are not
 * exposed to the client.
 *
 * Right now we defer the actual remote call and instead return a dummy object
 * so that the UI is still usable in development / unit tests.
 */
export async function geocodeAddress(address: string): Promise<GeoParts> {
  // TODO: Replace with a real geocode implementation (Google Maps, Mapbox)
  // --------------------------------------------------------------------
  // The stub below merely extracts a 5-digit number as ZIP and uses very
  // naive parsing for state & city information.  The previous implementation
  // only detected a state code when it appeared at the very end of the
  // string (e.g. ", TX 77001").  In practice Google "formatted_address"
  // values often look like `"123 Main St, Houston, TX, USA"` – note the
  // trailing country segment and sometimes *no* ZIP code.  That caused the
  // resolver to miss the state entirely which in turn made it fall back to
  // the default installer.
  //
  // The improved heuristics below try to cover these common cases while still
  // keeping the implementation feather-weight and dependency-free.  They
  // intentionally remain simple enough to run client-side without hitting an
  // external geocoding API.
  // --------------------------------------------------------------------
  // --------------------------- ZIP (5-digit) ---------------------------
  const zipMatch = address.match(/\b(\d{5})(?:[-\s]|$)/);
  const zip = zipMatch ? zipMatch[1] : undefined;

  // ---------------------------- STATE ----------------------------------
  // Look for a 2-letter state code (optionally followed by ZIP) that is
  // delimited by commas – this covers both "…, TX 77001" and "…, TX, USA".
  const stateMatch = address.match(/,\s*([A-Za-z]{2})(?:\s*\d{5})?(?=,|$)/);
  const state = stateMatch ? stateMatch[1].toLowerCase() : undefined;

  // ---------------------------- CITY -----------------------------------
  let city: string | undefined;
  let county: string | undefined;
  // Very rough: take the segment right *before* the state code – this works
  // for the majority of US addresses produced by Google Places.
  if (stateMatch && stateMatch.index !== undefined) {
    // Slice the string up to the beginning of the matched ", <STATE>"
    const beforeState = address.slice(0, stateMatch.index);
    const parts = beforeState.split(',');
    const maybeCity = parts.pop()?.trim();
    if (maybeCity) {
      // If the segment ends with "County" we treat it as county rather than city
      const countyMatch = maybeCity.match(/^(.*)\s+County$/i);
      if (countyMatch) {
        county = countyMatch[1];
      } else {
        city = maybeCity;
      }
    }
  }

  // County information is still skipped in this stub.

  return { zip, state, city, county };
} 