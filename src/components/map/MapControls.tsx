import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, EyeOff, MapPin, Map, Layers, Grid, Sliders } from 'lucide-react';
import { itemVariants, controlButtonVariants, fadeIn } from '../utils/animations';

interface MapControlsProps {
  showRoadmap: boolean;
  showImageOverlay: boolean;
  showPanels: boolean;
  usePanelCentering: boolean;
  centeringFactor: number;
  obstructionMode: boolean;
  onShowRoadmapChange: (checked: boolean) => void;
  onShowImageOverlayChange: (checked: boolean) => void;
  onShowPanelsChange: (checked: boolean) => void;
  onUsePanelCenteringChange: (checked: boolean) => void;
  onCenteringFactorChange: (value: number) => void;
  onObstructionModeToggle: () => void;
}

export const MapControls = ({
  showRoadmap,
  showImageOverlay,
  showPanels,
  usePanelCentering,
  centeringFactor,
  obstructionMode,
  onShowRoadmapChange,
  onShowImageOverlayChange,
  onShowPanelsChange,
  onUsePanelCenteringChange,
  onCenteringFactorChange,
  onObstructionModeToggle
}: MapControlsProps) => {
  const [activeTab, setActiveTab] = useState<'layers'|'settings'>('layers');
  const [recentlyChanged, setRecentlyChanged] = useState<string | null>(null);

  // Animate feedback for changes
  const animateChange = (setting: string) => {
    setRecentlyChanged(setting);
    setTimeout(() => setRecentlyChanged(null), 1000);
  };

  return (
    <motion.div
      variants={itemVariants}
      className="w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-xl"
    >
      {/* Header with tabs */}
      <div className="flex border-b border-white/10">
        <motion.button
          variants={controlButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'layers'
              ? 'text-white bg-white/5'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === 'layers' ? 'text-purple-400' : ''}`} />
          <span>Map Layers</span>
        </motion.button>
        
        <motion.button
          variants={controlButtonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-white bg-white/5'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sliders className={`w-4 h-4 ${activeTab === 'settings' ? 'text-yellow-400' : ''}`} />
          <span>Panel Settings</span>
        </motion.button>
      </div>
      
      {/* Tab content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === 'layers' ? (
            <motion.div
              key="layers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-sm font-medium tracking-wide">Map Visualization</h3>
                <Map className="w-4 h-4 text-purple-400 icon-glow-purple" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <motion.label
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    showRoadmap
                      ? 'border-purple-500/30 bg-purple-500/10'
                      : 'border-white/5 bg-white/5'
                  } transition-all duration-300 hover:bg-white/10`}
                  animate={{
                    scale: recentlyChanged === 'roadmap' ? [1, 1.03, 1] : 1,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className={`relative w-5 h-5 flex items-center justify-center rounded ${
                    showRoadmap ? 'bg-purple-500' : 'bg-white/10'
                  }`}>
                    {showRoadmap && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-sm"
                      />
                    )}
                  </div>
                  <div>
                    <span className={`text-sm ${showRoadmap ? 'text-white' : 'text-gray-400'}`}>
                      Street Map
                    </span>
                    {showRoadmap && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className="h-0.5 bg-gradient-to-r from-purple-500/80 to-transparent rounded-full"
                      />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showRoadmap}
                    onChange={(e) => {
                      onShowRoadmapChange(e.target.checked);
                      animateChange('roadmap');
                    }}
                  />
                </motion.label>
                
                <motion.label
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    showImageOverlay
                      ? 'border-blue-500/30 bg-orange-500/10'
                      : 'border-white/5 bg-white/5'
                  } transition-all duration-300 hover:bg-white/10`}
                  animate={{
                    scale: recentlyChanged === 'satellite' ? [1, 1.03, 1] : 1,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className={`relative w-5 h-5 flex items-center justify-center rounded ${
                    showImageOverlay ? 'bg-orange-500' : 'bg-white/10'
                  }`}>
                    {showImageOverlay && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-sm"
                      />
                    )}
                  </div>
                  <div>
                    <span className={`text-sm ${showImageOverlay ? 'text-white' : 'text-gray-400'}`}>
                      Satellite View
                    </span>
                    {showImageOverlay && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className="h-0.5 bg-gradient-to-r from-blue-500/80 to-transparent rounded-full"
                      />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showImageOverlay}
                    onChange={(e) => {
                      onShowImageOverlayChange(e.target.checked);
                      animateChange('satellite');
                    }}
                  />
                </motion.label>
                
                <motion.label
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    showPanels
                      ? 'border-cyan-500/30 bg-cyan-500/10'
                      : 'border-white/5 bg-white/5'
                  } transition-all duration-300 hover:bg-white/10`}
                  animate={{
                    scale: recentlyChanged === 'panels' ? [1, 1.03, 1] : 1,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className={`relative w-5 h-5 flex items-center justify-center rounded ${
                    showPanels ? 'bg-cyan-500' : 'bg-white/10'
                  }`}>
                    {showPanels && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-sm"
                      />
                    )}
                  </div>
                  <div>
                    <span className={`text-sm ${showPanels ? 'text-white' : 'text-gray-400'}`}>
                      Solar Panels
                    </span>
                    {showPanels && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className="h-0.5 bg-gradient-to-r from-cyan-500/80 to-transparent rounded-full"
                      />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showPanels}
                    onChange={(e) => {
                      onShowPanelsChange(e.target.checked);
                      animateChange('panels');
                    }}
                  />
                </motion.label>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-sm font-medium tracking-wide">Panel Configuration</h3>
                <Grid className="w-4 h-4 text-yellow-400 icon-glow-accent" />
              </div>
              
              <motion.label
                className={`flex items-center gap-3 p-3 mb-3 rounded-lg border ${
                  usePanelCentering
                    ? 'border-blue-500/30 bg-orange-500/10'
                    : 'border-white/5 bg-white/5'
                } transition-all duration-300 hover:bg-white/10`}
                animate={{
                  scale: recentlyChanged === 'centering' ? [1, 1.03, 1] : 1,
                  transition: { duration: 0.3 }
                }}
              >
                <div className={`relative w-5 h-5 flex items-center justify-center rounded ${
                  usePanelCentering ? 'bg-orange-500' : 'bg-white/10'
                }`}>
                  {usePanelCentering && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-sm"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-sm ${usePanelCentering ? 'text-white' : 'text-gray-400'}`}>
                    Panel Alignment
                  </span>
                  {usePanelCentering && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className="h-0.5 bg-gradient-to-r from-blue-500/80 to-transparent rounded-full"
                    />
                  )}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={usePanelCentering}
                  onChange={(e) => {
                    onUsePanelCenteringChange(e.target.checked);
                    animateChange('centering');
                  }}
                />
              </motion.label>
              
              {usePanelCentering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                    <label className="flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-300">Alignment Intensity</span>
                        <motion.span
                          key={centeringFactor}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-sm font-medium text-white bg-orange-500/20 px-2 py-0.5 rounded-md border border-blue-500/30"
                        >
                          {centeringFactor}%
                        </motion.span>
                      </div>
                      
                      <div className="relative mt-1">
                        <div className="absolute -top-1 left-0 right-0 h-2 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 rounded-full blur-sm"></div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={centeringFactor}
                          onChange={(e) => {
                            onCenteringFactorChange(parseInt(e.target.value));
                            if (recentlyChanged !== 'slider') animateChange('slider');
                          }}
                          className="solar-slider w-full relative z-10"
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Individual Placement</span>
                        <span>Full Alignment</span>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Obstruction mode button - always visible */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <motion.button
            variants={controlButtonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onObstructionModeToggle}
            className={`w-full relative overflow-hidden px-4 py-3 text-sm font-medium rounded-lg ${
              obstructionMode
                ? 'bg-gradient-to-r from-red-600/80 to-red-500/80 text-white border border-red-400/20'
                : 'bg-gradient-to-r from-purple-600/80 to-purple-500/80 text-white border border-purple-400/20'
            } backdrop-blur-sm`}
          >
            {/* Animated background shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-button-shine"></div>
            
            <div className="flex items-center justify-center gap-2 relative">
              {obstructionMode ? (
                <>
                  <EyeOff className="w-4 h-4 icon-glow-red" />
                  <span>Exit Obstruction Mode</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 icon-glow-purple" />
                  <span>Mark Obstructions</span>
                </>
              )}
            </div>
            
            {/* Subtle glow border */}
            <motion.div
              className={`absolute inset-0 rounded-lg pointer-events-none ${
                obstructionMode ? 'border border-red-400/30' : 'border border-purple-400/30'
              }`}
              animate={{
                boxShadow: obstructionMode
                  ? ['0 0 10px 2px rgba(248, 113, 113, 0)', '0 0 10px 2px rgba(248, 113, 113, 0.3)', '0 0 10px 2px rgba(248, 113, 113, 0)']
                  : ['0 0 10px 2px rgba(192, 132, 252, 0)', '0 0 10px 2px rgba(192, 132, 252, 0.3)', '0 0 10px 2px rgba(192, 132, 252, 0)']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};