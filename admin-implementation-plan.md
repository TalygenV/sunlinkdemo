# Admin Functionality Implementation Plan

## Overview
This plan outlines the steps to add admin functionality to the application. Currently, the app supports regular users and installer accounts. We need to add admin accounts that can see all projects and filter them by installer.

## Step 1: Update App.tsx to Detect Admin Users
- [x] Add `isAdmin` state variable (similar to existing `isInstaller`)
- [x] Add `adminData` state (similar to `installerData`)
- [x] Modify auth check to verify if user is an admin by checking if their UID exists in the `admins/` path
- [x] Update auth state listener to maintain admin state
- [x] Pass `isAdmin` prop to relevant components

## Step 2: Update InstallerPortalLayout.tsx (if needed)
- [x] Review if any layout changes are needed for admin users
- [x] Consider adding admin-specific navigation items or indicators

## Step 3: Update InstallerProjectsPage.tsx
- [x] Modify component to accept `isAdmin` prop
- [x] Add state for installers list and selected installer
- [x] Update project fetching logic:
  - For installers: Only show their assigned projects (current behavior)
  - For admins: Fetch all projects from all installers
- [x] Add function to fetch all installers (for admin dropdown)
- [x] Add installer dropdown UI component (only visible to admins)
- [x] Implement filtering logic based on selected installer

## Step 4: Testing
- [ ] Test admin detection works correctly
- [ ] Verify admins can see all projects
- [ ] Test installer filtering functionality
- [ ] Ensure regular user and installer permissions remain intact

## Implementation Details

### App.tsx Changes
```typescript
// Add new state variables
const [isAdmin, setIsAdmin] = useState(false);
const [adminData, setAdminData] = useState<AdminData | null>(null);

// Add admin check in auth effect
const adminRef = ref(db, `admins/${user.uid}`);
const adminSnapshot = await get(adminRef);
if (adminSnapshot.exists()) {
  // User is an admin
  setIsAdmin(true);
  // Set admin data...
}

// Pass isAdmin prop to components
<InstallerProjectsPage isAdmin={isAdmin} />
```

### InstallerProjectsPage.tsx Changes
```typescript
// Update component props
interface InstallerProjectsPageProps {
  isAdmin?: boolean;
}

export const InstallerProjectsPage: React.FC<InstallerProjectsPageProps> = ({ 
  isAdmin = false 
}) => {
  // Add state for installers
  const [installers, setInstallers] = useState<{id: string, companyName: string}[]>([]);
  const [selectedInstaller, setSelectedInstaller] = useState<string | null>(null);
  
  // Fetch all installers if admin
  useEffect(() => {
    if (isAdmin) {
      fetchAllInstallers();
    }
  }, [isAdmin]);
  
  // Update fetchProjects for admin
  const fetchProjects = async () => {
    if (isAdmin) {
      // Fetch all projects from all installers
    } else {
      // Current logic - fetch only assigned projects
    }
  };
  
  // Add installer dropdown UI (only for admins)
  {isAdmin && (
    <div className="relative">
      <button 
        onClick={() => setIsInstallerDropdownOpen(!isInstallerDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white/70 hover:text-white"
      >
        <Users size={16} />
        <span>{selectedInstaller ? `Installer: ${selectedInstaller}` : 'All Installers'}</span>
      </button>
      
      {/* Dropdown content */}
    </div>
  )}
}