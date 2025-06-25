import React from "react";
import { RegionRow } from "./hooks";
import { Pencil, Trash } from "lucide-react";
import { RegionFilter } from "./Toolbar";

interface RegionTableProps {
  rows: RegionRow[];
  filter: RegionFilter;
  overrideMap: Record<string, boolean>;
  onEdit: (row: RegionRow) => void;
  onDelete: (row: RegionRow) => void;
  installerNameMap?: Record<string, string>;
}

export const RegionTable: React.FC<RegionTableProps> = ({
  rows,
  filter,
  overrideMap,
  onEdit,
  onDelete,
  installerNameMap,
}) => {
  const filtered = rows.filter((row) => {
    if (filter.type !== "all" && row.type !== filter.type) return false;
    if (filter.installer !== "all" && row.installerId !== filter.installer)
      return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!row.name?.toLowerCase().includes(q) && !row.code?.includes(q))
        return false;
    }
    return true;
  });

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-black/60">
          <tr className="border-b border-white/10 text-left text-white/70">
            <th className="py-3 px-4">Region</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Installer</th>
            <th className="py-3 px-4 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => {
            const key = `${row.type}-${row.code}`;
            return (
              <tr
                key={key}
                className="border-b border-white/5 hover:bg-white/5"
              >
                <td className="py-3 px-4 text-white">{row.name || row.code}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.type === "zip"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : row.type === "city"
                        ? "bg-purple-500/20 text-purple-300"
                        : row.type === "county"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-sky-500/20 text-sky-300"
                    }`}
                  >
                    {row.type.toUpperCase()}
                  </span>
                </td>
                {/* <td className="py-3 px-4 text-white/90">
                  {installerNameMap?.[row.installerId] || row.installerId}
                </td> */}
                <td className="py-3 px-4 text-white/90">
                  {row.installerName ||
                    installerNameMap?.[row.installerId] ||
                    row.installerId}
                </td>

                <td className="py-3 px-4 flex gap-2 items-center justify-end">
                  <button
                    onClick={() => onEdit(row)}
                    className="p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(row)}
                    className="p-1.5 rounded-md hover:bg-red-500/20 text-red-300"
                  >
                    <Trash size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p className="text-center py-8 text-white/60">
          No regions match the current filter.
        </p>
      )}
    </div>
  );
};
