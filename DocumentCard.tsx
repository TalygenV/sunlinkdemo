import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  FileImage, 
  FileSpreadsheet,
  FilePlus,
  Download,
  ExternalLink
} from 'lucide-react';

// Document information interface
export interface DocumentInfo {
  id: string;
  name: string;
  description?: string;
  fileType: string;
  dateAdded: string;
  url: string;
  size?: string;
  category?: string;
  previewAvailable?: boolean;
}

interface DocumentCardProps {
  document: DocumentInfo;
  onSelect: (doc: DocumentInfo) => void;
  onDownload: (doc: DocumentInfo) => void;
}

/**
 * Document card component for displaying document information
 * Used in the documents repository grid
 */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onSelect,
  onDownload
}) => {
  // Helper to determine the appropriate icon based on file type
  const getDocumentIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) {
      return <FileText size={20} />;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => type.includes(ext))) {
      return <FileImage size={20} />;
    } else if (['xls', 'xlsx', 'csv'].some(ext => type.includes(ext))) {
      return <FileSpreadsheet size={20} />;
    } else {
      return <FilePlus size={20} />;
    }
  };
  
  // Helper to determine the appropriate background based on file type
  const getDocumentColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) {
      return 'bg-red-500/20 text-red-400';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => type.includes(ext))) {
      return 'bg-green-500/20 text-green-400';
    } else if (['xls', 'xlsx', 'csv'].some(ext => type.includes(ext))) {
      return 'bg-emerald-500/20 text-emerald-400';
    } else {
      return 'bg-orange-500/20 text-yellow-400';
    }
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-black/30 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group"
    >
      <div className="flex flex-col h-full">
        {/* Document Preview Header */}
        {document.previewAvailable && (
          <div 
            className="bg-gradient-to-b from-gray-800/50 to-black/70 h-32 flex items-center justify-center cursor-pointer"
            onClick={() => onSelect(document)}
          >
            <div className={`p-4 rounded-full ${getDocumentColor(document.fileType)}`}>
              {getDocumentIcon(document.fileType)}
            </div>
          </div>
        )}
        
        {/* Document Info */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start gap-3">
            {!document.previewAvailable && (
              <div className={`p-2 rounded ${getDocumentColor(document.fileType)}`}>
                {getDocumentIcon(document.fileType)}
              </div>
            )}
            
            <div className="flex-1">
              <h3 
                className="text-white font-medium hover:text-yellow-400 cursor-pointer transition-colors"
                onClick={() => onSelect(document)}
              >
                {document.name}
              </h3>
              
              {document.description && (
                <p className="text-white/60 text-sm mt-1">
                  {document.description}
                </p>
              )}
              
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-white/50">
                  {formatDate(document.dateAdded)}
                </span>
                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                <span className="text-xs text-white/50 uppercase">
                  {document.fileType}
                </span>
                {document.size && (
                  <>
                    <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                    <span className="text-xs text-white/50">
                      {document.size}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(document)}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
              <span>View</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDownload(document)}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              <Download size={14} />
              <span>Download</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};