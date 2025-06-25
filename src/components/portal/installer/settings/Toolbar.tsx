import React, { useState } from "react";
import { RegionType } from "./hooks";
import { Users } from "lucide-react";

export interface RegionFilter {
  type: RegionType | "all";
  installer: string | "all";
  search: string;
}

interface ToolbarProps {
  filter: RegionFilter;
  installers: {
    id: string;
    name?: string;
    companyName?: string;
    email?: string;
  }[];
  onChange: (filter: RegionFilter) => void;
}

const types: Array<RegionType | "all"> = [
  "all",
  "zip",
  "city",
  "county",
  "state",
];

export const Toolbar: React.FC<ToolbarProps> = ({
  filter,
  onChange,
  installers,
}) => {
  const setType = (type: RegionType | "all") => onChange({ ...filter, type });
  const setInstaller = (installer: string | "all") =>
    onChange({ ...filter, installer });
  const setSearch = (search: string) => onChange({ ...filter, search });

  const [isInstallerDropdownOpen, setIsInstallerDropdownOpen] = useState(false);

  const handleInstallerSelect = (installerId: string | "all") => {
    setInstaller(installerId);
    setIsInstallerDropdownOpen(false);
  };

  const getInstallerNameById = (id: string) => {
    const installer = installers.find((i) => i.id === id);
    return installer?.name || installer?.email || "Unknown";
  };

  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter.type === t
                ? "bg-black/20 text-yellow-400"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Installer dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsInstallerDropdownOpen(!isInstallerDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white/70 hover:text-white"
        >
          <Users size={16} />
          <span>
            {filter.installer === "all"
              ? "All Installers"
              : getInstallerNameById(filter.installer)}
          </span>
        </button>

        {isInstallerDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 z-10 bg-orange-900 border border-white/10 rounded-lg shadow-xl overflow-auto max-h-[500px]">
            <div className="p-2">
              <button
                onClick={() => handleInstallerSelect("all")}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  filter.installer === "all"
                    ? "bg-orange-500/20 text-yellow-400"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                All Installers
              </button>

              {installers.map((installer) => (
                <button
                  key={installer.id}
                  onClick={() => handleInstallerSelect(installer.id)}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    filter.installer === installer.id
                      ? "bg-orange-500/20 text-yellow-400"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  {installer.name || installer.email || installer.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={filter.search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        className="flex-1 md:flex-none px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white text-sm"
      />
    </div>
  );
};
