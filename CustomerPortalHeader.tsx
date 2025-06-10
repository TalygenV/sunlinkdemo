import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, User, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import sunlinkLogo from "../../../images/solar_panels/sunlink_logo.png";

interface CustomerPortalHeaderProps {
  userData: any;
  toggleSidebar: () => void;
}

/**
 * Header component for the Customer Portal
 * Displays user info, notifications, and navigation controls
 * Fully responsive for all device sizes
 */
export const CustomerPortalHeader: React.FC<CustomerPortalHeaderProps> = ({ 
  userData, 
  toggleSidebar 
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract user's first name for display
  const firstName = userData?.name?.split(' ')[0] || 'Customer';
  
  // Format address for display - limit to just the street name for brevity
  const formattedAddress = userData?.address 
    ? userData.address.split(',')[0]
    : 'Your Project';

  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-white/10 px-4 py-3 md:px-8 md:py-4">
      <div className="max-w-[2000px] mx-auto flex items-center justify-between">
        {/* Logo and Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <motion.button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </motion.button>
          
          <Link to="/" className="flex items-center gap-2">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={sunlinkLogo}
              alt="Unlimited Energy"
              className="h-7 md:h-10 w-auto transition-opacity duration-300 hover:opacity-90 "
            />
          </Link>
        </div>
        
        {/* Project Info - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 font-light text-white/80">
          <span>Project:</span>
          <span className="font-medium text-white">{formattedAddress}</span>
        </div>
        
        {/* User Controls */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <motion.button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {/* Notification indicator */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
          </motion.button>
          
          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <motion.button
              className="flex items-center gap-2 py-2 px-2 md:px-3 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="hidden md:block text-sm font-medium">{firstName}</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
            </motion.button>
            
            {/* Dropdown Menu */}
            {showUserMenu && (
              <motion.div
                className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white">{userData?.name || 'Customer'}</p>
                  <p className="text-xs text-white/60 truncate">{userData?.email || ''}</p>
                </div>
                <div className="py-1">
                  <Link 
                    to="/portal/profile" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <Link 
                    to="/portal/support" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Get Support
                  </Link>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors w-full text-left"
                    onClick={() => {
                      // Sign out logic would go here
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};