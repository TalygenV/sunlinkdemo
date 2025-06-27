import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ArrowDown,
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Wrench,
  Zap,
  Users,
} from "lucide-react";
import { auth, db, firestore } from "../../../lib/firebase";
import { ref, get } from "firebase/database";
import { InstallerPortalLayout } from "../layout/InstallerPortalLayout";
import { LoadingState } from "../../ui/loaders";
import { collection, getDocs, query, where } from "firebase/firestore";

// Project data interface
interface Project {
  id: string; // customer uid
  customerName: string;
  address: string;
  email: string;
  systemSize: number;
  panelCount: number;
  assignedDate: string;
  projectStatus: string;
  totalManualPanels: number;
  installerId?: string;
  installerName?: string;
  installerCompany?: string;
}

// Installer data interface
interface Installer {
  id: string;
  name?: string;
  companyName?: string;
}

// Component props
interface InstallerProjectsPageProps {
  isAdmin?: boolean;
}

export const InstallerProjectsPage: React.FC<InstallerProjectsPageProps> = ({
  isAdmin = false,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "name" | "status" | "size">(
    "date"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Admin-specific states
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [selectedInstaller, setSelectedInstaller] = useState<string | null>(
    null
  );

  // Toggle dropdowns
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isInstallerDropdownOpen, setIsInstallerDropdownOpen] = useState(false);

  // Status options
  const statusOptions = ["new", "in progress", "on hold", "completed"];

  // Fetch all installers if admin
  useEffect(() => {
    if (isAdmin) {
      const fetchInstallers = async () => {
        try {
          const installersQuery = query(
            collection(firestore, "users"),
            where("role", "==", "Installer")
          );

          const querySnapshot = await getDocs(installersQuery);
          const installersArray: Installer[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.email || "Unknown Installer",
              companyName: data.role || "Unknown Company",
            };
          });

          setInstallers(installersArray);
        } catch (error) {
          console.error("Error fetching installers:", error);
        }
      };

      fetchInstallers();
    }
  }, [isAdmin]);

  // Fetch projects based on user role
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          throw new Error("User not authenticated");
        }

        if (isAdmin) {
          // Admin: Fetch all projects from all installers
          const allProjects: Project[] = [];
          const installersRef = ref(db, "installers");
          const installersSnapshot = await get(installersRef);

          if (installersSnapshot.exists()) {
            const installersData = installersSnapshot.val();

            // Process each installer's projects
            for (const [installerId, installerData] of Object.entries(
              installersData
            )) {
              const installerInfo = installerData as any;

              if (installerInfo.assignedProjects) {
                const installerProjects = Object.entries(
                  installerInfo.assignedProjects
                ).map(([projectId, projectData]: [string, any]) => ({
                  id: projectId,
                  customerName: projectData.customerName || "Unknown Customer",
                  address: projectData.address || "Unknown Address",
                  email: projectData.email || "No Email",
                  systemSize: projectData.systemSize || 0,
                  panelCount: projectData.panelCount || 0,
                  assignedDate:
                    projectData.assignedDate || new Date().toISOString(),
                  projectStatus: projectData.projectStatus || "new",
                  totalManualPanels: projectData.totalManualPanels || 0,
                  installerId: installerId,
                  installerName: installerInfo.name || "Unknown Installer",
                  installerCompany:
                    installerInfo.companyName || "Unknown Company",
                }));

                allProjects.push(...installerProjects);
              }
            }

            setProjects(allProjects);
            setFilteredProjects(allProjects);
          } else {
            setProjects([]);
            setFilteredProjects([]);
          }
        } else {
          // Regular installer: Fetch only assigned projects
          const projectsRef = ref(
            db,
            `installers/${user.uid}/assignedProjects`
          );
          const snapshot = await get(projectsRef);

          if (snapshot.exists()) {
            const projectsData = snapshot.val();

            // Convert to array and add IDs
            const projectsArray: Project[] = Object.entries(projectsData).map(
              ([id, data]: [string, any]) => ({
                id,
                customerName: data.customerName || "Unknown Customer",
                address: data.address || "Unknown Address",
                email: data.email || "No Email",
                systemSize: data.systemSize || 0,
                panelCount: data.panelCount || 0,
                assignedDate: data.assignedDate || new Date().toISOString(),
                projectStatus: data.projectStatus || "new",
                totalManualPanels: data.totalManualPanels || 0,
              })
            );

            setProjects(projectsArray);
            setFilteredProjects(projectsArray);
          } else {
            // No projects found
            setProjects([]);
            setFilteredProjects([]);
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isAdmin]);

  // Filter and sort projects when filters change
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.customerName.toLowerCase().includes(query) ||
          project.address.toLowerCase().includes(query) ||
          project.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(
        (project) => project.projectStatus === statusFilter
      );
    }

    // Apply installer filter (admin only)
    if (isAdmin && selectedInstaller) {
      filtered = filtered.filter(
        (project) => project.installerId === selectedInstaller
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.assignedDate).getTime() -
            new Date(b.assignedDate).getTime();
          break;
        case "name":
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case "status":
          comparison = a.projectStatus.localeCompare(b.projectStatus);
          break;
        case "size":
          comparison = a.systemSize - b.systemSize;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredProjects(filtered);
  }, [
    projects,
    searchQuery,
    statusFilter,
    sortBy,
    sortDirection,
    selectedInstaller,
    isAdmin,
  ]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setSelectedInstaller(null);
    setSortBy("date");
    setSortDirection("desc");
  };

  // Check if filters are active
  const isFilterActive =
    searchQuery ||
    statusFilter ||
    selectedInstaller ||
    sortBy !== "date" ||
    sortDirection !== "desc";

  // Handle status selection
  const handleStatusSelect = (status: string | null) => {
    setStatusFilter(status);
    setIsStatusDropdownOpen(false);
  };

  // Handle installer selection
  const handleInstallerSelect = (installerId: string | null) => {
    setSelectedInstaller(installerId);
    setIsInstallerDropdownOpen(false);
  };

  // Status badge color based on status
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-orange-500/20 text-yellow-400";
      case "in progress":
        return "bg-amber-500/20 text-amber-400";
      case "on hold":
        return "bg-red-500/20 text-red-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-orange-500/20 text-gray-400";
    }
  };

  // Navigate to project details
  const navigateToProject = (projectId: string) => {
    navigate(`/installer/project/${projectId}`);
  };

  // Handle error state
  if (error) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <div className="p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-red-500/20">
          <h3 className="text-xl font-medium text-white mb-2">
            Projects Error
          </h3>
          <p className="text-white/70">{error}</p>
          <p className="mt-4 text-white/50 text-sm">
            Please try refreshing the page or contact support if this issue
            persists.
          </p>
        </div>
      </InstallerPortalLayout>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <LoadingState />
      </InstallerPortalLayout>
    );
  }

  return (
    <InstallerPortalLayout isAdmin={isAdmin}>
      <div className="w-full max-w-full overflow-hidden">
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-4 md:p-6 pb-6 md:pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-medium text-white">
              {isAdmin ? "All Projects" : "Assigned Projects"}
            </h2>

            {/* Search input */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 pl-10 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Filters and sorting */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {/* Admin-only installer filter */}
            {isAdmin && (
              <div className="relative mr-2">
                <button
                  onClick={() =>
                    setIsInstallerDropdownOpen(!isInstallerDropdownOpen)
                  }
                  className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white/70 hover:text-white"
                >
                  <Users size={16} />
                  <span>
                    {selectedInstaller
                      ? `Installer: ${
                          installers.find((i) => i.id === selectedInstaller)
                            ?.companyName || "Unknown"
                        }`
                      : "All Installers"}
                  </span>
                </button>

                {/* Installer dropdown */}
                {isInstallerDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 z-10 bg-orange-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2">
                      <button
                        onClick={() => handleInstallerSelect(null)}
                        className={`w-full text-left px-3 py-2 rounded-md ${
                          !selectedInstaller
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
                            selectedInstaller === installer.id
                              ? "bg-orange-500/20 text-yellow-400"
                              : "text-white/70 hover:bg-white/5"
                          }`}
                        >
                          {installer.companyName || installer.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Status filter */}
            <div className="relative">
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white/70 hover:text-white"
              >
                <Filter size={16} />
                <span className="mr-2">
                  {statusFilter
                    ? `Status: ${statusFilter}`
                    : "Filter by status"}
                </span>
              </button>

              {/* Status dropdown */}
              {isStatusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 z-10 bg-orange-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <div className="p-2">
                    <button
                      onClick={() => handleStatusSelect(null)}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        !statusFilter
                          ? "bg-orange-500/20 text-yellow-400"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      All statuses
                    </button>

                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusSelect(status)}
                        className={`w-full text-left px-3 py-2 rounded-md ${
                          statusFilter === status
                            ? "bg-orange-500/20 text-yellow-400"
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort by */}
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              <span className="text-white/50 text-sm">Sort by:</span>

              <button
                onClick={() => setSortBy("date")}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm ${
                  sortBy === "date"
                    ? "bg-orange-500/20 text-yellow-400"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                Date
              </button>

              <button
                onClick={() => setSortBy("name")}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm ${
                  sortBy === "name"
                    ? "bg-orange-500/20 text-yellow-400"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                Customer
              </button>

              <button
                onClick={() => setSortBy("status")}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm ${
                  sortBy === "status"
                    ? "bg-orange-500/20 text-yellow-400"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                Status
              </button>

              <button
                onClick={() => setSortBy("size")}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm ${
                  sortBy === "size"
                    ? "bg-orange-500/20 text-yellow-400"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                Size
              </button>

              <button
                onClick={toggleSortDirection}
                className="p-1.5 rounded-md text-white/70 hover:bg-white/5 hover:text-white"
                title={
                  sortDirection === "asc" ? "Sort ascending" : "Sort descending"
                }
              >
                <ArrowDown
                  size={16}
                  className={
                    sortDirection === "asc" ? "transform rotate-180" : ""
                  }
                />
              </button>
            </div>

            {/* Reset filters button */}
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="mt-2 sm:mt-0 sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md text-white/70 hover:text-white hover:bg-white/10 text-sm"
              >
                <X size={14} />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-white/60 text-sm">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>
          </div>

          {/* Projects table */}
          {filteredProjects.length > 0 ? (
            <div className="overflow-x-auto overflow-y-auto max-h-[68vh] -mx-4 sm:mx-0 relative">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full">
                  <thead className="bg-black/90 sticky top-0 ">
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70 font-medium text-xs md:text-sm bg-black/30">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium text-xs md:text-sm hidden md:table-cell bg-black/30">
                        Address
                      </th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium text-xs md:text-sm hidden sm:table-cell bg-black/30">
                        System Size
                      </th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium text-xs md:text-sm hidden sm:table-cell bg-black/30">
                        Assigned Date
                      </th>
                      {isAdmin && (
                        <th className="text-left py-3 px-4 text-white/70 font-medium text-xs md:text-sm hidden md:table-cell bg-black/30">
                          Installer
                        </th>
                      )}
                      <th className="text-left py-3 px-4 text-white/70 font-medium text-xs md:text-sm bg-black/30">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <motion.tr
                        key={project.id}
                        whileHover={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                        }}
                        className="border-b border-white/5 cursor-pointer"
                        onClick={() => navigateToProject(project.id)}
                      >
                        <td className="py-3 md:py-4 px-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                              <User size={14} className="text-white/70" />
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm md:text-base">
                                {project.customerName}
                              </p>
                              <p className="text-white/50 text-xs truncate max-w-[120px] sm:max-w-none">
                                {project.email}
                              </p>
                              {/* Mobile-only address */}
                              <p className="text-white/50 text-xs md:hidden mt-1 truncate max-w-[180px]">
                                {project.address}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <MapPin
                              size={16}
                              className="text-white/50 flex-shrink-0"
                            />
                            <span className="text-white/90 text-sm truncate max-w-[200px] lg:max-w-none">
                              {project.address}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-4 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Zap
                              size={16}
                              className="text-white/50 flex-shrink-0"
                            />
                            <div>
                              <p className="text-white text-sm">
                                {(project.totalManualPanels * 400) / 1000} kW
                              </p>
                              <p className="text-white/50 text-xs">
                                {project.totalManualPanels} panels
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-4 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Calendar
                              size={16}
                              className="text-white/50 flex-shrink-0"
                            />
                            <span className="text-white/90 text-sm">
                              {formatDate(project.assignedDate)}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="py-3 md:py-4 px-4 hidden md:table-cell">
                            {project.installerCompany ? (
                              <div className="flex items-center gap-2">
                                <Users
                                  size={16}
                                  className="text-white/50 flex-shrink-0"
                                />
                                <span className="text-white/90 text-sm">
                                  {project.installerCompany}
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/50 text-sm">
                                Not assigned
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3 md:py-4 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              project.projectStatus
                            )}`}
                          >
                            {project.projectStatus.charAt(0).toUpperCase() +
                              project.projectStatus.slice(1)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 md:p-12 bg-black/20 rounded-xl border border-white/5">
              <div className="p-4 bg-orange-500/10 rounded-full mb-4">
                <Wrench size={32} className="text-yellow-400" />
              </div>
              <h3 className="text-white font-medium mb-2">No projects found</h3>
              <p className="text-white/60 text-center max-w-md">
                {projects.length === 0
                  ? "You don't have any assigned projects yet. They will appear here once assigned."
                  : "No projects match your search criteria. Try adjusting your filters or search query."}
              </p>
            </div>
          )}
        </div>
      </div>
    </InstallerPortalLayout>
  );
};
