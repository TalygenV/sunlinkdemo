import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { InstallerPortalLayout } from '../../layout/InstallerPortalLayout';

interface AddInstallerPageProps {
  isAdmin?: boolean;
}

export const AddInstallerPage: React.FC<AddInstallerPageProps> = ({ isAdmin = false }) => {
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
          <div className="flex items-center gap-3 mb-6">
            <Link to="/installer/settings" className="text-white/70 hover:text-white text-sm">
              Settings
            </Link>
            <span className="text-white/30">›</span>
            <h2 className="text-xl font-medium text-white">Add Installer</h2>
          </div>
          
          <div className="p-8 bg-black/30 border border-white/10 rounded-xl flex flex-col items-center justify-center">
            <div className="p-4 bg-orange-500/10 rounded-full mb-4">
              <UserPlus size={32} className="text-yellow-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Add Installer Page</h3>
            <p className="text-white/60 text-center max-w-md mb-6">
              This is a placeholder for the Add Installer functionality. The actual form will be implemented later.
            </p>
          </div>
        </div>
      </div>
    </InstallerPortalLayout>
  );
}; 