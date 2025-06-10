import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, CalendarClock, Phone, Mail, ArrowDownToLine, ChevronRight } from 'lucide-react';
import { StageData } from './InstallationProgressTracker';

interface StageDetailsProps {
  stage: StageData;
  onClose: () => void;
}

/**
 * Detailed view for an installation stage
 * Shows comprehensive information, documents, and contacts
 * Adapts to different screen sizes with responsive design
 */
export const StageDetails: React.FC<StageDetailsProps> = ({ stage, onClose }) => {
  // Helper to format the date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Get status label and colors
  const getStatusInfo = () => {
    switch (stage.status) {
      case 'completed':
        return { label: 'Completed', color: 'bg-green-500 text-green-50' };
      case 'current':
        return { label: 'In Progress', color: 'bg-orange-500 text-yellow-50' };
      case 'delayed':
        return { label: 'Delayed', color: 'bg-amber-500 text-amber-50' };
      default:
        return { label: 'Upcoming', color: 'bg-orange-500 text-gray-50' };
    }
  };
  
  const statusInfo = getStatusInfo();

  return (
    <motion.div 
      className="mt-6 mb-2 rounded-xl bg-black/30 border border-white/10 overflow-hidden shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg md:text-xl font-medium text-white">{stage.name}</h3>
            <span className={`text-xs py-1 px-2 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CalendarClock size={16} />
            <span>{formatDate(stage.date)}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          aria-label="Close details"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Description */}
        <p className="text-white/80 mb-6">{stage.description}</p>
        
        {/* Detailed Information */}
        {stage.details && stage.details.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">Stage Information</h4>
            <div className="space-y-4">
              {stage.details.map((detail, index) => (
                <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h5 className="text-sm font-medium text-white mb-2">{detail.title}</h5>
                  <p className="text-sm text-white/70">{detail.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Document Section */}
        {stage.documents && stage.documents.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stage.documents.map((doc, index) => (
                <motion.a
                  key={index}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mr-3 p-2 rounded bg-orange-500/20 text-yellow-400">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-white truncate">{doc.name}</h5>
                    <p className="text-xs text-white/50">{doc.fileType} • {doc.fileSize}</p>
                  </div>
                  <div className="ml-2 text-white/40 group-hover:text-white/80 transition-colors">
                    <ArrowDownToLine size={16} />
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        )}
        
        {/* Contact Information */}
        {stage.contactInfo && (
          <div>
            <h4 className="text-white font-medium mb-3">Your Contact</h4>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-medium text-lg mr-3">
                  {stage.contactInfo.name.charAt(0)}
                </div>
                <div>
                  <h5 className="text-white font-medium">{stage.contactInfo.name}</h5>
                  <p className="text-sm text-white/60">{stage.contactInfo.role}</p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
                <a
                  href={`mailto:${stage.contactInfo.email}`}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Mail size={16} className="text-yellow-400" />
                  <span>{stage.contactInfo.email}</span>
                </a>
                
                <a
                  href={`tel:${stage.contactInfo.phone}`}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone size={16} className="text-green-400" />
                  <span>{stage.contactInfo.phone}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with action button */}
      <div className="p-4 md:p-6 border-t border-white/10 flex justify-end">
        <motion.button
          onClick={onClose}
          className="flex items-center gap-2 py-2 px-4 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Close Details</span>
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
};