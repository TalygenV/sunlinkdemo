import React, { useState, useContext, useEffect } from "react";
import { Sun, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormContext } from "../../App";
import { SignInModal } from "../ui/modals";
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '../../lib/firebase';
import { useLocation, matchPath } from 'react-router-dom';
import sunlinkLogo from "../../images/solar_panels/sunlink_logo.png";

const auth = getAuth(app);

const navItems = ['Home', 'Why Sunlink?', 'Plans & Pricing', 'Contact', 'Sign In'];

const SCROLL_THRESHOLD = 20;

export default function Navbar() {
  const {
    showForm,
    setShowForm,
    isAuthenticated,
    setIsAuthenticated,
    userData,
    setUserData
  } = React.useContext(FormContext);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showSignIn, setShowSignIn] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const location = useLocation();
  
  // Check if the current route matches the SystemDesign paths (covers nested routes too)
  const isSystemDesignPage =
    Boolean(matchPath({ path: '/design', end: false }, location.pathname)) ||
    Boolean(matchPath({ path: '/system-design', end: false }, location.pathname)) ||
    location.pathname.includes('/design') ||
    document.querySelector('.design-route') !== null;

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't render navbar on SystemDesign page
  if (isSystemDesignPage) {
    return null;
  }

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/80 backdrop-blur-xl' : 'bg-transparent'
    }`}>
      <div className="container-fluid px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={sunlinkLogo}
              alt="Unlimited Energy"
              className="h-7 w-auto transition-opacity duration-300 hover:opacity-90 "
            />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <AnimatePresence mode="wait">
              {!showForm && !isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center space-x-4"
                >
                  {navItems.map((item, index) => (
                    <motion.a
                      key={item}
                      onClick={() => item === 'Sign In' ? setShowSignIn(true) : null}
                      href={item === 'Sign In' ? '#' : `#${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="px-5 py-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm tracking-wide"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      {item}
                    </motion.a>
                  ))}
                  <motion.a
                    onClick={() => setShowForm(true)}
                    className="btn-sheen ml-6 px-8 py-2 text-white transition-all duration-300 text-sm tracking-wide rounded-full shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ cursor: 'pointer' }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: navItems.length * 0.05 }}
                  >
                    Get Started
                  </motion.a>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Mobile menu button */}
          {!isAuthenticated && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-3 transition-all ${
                  isScrolled ? 'text-white hover:text-gray-300' : 'text-white hover:text-gray-300'
                }`}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 md:hidden bg-black/95 backdrop-blur-xl shadow-lg border-t border-white/10"
          >
            <div className="px-6 py-8 space-y-4">
              {['Home', 'Why ?', 'Plans & Pricing', 'Contact', 'Sign In'].map((item) => (
                <motion.a
                  key={item}
                  onClick={() => item === 'Sign In' ? setShowSignIn(true) : null}
                  href={item === 'Sign In' ? '#' : `#${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="block px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm tracking-wide"
                  whileHover={{ x: 4 }}
                  whileTap={{ x: 0 }}
                >
                  {item}
                </motion.a>
              ))}
              <div className="pt-2 pb-1">
                <motion.a
                  onClick={() => setShowForm(true)}
                  className="btn-sheen block px-6 py-2 text-center text-white transition-all duration-300 text-sm tracking-wide rounded-full shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ cursor: 'pointer' }}
                >
                  Get Started
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSignInSuccess={() => {
          // Get the current authenticated user from Firebase
          const user = auth.currentUser;
          if (user) {
            // Update user data with Firebase user info
            setUserData({
              ...userData,
              name: user.displayName || 'User',
              phoneNumber: user.phoneNumber || undefined,
              uid: user.uid, // Important: Set the user's UID for database queries
              address: userData.address || '123 Main St' // Keep existing address or use default
            });
          }
          setIsAuthenticated(true);
          setShowSignIn(false);
        }}
      />
    </nav>
  );
}