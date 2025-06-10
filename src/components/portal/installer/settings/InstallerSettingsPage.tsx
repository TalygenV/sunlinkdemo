import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, UserPlus, Map } from 'lucide-react';
import { InstallerPortalLayout } from '../../layout/InstallerPortalLayout';

interface InstallerSettingsPageProps {
  isAdmin?: boolean;
}

export const InstallerSettingsPage: React.FC<InstallerSettingsPageProps> = ({ isAdmin = false }) => {
    console.log(isAdmin);
  if (!isAdmin) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <h3 className="text-xl font-medium text-white mb-2">Unauthorized Access</h3>
          <p className="text-white/70">You don't have permission to access this page.</p>
          <Link to="/installer/projects" className="mt-4 inline-block text-yellow-400 hover:text-yellow-300">
            Return to Projects
          </Link>
        </div>
      </InstallerPortalLayout>
    );
  }

  return (
    <InstallerPortalLayout isAdmin={isAdmin}>
      <div className="w-full max-w-full">
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <h2 className="text-2xl font-medium text-white mb-6">Admin Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* Add Installer Card */}
     
            
            {/* Manage Regions Card */}
            <Link 
              to="/installer/settings/manage-installers"
              className="p-6 bg-black/30 border border-white/10 rounded-xl hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black rounded-lg">
                  <Map size={24} className="text-white icon-glow-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Manage Installers</h3>
                  <p className="text-white/60 text-sm">Configure installation regions</p>
                </div>
              </div>
            </Link>
            
            {/* Other Settings Card */}
          
          </div>
        </div>
      </div>
    </InstallerPortalLayout>
  );
}; 