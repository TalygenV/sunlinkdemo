import { ref as dbRef, onValue } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../../../lib/firebase";

export type RegionType = "zip" | "city" | "county" | "state";

export interface RegionRow {
  type: "zip" | "city" | "county" | "state" | "";
  code: string;
  name: string;
  installerId: string;
  installerName?: string; // ✅ Add this new optional field
}

interface RegionAssignmentsHook {
  dataMap: Record<RegionType, Record<string, RegionRow>>;
  rows: RegionRow[];
  overrideMap: Record<string, boolean>;
  loading: boolean;
}

interface InstallerInfo {
  email: string | undefined;
  id: string;
  name?: string;
  companyName?: string;
}

/**
 * Small helper that subscribes to a database path once and keeps local state
 * updated whenever the backend changes.
 */
function useRealtimeObject<T = any>(path: string): [T | undefined, boolean] {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = dbRef(db, path);
    const unsub = onValue(r, (snap: any) => {
      setData(snap.val());
      setLoading(false);
    });
    return () => unsub();
  }, [path]);

  return [data, loading];
}

export function useInstallers(): [InstallerInfo[], boolean] {
  const [data, loading] = useRealtimeObject<Record<string, any>>("/installers");

  const installers = useMemo<InstallerInfo[]>(() => {
    if (!data) return [];
    return Object.entries(data).map(([id, val]) => ({ id, ...val }));
  }, [data]);

  return [installers, loading];
}

export function useRegionAssignments(): RegionAssignmentsHook {
  const [data, loading] = useRealtimeObject<any>("/users");

  const { rows, overrideMap, dataMap } = useMemo(() => {
    const rows: RegionRow[] = [];
    const overrideMap: Record<string, boolean> = {};
    const dataMap: Record<RegionType, Record<string, RegionRow>> = {
      zip: {},
      city: {},
      county: {},
      state: {},
    };

    if (data) {
      (["zip", "city", "county", "state"] as RegionType[]).forEach((type) => {
        const typeMap = data[type] ?? {};
        Object.entries<any>(typeMap).forEach(([code, val]) => {
          const row: RegionRow = {
            type,
            code,
            name: val.name ?? code,
            installerId: val.installerId,
            updatedAt: val.updatedAt,
          };
          rows.push(row);
          dataMap[type][code] = row;
        });
      });

      // Improved (still approximate) override detection: a broader region is
      // considered overridden when *any* narrower region is assigned to a
      // different installer. This errs on the side of visibility, ensuring
      // state-wide or county-wide assignments show the "Overrides" flag when
      // at least one more specific mapping differs.

      rows.forEach((row) => {
        const key = `${row.type}-${row.code}`;
        overrideMap[key] = false;

        if (row.type === "zip") return; // ZIP has no narrower level

        const narrower = rows.filter((r) => {
          if (row.type === "state") return r.type !== "state";
          if (row.type === "county")
            return r.type === "city" || r.type === "zip";
          if (row.type === "city") return r.type === "zip";
          return false;
        });

        overrideMap[key] = narrower.some(
          (r) => r.installerId !== row.installerId
        );
      });
    }

    return { rows, overrideMap, dataMap };
  }, [data]);

  return { rows, overrideMap, dataMap, loading };
}
