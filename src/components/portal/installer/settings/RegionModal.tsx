import React, { useState, useEffect, useRef } from "react";
import { RegionType, RegionRow } from "./hooks";
import { geocodeAddress, slug } from "../../../../lib/geo";
import { X, Users } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, firestore } from "../../../../lib/firebase";
import { set, ref } from "firebase/database";
import { update } from "firebase/database";
import { get } from "firebase/database";
import { getAuth } from "firebase/auth";

interface RegionModalProps {
  initial?: RegionRow | null;
  onSave: (data: {
    type: RegionType;
    code: string;
    name: string;
    installerId: string;
    previousInstallerId?: string;
  }) => void;
  onClose: () => void;
}

export const RegionModal: React.FC<RegionModalProps> = ({
  initial,
  onSave,
  onClose,
}) => {
  const [step, setStep] = useState<number>(initial ? 2 : 1);
  const [geo, setGeo] = useState<{
    type?: RegionType;
    code?: string;
    name?: string;
  }>(
    initial
      ? { type: initial.type, code: initial.code, name: initial.name }
      : {}
  );
  const [installerId, setInstallerId] = useState<string>(
    initial?.installerId || ""
  );
  const [success, setSuccess] = useState(false);
  const [isInstallerDropdownOpen, setIsInstallerDropdownOpen] = useState(false);
  const [installers, setInstallers] = useState<
    { id: string; name?: string; companyName?: string }[]
  >([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch installers
  useEffect(() => {
    const fetchInstallers = async () => {
      try {
        const installersQuery = query(
          collection(firestore, "users"),
          where("role", "==", "Installer")
        );
        const querySnapshot = await getDocs(installersQuery);
        const installersArray = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.email || "Unknown",
            companyName: data.role || "Installer",
          };
        });
        setInstallers(installersArray);
        if (!installerId && installersArray.length > 0) {
          setInstallerId(installersArray[0].id);
        }
      } catch (error) {
        console.error("Error fetching installers:", error);
      }
    };

    fetchInstallers();
  }, []);

  const proceed = () => setStep(2);
  const isEditing = Boolean(initial);
  const goBack = () => (step === 1 || isEditing ? onClose() : setStep(1));

  const handleSave = async () => {
    const user = getAuth().currentUser;
    console.log("Logged in user UID:", user?.uid);

    if (!geo.code || !installerId || !geo.type) return;

    try {
      const path = `installerRegionMapping/${installerId}`;
      const installerRef = ref(db, path);

      // Get existing data
      const snapshot = await get(installerRef);
      const existing = snapshot.val() || {};

      const data = {
        zip: existing.zip ?? "null",
        city: existing.city ?? "null",
        county: existing.county ?? "null",
        state: existing.state ?? "null",
        [geo.type]: geo.code,
      };

      await set(installerRef, data); // ✅ One clean write

      console.log("✅ Region saved:", path, data);

      onSave({
        type: geo.type,
        code: geo.code,
        name: geo.name ?? geo.code,
        installerId,
        previousInstallerId: initial?.installerId,
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("❌ Save failed:", error);
    }
  };

  // Google Maps Autocomplete
  useEffect(() => {
    if (step !== 1) return;
    const g: any = (window as any).google;
    if (!inputRef.current || !g?.maps?.places) return;

    const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      fields: ["address_components"],
      types: ["(regions)"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place: any = autocomplete.getPlace();
      const parts: Record<string, string | undefined> = {};
      (place.address_components || []).forEach((component: any) => {
        const types: string[] = component.types;
        if (types.includes("postal_code")) parts.zip = component.long_name;
        if (types.includes("locality")) parts.city = component.long_name;
        if (types.includes("administrative_area_level_2"))
          parts.county = component.long_name.replace(/ County$/i, "");
        if (types.includes("administrative_area_level_1"))
          parts.state = component.short_name.toLowerCase();
      });
      resolveGeo(parts as any);
    });

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [step]);

  const resolveGeo = (parts: {
    zip?: string;
    city?: string;
    county?: string;
    state?: string;
  }) => {
    if (parts.zip) setGeo({ type: "zip", code: parts.zip, name: parts.zip });
    else if (parts.city)
      setGeo({ type: "city", code: slug(parts.city), name: parts.city });
    else if (parts.county)
      setGeo({ type: "county", code: slug(parts.county), name: parts.county });
    else if (parts.state)
      setGeo({
        type: "state",
        code: parts.state.toLowerCase(),
        name: parts.state.toUpperCase(),
      });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      const parts = await geocodeAddress(searchValue.trim());
      resolveGeo(parts);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="relative w-full max-w-lg bg-black border border-white/10 rounded-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"
        >
          <X size={16} />
        </button>

        <h3 className="text-xl font-medium text-white mb-4">
          {initial ? "Edit Region" : "Add Region"}
        </h3>

        {success && (
          <div className="mb-4 p-3 bg-green-800/50 text-green-200 rounded-lg text-sm text-center border border-green-600">
            ✅ Region saved and installer assigned successfully!
          </div>
        )}

        {!success && step === 1 && (
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search region (ZIP, city, county, state…)"
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              disabled={!geo.code}
              onClick={proceed}
              className="w-full py-2 bg-white/10 rounded-lg text-white disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {!success && step === 2 && (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              <span className="font-medium text-white">Region:</span> {geo.name}{" "}
              ({geo.type})
            </p>

            <div>
              <label className="block mb-1 text-sm text-white/70">
                Installer
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsInstallerDropdownOpen(!isInstallerDropdownOpen)
                  }
                  className="flex items-center justify-between w-full gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white/70 hover:text-white"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users size={16} />
                    <span className="truncate">
                      {installers.find((i) => i.id === installerId)?.name ||
                        "Select installer"}
                    </span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transform transition-transform ${
                      isInstallerDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isInstallerDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto z-20 bg-orange-900 border border-white/10 rounded-lg shadow-xl">
                    <div className="p-2">
                      {installers.map((ins) => {
                        const selected = installerId === ins.id;
                        return (
                          <button
                            key={ins.id}
                            onClick={() => {
                              setInstallerId(ins.id);
                              setIsInstallerDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md truncate ${
                              selected
                                ? "bg-orange-500/20 text-yellow-400"
                                : "text-white/70 hover:bg-white/5"
                            }`}
                          >
                            {ins.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <button
                onClick={goBack}
                className="flex-1 py-2 bg-black/10 rounded-lg text-white hover:bg-black/20"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
