import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  Settings,
  HelpCircle,
  Users
} from 'lucide-react';

interface CustomerPortalSidebarProps {
  userData: any;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  status?: 'new' | 'updated';
}

/**
 * Sidebar navigation component for Customer Portal
 * Provides links to all portal sections with visual indicators
 */
export const CustomerPortalSidebar: React.FC<CustomerPortalSidebarProps> = ({ userData }) => {
  const location = useLocation();
  const systemSize = userData?.systemSizeKw || '5.6';
  const installStage = userData?.installationStage || 'installation';

  // Calculate progress percentage based on current installation stage
  const calculateProgress = () => {
    const stages = ['notice', 'survey', 'installation', 'interconnection', 'service'];
    const currentIndex = stages.indexOf(installStage);
    return currentIndex >= 0 ? (currentIndex / (stages.length - 1)) * 100 : 0;
  };

  // Navigation item component with active state styling
  const NavItem: React.FC<NavItemProps> = ({ to, icon, label, status }) => {
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
    
    return (
      <NavLink 
        to={to}
        className={({ isActive }) => `
          flex items-center gap-3 p-3 rounded-xl transition-all duration-300
          ${isActive ? 
            'bg-orange-600/20 text-yellow-400 font-medium' : 
            'text-white/70 hover:bg-white/5 hover:text-white'
          }
        `}
      >
        <div className={`${isActive ? 'text-yellow-400' : 'text-white/60'}`}>
          {icon}
        </div>
        <span>{label}</span>
        
        {status && (
          <span className={`
            ml-auto text-xs py-0.5 px-2 rounded-full font-medium
            ${status === 'new' ? 'bg-orange-500/30 text-yellow-300' : 'bg-amber-500/30 text-amber-300'}
          `}>
            {status === 'new' ? 'New' : 'Updated'}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="h-full flex flex-col py-6 px-3">
      {/* User System Summary */}
      <div className="mb-6 px-3">
        <h2 className="text-sm font-medium text-white/50 mb-2">Your System</h2>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-purple-900/40 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">System Size</span>
            <span className="text-base font-medium text-white">{systemSize} kW</span>
          </div>
          
          {/* Installation Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Installation Progress</span>
              <span className="text-xs font-medium text-white/80">{Math.round(calculateProgress())}%</span>
            </div>
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress()}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        <h2 className="text-sm font-medium text-white/50 px-3 mb-2">Navigation</h2>
        
        <NavItem 
          to="/portal" 
          icon={<Home size={18} />} 
          label="Dashboard" 
        />
        
        <NavItem 
          to="/portal/progress" 
          icon={<BarChart3 size={18} />} 
          label="Installation Progress" 
          status="updated"
        />
        
        <NavItem 
          to="/portal/system" 
          icon={<BarChart3 size={18} />} 
          label="System Visualization" 
        />
        
        <NavItem 
          to="/portal/documents" 
          icon={<FileText size={18} />} 
          label="Documents" 
        />
        
        <NavItem 
          to="/portal/support" 
          icon={<MessageSquare size={18} />} 
          label="Support" 
        />
        
        <NavItem 
          to="/portal/referrals" 
          icon={<Users size={18} />} 
          label="Refer a Friend" 
          status="new"
        />
      </nav>
      
      {/* Bottom Links */}
      <div className="mt-6 space-y-1">
        <h2 className="text-sm font-medium text-white/50 px-3 mb-2">Settings</h2>
        
        <NavItem 
          to="/portal/settings" 
          icon={<Settings size={18} />} 
          label="Account Settings" 
        />
        
        <NavItem 
          to="/portal/help" 
          icon={<HelpCircle size={18} />} 
          label="Help Center" 
        />
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-white/10 px-3">
        <div className="text-xs text-white/40 flex justify-between">
          <span>© 2025</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};