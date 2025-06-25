import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, X, Info } from "lucide-react";
import { InstallerPortalLayout } from "../../layout/InstallerPortalLayout";
import { useRegionAssignments, RegionRow } from "./hooks";
import { Toolbar, RegionFilter } from "./Toolbar";
import { RegionTable } from "./RegionTable";
import { RegionModal } from "./RegionModal";
import { CoverageTester } from "./CoverageTester";
import { ref, update, get } from "firebase/database";
import { db, firestore } from "../../../../lib/firebase";
import { AddInstallerModal } from "./AddInstallerModal";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref as dbRef } from "firebase/database";
import { remove } from "firebase/database";

interface RegionRowExtended {
  type: string;
  code: string;
  name: string;
  installerId: string;
  installerEmail: string;
  installerName: string;
}

interface InstallerData {
  id: string;
  email: string;
}

interface ManageRegionsPageProps {
  isAdmin?: boolean;
  onClose: () => void;
}

export const ManageInstallersPage: React.FC<ManageRegionsPageProps> = ({
  isAdmin = false,
  onClose,
}) => {
  const { overrideMap } = useRegionAssignments();
  const [installers, setInstallers] = useState<InstallerData[]>([]);
  const [rows, setRows] = useState<RegionRowExtended[]>([]);
  const [filter, setFilter] = useState<RegionFilter>({
    type: "all",
    installer: "all",
    search: "",
  });

  const [editing, setEditing] = useState<RegionRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [testerOpen, setTesterOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [addInstallerOpen, setAddInstallerOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch all installers
      const installersQuery = query(
        collection(firestore, "users"),
        where("role", "==", "Installer")
      );
      const snapshot = await getDocs(installersQuery);

      const installerIdToEmail: Record<string, string> = {};
      const installerIdToName: Record<string, string> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        installerIdToEmail[doc.id] = data.email || " ";
        installerIdToName[doc.id] = data.name || " ";
      });

      // 2. Get installerRegionMapping from Realtime DB
      const mappingSnap = await get(dbRef(db, "installerRegionMapping"));
      const regionMap = mappingSnap.val() || {};

      const installerRows: RegionRowExtended[] = [];
      const installerIdSet = new Set<string>();

      // 3. Only process installers who have region mapping
      Object.keys(regionMap).forEach((installerId) => {
        const regionData = regionMap[installerId];
        const installerEmail = installerIdToEmail[installerId] || " ";
        const installerName = installerIdToName[installerId] || " ";

        Object.entries(regionData).forEach(([regionType, regionCode]: any) => {
          if (["zip", "city", "county", "state"].includes(regionType)) {
            const finalCode =
              regionCode && regionCode !== "null" ? regionCode : "";

            if (finalCode) {
              installerRows.push({
                type: regionType as "zip" | "city" | "county" | "state",
                code: finalCode,
                name: finalCode,
                installerId,
                installerEmail,
                installerName,
              });

              installerIdSet.add(installerId); // ✅ Track installerIds who have region
            }
          }
        });
      });

      setRows(installerRows);

      // 4. Now build installersList only from installerIds present in installerRows
      // 4. Now build installersList only from installerIds present in installerRows and having a name
      const installersList = snapshot.docs
        .filter(
          (doc) =>
            installerIdSet.has(doc.id) &&
            doc.data().name &&
            doc.data().name.trim() !== ""
        )
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email || " ",
          };
        });

      setInstallers(installersList);
    } catch (err) {
      console.error("❌ Error loading installer region data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const installerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    installers.forEach((ins) => {
      map[ins.id] = ins.email || ins.id;
    });
    return map;
  }, [installers]);

  const openModal = (row?: RegionRow) => {
    setEditing(row || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async (data: {
    type: string;
    code: string;
    name: string;
    installerId: string;
    previousInstallerId?: string;
  }) => {
    const { type, code, name, installerId, previousInstallerId } = data;
    const updates: Record<string, any> = {
      [`/regionAssignments/${type}/${code}`]: {
        installerId,
        name,
        updatedAt: Date.now(),
      },
      [`/installers/${installerId}/assignments/${type}-${code}`]: true,
    };

    if (previousInstallerId && previousInstallerId !== installerId) {
      updates[
        `/installers/${previousInstallerId}/assignments/${type}-${code}`
      ] = null;
    }

    await update(ref(db), updates);
    setSuccess(true);

    // Wait for 3 seconds before closing the modal
    setTimeout(() => {
      onClose();
    }, 3000);
    closeModal();

    // ✅ Fetch fresh data after save
    fetchData();
  };

  // const handleDelete = async (row: RegionRow) => {
  //   if (!window.confirm("Delete this region assignment?")) return;
  //   const updates: Record<string, any> = {
  //     [`/regionAssignments/${row.type}/${row.code}`]: null,
  //     [`/installers/${row.installerId}/assignments/${row.type}-${row.code}`]:
  //       null,
  //   };
  //   await update(ref(db), updates);
  // };

  const handleDelete = async (row: RegionRow) => {
    try {
      // Delete the specific region for the installer
      await remove(
        ref(db, `installerRegionMapping/${row.installerId}/${row.type}`)
      );

      // ✅ Optional: You may also want to refresh data after delete
      fetchData();

      // ✅ Optional: Show success message
      console.log("✅ Region deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting installer region mapping:", error);
    }
  };

  if (!isAdmin) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <h3 className="text-xl font-medium text-white mb-2">
            Unauthorized Access
          </h3>
          <p className="text-white/70">
            You don't have permission to access this page.
          </p>
          <Link
            to="/installer/projects"
            className="mt-4 inline-block text-yellow-400 hover:text-yellow-300"
          >
            Return to Projects
          </Link>
        </div>
      </InstallerPortalLayout>
    );
  }

  return (
    <InstallerPortalLayout isAdmin={isAdmin}>
      <div className="w-full flex flex-col items-center space-y-6">
        <div className="rounded-xl border border-white/10 p-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/installer/settings"
                className="text-white/70 hover:text-white text-sm"
              >
                Settings
              </Link>
              <span className="text-white/30">›</span>
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                Manage Regions
                <button
                  onClick={() => setInfoOpen(true)}
                  className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  aria-label="How it works"
                >
                  <Info size={16} />
                </button>
              </h2>
            </div>

            <div className="hidden md:flex gap-3 ml-auto items-center">
              <button
                onClick={() => setTesterOpen(true)}
                className="p-3 rounded-full bg-black/40 hover:bg-white/10 text-white border border-white/10"
                aria-label="Coverage tester"
              >
                <MapPin size={18} />
              </button>
              <button
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 text-sm font-medium"
                onClick={() => setAddInstallerOpen(true)}
              >
                Add Installer
              </button>
              <button
                className="px-6 py-3 bg-black hover:bg-black/90 text-white rounded-lg shadow-lg text-sm font-medium border border-white/20"
                onClick={() => openModal()}
              >
                Add Region
              </button>
            </div>
          </div>

          <div className="md:hidden flex flex-col sm:flex-row gap-4 mb-6 w-full">
            <button
              onClick={() => setTesterOpen(true)}
              className="flex items-center justify-center gap-2 py-4 bg-black/40 hover:bg-white/10 border border-white/10 text-white rounded-lg text-base font-medium"
            >
              <MapPin size={18} /> Coverage Tester
            </button>
            <button
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 text-center text-base font-medium"
              onClick={() => setAddInstallerOpen(true)}
            >
              Add Installer
            </button>
            <button
              className="flex-1 py-4 bg-black hover:bg-black/90 text-white rounded-lg shadow-lg text-center text-base font-medium border border-white/10"
              onClick={() => openModal()}
            >
              Add Region
            </button>
          </div>

          <Toolbar
            filter={filter}
            onChange={setFilter}
            installers={installers}
          />

          <RegionTable
            rows={rows}
            filter={filter}
            overrideMap={overrideMap}
            installerNameMap={installerNameMap}
            onEdit={(row) => openModal(row)}
            onDelete={handleDelete}
          />

          {modalOpen && (
            <RegionModal
              initial={editing}
              installers={installers}
              onSave={handleSave}
              onClose={closeModal}
            />
          )}

          {testerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
              <div className="relative w-full max-w-xl mx-auto">
                <CoverageTester />
                <button
                  onClick={() => setTesterOpen(false)}
                  className="absolute top-[25%] right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/40"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {infoOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
              <div className="relative w-full max-w-md mx-auto bg-black border border-white/10 rounded-xl p-6">
                <button
                  onClick={() => setInfoOpen(false)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/40"
                  aria-label="Close info"
                >
                  <X size={14} />
                </button>
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Info size={18} /> How region assignments work
                </h3>
                <ol className="text-white/80 text-sm space-y-3 list-decimal pl-4 leading-relaxed">
                  <li>
                    Assign regions (ZIP, city, county, or state) to an
                    installer.
                  </li>
                  <li>
                    The most specific match wins. For example, if the state of
                    Texas is assigned to A but Houston city is assigned to B,
                    customers in Houston will go to installer B.
                  </li>
                  <li>
                    The{" "}
                    <span className="font-medium text-white">Overrides</span>{" "}
                    badge indicates that a broader region is partially
                    superseded by a more specific assignment with a different
                    installer.
                  </li>
                  <li>
                    The delete button will remove the region assignment from the
                    installer.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {addInstallerOpen && (
            <AddInstallerModal onClose={() => setAddInstallerOpen(false)} />
          )}
        </div>
      </div>
    </InstallerPortalLayout>
  );
};
